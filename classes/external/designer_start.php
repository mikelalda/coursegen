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
        ]);
    }

    /**
     * Start a designer chat session.
     *
     * @param int $courseid Course ID
     * @return array Result with session_id and streaming URL
     */
    public static function execute($courseid) {
        global $DB, $USER;

        try {
            $params = self::validate_parameters(self::execute_parameters(), [
                'courseid' => $courseid,
            ]);
            $courseid = $params['courseid'];

            $course = $DB->get_record('course', ['id' => $courseid], '*', MUST_EXIST);
            $context = context_course::instance($courseid);
            self::validate_context($context);
            require_capability('moodle/course:update', $context);

            // Call the designer chat/start endpoint.
            $requestdata = [
                'course_name' => $course->fullname,
                'course_id' => $courseid,
                'lang' => ai_context::resolve_language($courseid),
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

            $existing = $DB->get_record('local_coursegen_course_sessions', [
                'courseid' => $courseid,
                'userid' => $USER->id,
            ]);
            if ($existing) {
                $sessiondata->id = $existing->id;
                $DB->update_record('local_coursegen_course_sessions', $sessiondata);
            } else {
                $sessiondata->timecreated = time();
                $DB->insert_record('local_coursegen_course_sessions', $sessiondata);
            }

            // Build streaming URL from our backend.
            $streamingurl = $client->get_designer_streaming_url($result['session_id']);

            return [
                'success' => true,
                'message' => get_string('designer_session_started', 'local_coursegen'),
                'data' => [
                    'session_id' => $result['session_id'],
                    'streamingurl' => $streamingurl,
                ],
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
                'streamingurl' => new external_value(PARAM_URL, 'Streaming URL for chat', VALUE_OPTIONAL),
            ], 'Session data', VALUE_OPTIONAL, null, NULL_ALLOWED),
        ]);
    }
}
