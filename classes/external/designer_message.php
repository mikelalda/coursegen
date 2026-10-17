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
 * External API for sending messages to a FP Euskadi Designer chat session.
 *
 * @package    local_coursegen
 * @copyright  2025 Wilber Narvaez <https://birtai.com>
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

namespace local_coursegen\external;

use aiprovider_birtai\httpclient\ai_course_api;

defined('MOODLE_INTERNAL') || die();

require_once($CFG->libdir . '/externallib.php');

use external_api;
use external_function_parameters;
use external_value;
use external_single_structure;
use external_multiple_structure;
use context_course;

/**
 * External API for sending messages to the designer chat.
 */
class designer_message extends external_api {
    /**
     * Returns description of method parameters.
     *
     * @return external_function_parameters
     */
    public static function execute_parameters() {
        return new external_function_parameters([
            'courseid' => new external_value(PARAM_INT, 'Course ID'),
            'text' => new external_value(PARAM_TEXT, 'Message text (may be empty when sending attachments)', VALUE_DEFAULT, ''),
            'attachmentids' => new external_multiple_structure(
                new external_value(PARAM_ALPHANUM, 'Attachment ID returned by designer_upload'),
                'Attachments sent with this message',
                VALUE_DEFAULT,
                []
            ),
        ]);
    }

    /**
     * Send a message to the designer chat session.
     *
     * @param int $courseid Course ID
     * @param string $text Message text
     * @param array $attachmentids Attachment IDs returned by designer_upload
     * @return array Result with streaming URL
     */
    public static function execute($courseid, $text = '', $attachmentids = []) {
        global $DB, $USER;

        try {
            $params = self::validate_parameters(self::execute_parameters(), [
                'courseid' => $courseid,
                'text' => $text,
                'attachmentids' => $attachmentids,
            ]);
            $courseid = $params['courseid'];
            $text = $params['text'];
            $attachmentids = $params['attachmentids'];

            $course = $DB->get_record('course', ['id' => $courseid], '*', MUST_EXIST);
            $context = context_course::instance($courseid);
            self::validate_context($context);
            require_capability('moodle/course:update', $context);

            // Get existing session.
            $session = $DB->get_record('local_coursegen_course_sessions', [
                'courseid' => $courseid,
                'userid' => $USER->id,
            ]);

            if (!$session) {
                return [
                    'success' => false,
                    'message' => get_string('error_no_session_found', 'local_coursegen', $courseid),
                    'data' => null,
                ];
            }

            // Send message to designer chat.
            $requestdata = [
                'session_id' => $session->session_id,
                'text' => $text,
                'attachment_ids' => array_values($attachmentids),
            ];

            $baseurl = get_config('local_coursegen', 'birtai_service_url') ?: null;
            $baseurleu = get_config('local_coursegen', 'birtai_service_url_eu') ?: null;

            $client = new ai_course_api(null, $baseurl, $baseurleu);
            $result = $client->request('POST', '/designer/chat/message', $requestdata);

            $streamingurl = $client->get_designer_streaming_url($session->session_id);

            return [
                'success' => true,
                'message' => get_string('message_sent_successfully', 'local_coursegen'),
                'data' => [
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
                'streamingurl' => new external_value(PARAM_URL, 'Streaming URL', VALUE_OPTIONAL),
            ], 'Response data', VALUE_OPTIONAL, null, NULL_ALLOWED),
        ]);
    }
}
