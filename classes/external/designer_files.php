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
 * External API listing the files of the FP Euskadi Designer session.
 *
 * @package    local_coursegen
 * @copyright  2026 Mikel Aldalur
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
use moodle_url;

/**
 * List the design document and the generated Excel/Word files, with download links.
 *
 * The teacher can download them, work on them offline and attach them again to
 * the same conversation or to a new one to carry on.
 */
class designer_files extends external_api {
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
     * List the files of the current designer session.
     *
     * @param int $courseid Course ID
     * @return array Result with the file list
     */
    public static function execute($courseid) {
        global $DB, $USER;

        try {
            $params = self::validate_parameters(self::execute_parameters(), ['courseid' => $courseid]);
            $context = context_course::instance($params['courseid']);
            self::validate_context($context);
            require_capability('moodle/course:update', $context);

            $session = $DB->get_record('local_coursegen_course_sessions', [
                'courseid' => $params['courseid'],
                'userid' => $USER->id,
            ]);
            if (!$session) {
                return ['success' => true, 'message' => '', 'files' => []];
            }

            $baseurl = get_config('local_coursegen', 'birtai_service_url') ?: null;
            $baseurleu = get_config('local_coursegen', 'birtai_service_url_eu') ?: null;
            $client = new ai_course_api(null, $baseurl, $baseurleu);
            // The birtai client adds userid to POST bodies only; the backend checks the owner.
            $result = $client->request('GET', '/designer/chat/files', [
                'session_id' => $session->session_id,
                'userid' => $USER->id,
            ]);

            $files = [];
            foreach ($result['files'] ?? [] as $file) {
                $name = clean_param($file['name'] ?? '', PARAM_FILE);
                if ($name === '') {
                    continue;
                }
                $files[] = [
                    'name' => $name,
                    'kind' => in_array($file['kind'] ?? '', ['design', 'version'], true) ? $file['kind'] : 'generated',
                    'size' => (int)($file['size'] ?? 0),
                    'modified' => (int)($file['modified'] ?? 0),
                    'url' => (new moodle_url('/local/coursegen/designer_file.php', [
                        'courseid' => $params['courseid'],
                        'name' => $name,
                    ]))->out(false),
                ];
            }

            return ['success' => true, 'message' => '', 'files' => $files];
        } catch (\Exception $e) {
            return ['success' => false, 'message' => $e->getMessage(), 'files' => []];
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
            'message' => new external_value(PARAM_TEXT, 'Error message'),
            'files' => new external_multiple_structure(
                new external_single_structure([
                    'name' => new external_value(PARAM_FILE, 'File name'),
                    'kind' => new external_value(
                        PARAM_ALPHA,
                        'design (editable document), version (Excel, one sheet per phase) or generated'
                    ),
                    'size' => new external_value(PARAM_INT, 'Size in bytes'),
                    'modified' => new external_value(PARAM_INT, 'Last modification timestamp'),
                    'url' => new external_value(PARAM_URL, 'Download URL'),
                ])
            ),
        ]);
    }
}
