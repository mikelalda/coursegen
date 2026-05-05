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

namespace local_coursegen;

use aiprovider_birtai\httpclient\ai_course_api;


/**
 * AI Course class for managing AI-generated course planning sessions.
 *
 * @package    local_coursegen
 * @copyright  2025 Wilber Narvaez <https://birtai.com>
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
class ai_course {
    /**
     * Start AI course planning session by calling the /plan-course/start endpoint.
     *
     * @param int $courseid Course ID
     * @param string $contexttype Context type (model, syllabus or customprompt)
     * @param string|null $modelname Model name for AI processing
     * @param string $coursename Course name
     * @param string|null $promptmessage Plain text prompt summary when context type is customprompt
     * @param int $generateimages 1 indicates AI could generate images, 0 indicates AI could not generate images
     * @param string|null $lang Language code to use in the AI request
     * @param string|null $templateid Template ID to use for course structure
     * @param string|null $structuretype Override structure type (sections, topics, weeks)
     * @param int|null $numsections Number of sections to generate
     */
    public static function start_course_planning(
        int $courseid,
        string $contexttype,
        ?string $modelname,
        string $coursename,
        ?string $promptmessage = null,
        int $generateimages = 0,
        ?string $lang = null,
        ?string $templateid = null,
        ?string $structuretype = null,
        ?int $numsections = null
    ): void {
        global $CFG;

        // Prepare request data.
        $requestdata = [
            'course_id' => $courseid,
            'site_id' => md5($CFG->wwwroot),
            'context_type' => $contexttype,
            'course_name' => $coursename,
        ];

        if (!empty($modelname)) {
            $requestdata['model_name'] = $modelname;
        }

        if ($contexttype === ai_context::CONTEXT_TYPE_CUSTOM_PROMPT) {
            if (!empty($promptmessage)) {
                $requestdata['prompt_message'] = $promptmessage;
            }
        }

        // Whether the AI service should generate images for this course.
        $requestdata['generate_images'] = $generateimages === 1;
        if (!empty($lang)) {
            $requestdata['lang'] = $lang;
        }

        // Add template and module capabilities (v2 API).
        $requestdata = self::add_template_data($requestdata, $templateid, $structuretype, $numsections);

        $baseurl = get_config('local_coursegen', 'birtai_service_url') ?: null;
        $baseurleu = get_config('local_coursegen', 'birtai_service_url_eu') ?: null;

        $client = new ai_course_api(null, $baseurl, $baseurleu);
        $result = $client->request('POST', '/course/v2/start', $requestdata);

        if (!isset($result['session_id'])) {
            throw new \moodle_exception('error_starting_course_planning', 'local_coursegen');
        }

        $sessionid = $result['session_id'];

        // Store session_id in database.
        $success = self::save_course_session($courseid, $sessionid);

        if (!$success) {
            throw new \moodle_exception('error_saving_session', 'local_coursegen');
        }
    }

    /**
     * Save course planning session to database.
     *
     * @param int $courseid Course ID
     * @param string $sessionid Session ID from AI service
     * @return bool Success status
     */
    public static function save_course_session($courseid, $sessionid) {
        global $DB, $USER;

        try {
            // Check if a session already exists for this course.
            $existingsession = $DB->get_record('local_coursegen_course_sessions', [
                'courseid' => $courseid,
                'userid' => $USER->id,
            ]);

            $sessiondata = new \stdClass();
            $sessiondata->courseid = $courseid;
            $sessiondata->session_id = $sessionid;
            $sessiondata->userid = $USER->id;
            // Status: 1 planning, 2 creating, 3 created, 4 failed.
            $sessiondata->status = 1;
            $sessiondata->timemodified = time();

            if ($existingsession) {
                // Update existing session.
                $sessiondata->id = $existingsession->id;
                return $DB->update_record('local_coursegen_course_sessions', $sessiondata);
            } else {
                // Create new session record.
                $sessiondata->timecreated = time();
                return $DB->insert_record('local_coursegen_course_sessions', $sessiondata);
            }
        } catch (\Exception $e) {
            debugging("Error saving course session: " . $e->getMessage());
            return false;
        }
    }

    /**
     * Get course planning session by course ID.
     *
     * @param int $courseid Course ID
     * @return object|false Session record or false if not found
     */
    public static function get_course_session($courseid) {
        global $DB, $USER;

        try {
            return $DB->get_record('local_coursegen_course_sessions', [
                'courseid' => $courseid,
                'userid' => $USER->id,
            ]);
        } catch (\Exception $e) {
            debugging("Error getting course session: " . $e->getMessage());
            return false;
        }
    }

    /**
     * Update the status of a course session.
     *
     * @param int $sessionid Session ID
     * @param int $status Status code (1=planning, 2=creating, 3=created, 4=failed)
     */
    public static function update_session_status($sessionid, $status) {
        global $DB;

        $updatedata = new \stdClass();
        $updatedata->id = $sessionid;
        $updatedata->status = $status;
        $updatedata->timemodified = time();

        $DB->update_record('local_coursegen_course_sessions', $updatedata);
    }

    /**
     * Add template and module capability data to the API request.
     *
     * @param array $requestdata Existing request data
     * @param string|null $templateid Template ID to use
     * @param string|null $structuretype Override structure type
     * @param int|null $numsections Number of sections
     * @return array Updated request data
     */
    private static function add_template_data(
        array $requestdata,
        ?string $templateid = null,
        ?string $structuretype = null,
        ?int $numsections = null
    ): array {
        // Determine template to use.
        if (empty($templateid)) {
            $templateid = template_manager::get_default_template_id();
        }

        // Validate template exists.
        if (!template_manager::is_valid_template($templateid)) {
            $templateid = template_manager::get_default_template_id();
        }

        // Add template data.
        $templatedata = template_manager::get_api_data($templateid);
        $requestdata['template_id'] = $templatedata['template_id'];

        // Structure type override.
        if (!empty($structuretype)) {
            $requestdata['structure_type'] = $structuretype;
        } else {
            $requestdata['structure_type'] = $templatedata['structure_type'];
        }

        // Number of sections override.
        if (!empty($numsections) && $numsections > 0) {
            $requestdata['num_sections'] = $numsections;
        }

        // Add module capabilities.
        $moduledata = module_registry::get_api_data();
        $requestdata['available_moodle_modules'] = $moduledata['available_moodle_modules'];

        // Filter allowed modules based on template.
        $requestdata['allowed_module_types'] = $templatedata['allowed_module_types'];

        return $requestdata;
    }

    /**
     * Get available templates for the UI.
     *
     * @return array Templates data for rendering
     */
    public static function get_available_templates(): array {
        return template_manager::get_templates_for_mustache();
    }

    /**
     * Get available modules for the UI.
     *
     * @return array Modules configuration
     */
    public static function get_available_modules(): array {
        return module_registry::get_modules_config();
    }

    /**
     * Save a flag indicating the designer chat should open for this course.
     *
     * This stores a transient session record so that the course view page
     * JS can detect and auto-open the designer chat modal.
     *
     * @param int $courseid Course ID
     */
    public static function save_designer_flag(int $courseid): void {
        global $DB, $USER;

        $existing = $DB->get_record('local_coursegen_course_sessions', [
            'courseid' => $courseid,
            'userid' => $USER->id,
        ]);

        $sessiondata = new \stdClass();
        $sessiondata->courseid = $courseid;
        $sessiondata->session_id = 'designer_pending';
        $sessiondata->userid = $USER->id;
        // Status 5 = designer chat pending.
        $sessiondata->status = 5;
        $sessiondata->timemodified = time();

        if ($existing) {
            $sessiondata->id = $existing->id;
            $DB->update_record('local_coursegen_course_sessions', $sessiondata);
        } else {
            $sessiondata->timecreated = time();
            $DB->insert_record('local_coursegen_course_sessions', $sessiondata);
        }
    }
}
