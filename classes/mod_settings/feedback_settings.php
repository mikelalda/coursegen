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

use local_coursegen\mod_settings\feedback\presentation_builder;

/**
 * Class feedback_settings
 *
 * @package    local_coursegen
 * @copyright  2025 Wilber Narvaez <https://birtai.com>
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
class feedback_settings extends base_settings {
    /**
     * Add specific settings for feedback module.
     */
    public function add_settings() {
        global $DB, $CFG;

        require_once($CFG->dirroot . '/mod/feedback/lib.php');

        foreach ($this->modsettings['questions'] as $question) {
            $this->add_question($question);
        }
    }

    /**
     * Add question to feedback.
     *
     * @param array $question Question data.
     * @return \stdClass Question info.
     */
    protected function add_question($question) {
        global $DB;
        $question = $this->normalize_question($question);
        $type = $question['typ'];
        $itemobj = feedback_get_item_class($type);

        $position = $DB->count_records('feedback_item', ['feedback' => $this->cm->instance]) + 1;
        $question['position'] = $position;

        $presentationbuilder = new presentation_builder();
        $presentation = $presentationbuilder->build((object)$question);
        if (!empty($presentation)) {
            $question['presentation'] = $presentation;
        }

        $question['cmid'] = $this->cm->coursemodule;
        $question['feedback'] = $this->cm->instance;

        $itemobj->set_data((object) $question);
        return $itemobj->save_item();
    }

    /**
     * Fill defaults expected by feedback item handlers.
     *
     * @param array $question Question data.
     * @return array
     */
    private function normalize_question(array $question): array {
        $defaults = [
            'id' => 0,
            'ignoreempty' => 0,
            'hidenoselect' => 0,
            'required' => 0,
            'name' => '',
            'label' => '',
            'values' => '',
            'options' => '',
        ];

        foreach ($defaults as $field => $value) {
            if (!array_key_exists($field, $question) || $question[$field] === null) {
                $question[$field] = $value;
            }
        }

        if (in_array($question['typ'], ['multichoice', 'multichoicerated'], true)
                && empty($question['options']) && !empty($question['values'])) {
            $question['options'] = $question['values'];
        }

        if ($question['typ'] === 'textarea') {
            if (!isset($question['itemwidth']) || $question['itemwidth'] === null) {
                $question['itemwidth'] = 60;
            }
            if (!isset($question['itemheight']) || $question['itemheight'] === null) {
                $question['itemheight'] = 5;
            }
        }

        if ($question['typ'] === 'textfield') {
            if (!isset($question['itemsize']) || $question['itemsize'] === null) {
                $question['itemsize'] = 50;
            }
            if (!isset($question['itemmaxlength']) || $question['itemmaxlength'] === null) {
                $question['itemmaxlength'] = 255;
            }
        }

        return $question;
    }
}
