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
 * External API for executing AI course planning sessions.
 *
 * @package    local_coursegen
 * @copyright  2025 Wilber Narvaez <https://birtai.com>
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

namespace local_coursegen\external;

use aiprovider_birtai\httpclient\ai_course_api;
use local_coursegen\ai_context;
use local_coursegen\module_registry;
use local_coursegen\template_manager;

defined('MOODLE_INTERNAL') || die();

require_once($CFG->libdir . '/externallib.php');

use external_api;
use external_function_parameters;
use external_value;
use external_single_structure;
use context_course;
use moodle_exception;

/**
 * External API for executing AI course planning sessions.
 */
class plan_course_execute extends external_api {
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
     * Execute AI course planning session.
     *
     * @param int $courseid Course ID
     * @return array Result of the execution
     * @throws moodle_exception
     */
    public static function execute($courseid) {
        global $CFG, $DB, $USER;

        try {
            $params = self::validate_parameters(self::execute_parameters(), [
                'courseid' => $courseid,
            ]);

            $courseid = $params['courseid'];

            // Validate context and permissions.
            $course = $DB->get_record('course', ['id' => $courseid], '*', MUST_EXIST);
            $context = context_course::instance($courseid);
            self::validate_context($context);
            // Check if user has permission to edit the course.
            require_capability('moodle/course:update', $context);

            // Validate that a session exists for this course and user.
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

            $lang = ai_context::resolve_language($courseid);

            $baseurl = get_config('local_coursegen', 'birtai_service_url') ?: null;
            $baseurleu = get_config('local_coursegen', 'birtai_service_url_eu') ?: null;

            $client = new ai_course_api(null, $baseurl, $baseurleu);

            $sessionid = $session->session_id;
            if ((int)$session->status === 5) {
                $templateid = template_manager::get_default_template_id();
                $templatedata = template_manager::get_api_data($templateid);
                $moduledata = module_registry::get_api_data();
                $exportpayload = [
                    'session_id' => $sessionid,
                    'lang' => $lang,
                    'course_id' => $courseid,
                    'site_id' => md5($CFG->wwwroot),
                    'template_id' => $templatedata['template_id'],
                    'structure_type' => $templatedata['structure_type'],
                    'available_moodle_modules' => $moduledata['available_moodle_modules'],
                    'allowed_module_types' => $templatedata['allowed_module_types'],
                ];

                $exportresult = $client->request('POST', '/designer/export-course-plan', $exportpayload);
                if (empty($exportresult['session_id'])) {
                    return [
                        'success' => false,
                        'message' => 'Unable to convert designer session into a course planning session',
                        'data' => null,
                    ];
                }

                $sessionid = $exportresult['session_id'];
                $session->session_id = $sessionid;
                $session->status = 2;
                $session->timemodified = time();
                $DB->update_record('local_coursegen_course_sessions', $session);
            }

            $requestdata = [
                'session_id' => $sessionid,
            ];
            $requestdata['lang'] = $lang;

            $result = $client->request('POST', '/course/execute', $requestdata);

            $session->status = 2;
            $session->timemodified = time();
            $DB->update_record('local_coursegen_course_sessions', $session);

            // Build streaming URL and return success response with API status.
            $streamingurl = $client->get_streaming_url_for_session($sessionid);
            return [
                'success' => true,
                'message' => $result['message'],
                'data' => [
                    'status' => $result['status'],
                    'streamingurl' => $streamingurl,
                ],
            ];
        } catch (\Exception $e) {
            debugging("Unexpected error while executing course planning: " . $e->getMessage(), DEBUG_DEVELOPER, $e->getTrace());
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
                'status' => new external_value(PARAM_TEXT, 'API status response', VALUE_OPTIONAL),
                'streamingurl' => new external_value(PARAM_URL, 'Streaming URL to reconnect', VALUE_OPTIONAL),
            ], 'Api response data', VALUE_OPTIONAL, null, NULL_ALLOWED),
        ]);
    }
}
