<?php
// This file is part of Moodle - http://moodle.org/
//
// Moodle is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// Moodle is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with Moodle.  If not, see <http://www.gnu.org/licenses/>.

namespace local_coursegen\mod_settings;

defined('MOODLE_INTERNAL') || die();

require_once($CFG->dirroot . '/mod/lesson/locallib.php');

/**
 * Class lesson_settings
 *
 * Handles post-creation settings for lesson modules.
 * Creates lesson pages and answers after the lesson module exists.
 *
 * @package    local_coursegen
 * @copyright  2025 BirtAI <https://birtai.com>
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
class lesson_settings extends base_settings {

    /**
     * Add specific settings for the lesson module.
     *
     * Creates lesson pages from the AI-generated content.
     */
    public function add_settings() {
        global $DB;

        if (!isset($this->modsettings['pages']) || !isset($this->modsettings['create_lesson_pages'])) {
            return;
        }

        $pages = $this->modsettings['pages'];
        if (empty($pages)) {
            return;
        }

        // Get the lesson record.
        $lesson = $DB->get_record('lesson', ['id' => $this->cm->instance], '*', MUST_EXIST);
        $lessonobj = new \lesson($lesson);

        $prevpageid = 0;
        $createdpages = [];

        foreach ($pages as $index => $pagedata) {
            $page = $this->create_lesson_page($lessonobj, $pagedata, $prevpageid, $index);
            if ($page) {
                $createdpages[] = $page;
                $prevpageid = $page->id;
            }
        }

        // Update jumpto values to point to actual page IDs.
        $this->update_jump_references($createdpages, $pages);
    }

    /**
     * Create a single lesson page.
     *
     * @param \lesson $lesson Lesson object
     * @param array $pagedata Page data from AI
     * @param int $prevpageid Previous page ID
     * @param int $index Page index
     * @return object|null Created page or null on failure
     */
    private function create_lesson_page(\lesson $lesson, array $pagedata, int $prevpageid, int $index): ?object {
        global $DB;

        $type = $pagedata['type'] ?? 'content';
        $qtype = $pagedata['qtype'] ?? ($type === 'content' ? LESSON_PAGE_BRANCHTABLE : LESSON_PAGE_MULTICHOICE);

        $page = new \stdClass();
        $page->lessonid = $lesson->id;
        $page->prevpageid = $prevpageid;
        $page->nextpageid = 0;  // Will be updated when next page is created.
        $page->qtype = $qtype;
        $page->qoption = 0;
        $page->layout = 1;
        $page->display = 1;
        $page->timecreated = time();
        $page->timemodified = time();
        $page->title = $pagedata['title'] ?? 'Page ' . ($index + 1);
        $page->contents = $pagedata['content'] ?? '';
        $page->contentsformat = FORMAT_HTML;

        try {
            $page->id = $DB->insert_record('lesson_pages', $page);

            // Update previous page's nextpageid.
            if ($prevpageid > 0) {
                $DB->set_field('lesson_pages', 'nextpageid', $page->id, ['id' => $prevpageid]);
            }

            // Create answers for this page.
            $this->create_page_answers($lesson, $page, $pagedata);

            return $page;
        } catch (\Exception $e) {
            debugging('Error creating lesson page: ' . $e->getMessage());
            return null;
        }
    }

    /**
     * Create answers for a lesson page.
     *
     * @param \lesson $lesson Lesson object
     * @param object $page Page object
     * @param array $pagedata Page data from AI
     */
    private function create_page_answers(\lesson $lesson, object $page, array $pagedata): void {
        global $DB;

        $answers = $pagedata['answers'] ?? [];

        if (empty($answers)) {
            // For content pages, create a default "Continue" answer.
            if ($page->qtype == LESSON_PAGE_BRANCHTABLE) {
                $answers = [
                    ['text' => 'Continue', 'score' => 0, 'jumpto' => LESSON_NEXTPAGE, 'response' => '']
                ];
            }
        }

        foreach ($answers as $index => $answerdata) {
            $answer = new \stdClass();
            $answer->lessonid = $lesson->id;
            $answer->pageid = $page->id;
            $answer->jumpto = $this->normalize_jumpto($answerdata['jumpto'] ?? LESSON_NEXTPAGE);
            $answer->grade = $answerdata['score'] ?? 0;
            $answer->score = $answerdata['score'] ?? 0;
            $answer->flags = 0;
            $answer->timecreated = time();
            $answer->timemodified = time();
            $answer->answer = $answerdata['text'] ?? '';
            $answer->answerformat = FORMAT_HTML;
            $answer->response = $answerdata['response'] ?? '';
            $answer->responseformat = FORMAT_HTML;

            try {
                $DB->insert_record('lesson_answers', $answer);
            } catch (\Exception $e) {
                debugging('Error creating lesson answer: ' . $e->getMessage());
            }
        }
    }

    /**
     * Normalize jumpto value.
     *
     * @param mixed $jumpto Jump value from AI
     * @return int Normalized jump value
     */
    private function normalize_jumpto($jumpto): int {
        if (is_numeric($jumpto)) {
            return (int)$jumpto;
        }

        // Handle string values.
        switch ($jumpto) {
            case 'next':
                return LESSON_NEXTPAGE;
            case 'previous':
                return LESSON_PREVIOUSPAGE;
            case 'end':
                return LESSON_EOL;
            case 'this':
                return LESSON_THISPAGE;
            default:
                return LESSON_NEXTPAGE;
        }
    }

    /**
     * Update jump references to point to actual page IDs.
     *
     * @param array $createdpages Created page objects
     * @param array $originalpages Original page data
     */
    private function update_jump_references(array $createdpages, array $originalpages): void {
        global $DB;

        // Build a mapping from index to page ID.
        $indextopage = [];
        foreach ($createdpages as $index => $page) {
            $indextopage[$index] = $page->id;
        }

        // Update answers that reference specific page indices.
        foreach ($createdpages as $index => $page) {
            $answers = $DB->get_records('lesson_answers', ['pageid' => $page->id]);

            foreach ($answers as $answer) {
                // If jumpto is a positive number, it might be a page index.
                if ($answer->jumpto > 0 && isset($indextopage[$answer->jumpto])) {
                    $answer->jumpto = $indextopage[$answer->jumpto];
                    $DB->update_record('lesson_answers', $answer);
                }
            }
        }
    }
}
