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

/**
 * External API to start a FP Euskadi Designer interactive chat session.
 *
 * @package    local_coursegen
 * @copyright  2025 Wilber Narvaez <https://birtai.com>
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

namespace local_coursegen\external;

use aiprovider_birtai\httpclient\ai_course_api;
use local_coursegen\ai_context;

defined('MOODLE_INTERNAL') || die();

require_once($CFG->libdir . '/externallib.php');

use external_api;
use external_function_parameters;
use external_value;
use external_single_structure;
use external_multiple_structure;
use context_course;

/**
 * External API to start a designer chat session.
 */
class designer_start extends external_api {
    /**
     * Returns description of method parameters.
     *
     * @return external_function_parameters
     */
    public static function execute_parameters() {
        return new external_function_parameters([
            'courseid' => new external_value(PARAM_INT, 'Course ID'),
            'newsession' => new external_value(PARAM_BOOL, 'Start a new conversation instead of resuming', VALUE_DEFAULT, false),
            'lang' => new external_value(PARAM_ALPHA, 'Change the AI language of the course (es, eu, en); empty keeps it',
                VALUE_DEFAULT, ''),
        ]);
    }

    /**
     * Start a designer chat session, or resume the saved one.
     *
     * @param int $courseid Course ID
     * @param bool $newsession Discard the saved conversation and start again
     * @param string $lang New AI language for the course, chosen in the chat ('' keeps the current one)
     * @return array Result with session_id and either a streaming URL (new) or the history (resumed)
     */
    public static function execute($courseid, $newsession = false, $lang = '') {
        global $DB, $USER;

        try {
            $params = self::validate_parameters(self::execute_parameters(), [
                'courseid' => $courseid,
                'newsession' => $newsession,
                'lang' => $lang,
            ]);
            $courseid = $params['courseid'];

            $course = $DB->get_record('course', ['id' => $courseid], '*', MUST_EXIST);
            $context = context_course::instance($courseid);
            self::validate_context($context);
            require_capability('moodle/course:update', $context);

            // Language chosen in the chat: it becomes the course's AI language
            // (also for course generation), as if set in the course settings.
            if ($params['lang'] !== '') {
                ai_context::set_course_language($courseid, $params['lang']);
            }
            $language = ai_context::resolve_language($courseid);

            $existing = $DB->get_record('local_coursegen_course_sessions', [
                'courseid' => $courseid,
                'userid' => $USER->id,
            ]);

            // Call the designer chat/start endpoint. The backend resumes the
            // saved conversation unless a new one is requested.
            $requestdata = [
                'course_name' => $course->fullname,
                'course_id' => $courseid,
                'lang' => $language,
                'session_id' => $existing ? (string)$existing->session_id : '',
                'new_session' => (bool)$params['newsession'],
            ];

            $baseurl = get_config('local_coursegen', 'birtai_service_url') ?: null;
            $baseurleu = get_config('local_coursegen', 'birtai_service_url_eu') ?: null;

            $client = new ai_course_api(null, $baseurl, $baseurleu);
            $result = $client->request('POST', '/designer/chat/start', $requestdata);

            if (empty($result['session_id'])) {
                return [
                    'success' => false,
                    'message' => get_string('error_starting_course_planning', 'local_coursegen'),
                    'data' => null,
                ];
            }

            // Store the designer session in the database.
            $sessiondata = new \stdClass();
            $sessiondata->courseid = $courseid;
            $sessiondata->session_id = $result['session_id'];
            $sessiondata->userid = $USER->id;
            $sessiondata->status = 5; // Designer chat pending/active.
            $sessiondata->timemodified = time();

            if ($existing) {
                $sessiondata->id = $existing->id;
                $DB->update_record('local_coursegen_course_sessions', $sessiondata);
            } else {
                $sessiondata->timecreated = time();
                $DB->insert_record('local_coursegen_course_sessions', $sessiondata);
            }

            $data = [
                'session_id' => $result['session_id'],
                'lang' => $language,
                'resumed' => ($result['status'] ?? '') === 'chat_resumed',
                'readytogenerate' => !empty($result['ready_to_generate']),
                'history' => [],
            ];
            if ($data['resumed']) {
                foreach ($result['history'] ?? [] as $item) {
                    $data['history'][] = [
                        'role' => ($item['role'] ?? '') === 'user' ? 'user' : 'ai',
                        'content' => (string)($item['content'] ?? ''),
                        'attachments' => array_values(array_map('strval', $item['attachments'] ?? [])),
                    ];
                }
            } else {
                // New session: the greeting is streamed.
                $data['streamingurl'] = $client->get_designer_streaming_url($result['session_id']);
            }

            return [
                'success' => true,
                'message' => get_string('designer_session_started', 'local_coursegen'),
                'data' => $data,
            ];
        } catch (\Exception $e) {
            return [
                'success' => false,
                'message' => $e->getMessage(),
                'data' => null,
            ];
        }
    }

    /**
     * Returns description of method return value.
     *
     * @return external_single_structure
     */
    public static function execute_returns() {
        return new external_single_structure([
            'success' => new external_value(PARAM_BOOL, 'Success status'),
            'message' => new external_value(PARAM_TEXT, 'Status message'),
            'data' => new external_single_structure([
                'session_id' => new external_value(PARAM_TEXT, 'Designer session ID', VALUE_OPTIONAL),
                'streamingurl' => new external_value(PARAM_URL, 'Streaming URL for the greeting (new sessions)', VALUE_OPTIONAL),
                'lang' => new external_value(PARAM_ALPHA, 'Language of the conversation', VALUE_OPTIONAL),
                'resumed' => new external_value(PARAM_BOOL, 'A saved conversation was resumed', VALUE_OPTIONAL),
                'readytogenerate' => new external_value(PARAM_BOOL, 'The design can be turned into a course', VALUE_OPTIONAL),
                'history' => new external_multiple_structure(
                    new external_single_structure([
                        'role' => new external_value(PARAM_ALPHA, 'user or ai'),
                        // Markdown/HTML from the designer; the JS escapes user text when rendering.
                        'content' => new external_value(PARAM_RAW, 'Message content'),
                        'attachments' => new external_multiple_structure(
                            new external_value(PARAM_TEXT, 'Attached file name'),
                            'Files attached to the message',
                            VALUE_DEFAULT,
                            []
                        ),
                    ]),
                    'Previous messages of a resumed conversation',
                    VALUE_OPTIONAL
                ),
            ], 'Session data', VALUE_OPTIONAL, null, NULL_ALLOWED),
        ]);
    }
}
