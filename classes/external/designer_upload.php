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
 * External API to attach a document to the FP Euskadi Designer chat.
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
use context_course;

/**
 * Upload a document to the designer session; it is attached to the next message.
 */
class designer_upload extends external_api {
    /** @var int Maximum decoded file size, in bytes (same limit as the backend). */
    const MAX_BYTES = 10 * 1024 * 1024;

    /** @var string[] Extensions the backend can extract text from. */
    const EXTENSIONS = ['pdf', 'docx', 'xlsx', 'txt', 'md', 'markdown', 'csv', 'json', 'html', 'htm'];

    /**
     * Returns description of method parameters.
     *
     * @return external_function_parameters
     */
    public static function execute_parameters() {
        return new external_function_parameters([
            'courseid' => new external_value(PARAM_INT, 'Course ID'),
            'filename' => new external_value(PARAM_FILE, 'Original file name'),
            'content' => new external_value(PARAM_RAW, 'File content, base64 encoded'),
        ]);
    }

    /**
     * Send the file to the designer backend.
     *
     * @param int $courseid Course ID
     * @param string $filename Original file name
     * @param string $content Base64 encoded file content
     * @return array Result with the attachment id and summary
     */
    public static function execute($courseid, $filename, $content) {
        global $DB, $USER;

        try {
            $params = self::validate_parameters(self::execute_parameters(), [
                'courseid' => $courseid,
                'filename' => $filename,
                'content' => $content,
            ]);

            $context = context_course::instance($params['courseid']);
            self::validate_context($context);
            require_capability('moodle/course:update', $context);

            $filename = clean_filename($params['filename']);
            $extension = strtolower(pathinfo($filename, PATHINFO_EXTENSION));
            if ($filename === '' || !in_array($extension, self::EXTENSIONS, true)) {
                return self::error(get_string('designer_attach_badtype', 'local_coursegen', implode(', ', self::EXTENSIONS)));
            }

            $bytes = base64_decode($params['content'], true);
            if ($bytes === false || $bytes === '') {
                return self::error(get_string('designer_attach_empty', 'local_coursegen'));
            }
            if (strlen($bytes) > self::MAX_BYTES) {
                return self::error(get_string('designer_attach_toobig', 'local_coursegen', display_size(self::MAX_BYTES)));
            }

            $session = $DB->get_record('local_coursegen_course_sessions', [
                'courseid' => $params['courseid'],
                'userid' => $USER->id,
            ]);
            if (!$session) {
                return self::error(get_string('error_no_session_found', 'local_coursegen', $params['courseid']));
            }

            // A scanned PDF is transcribed page by page by the vision model (tens of
            // seconds per page): do not let PHP's time limit cut the upload short.
            \core_php_time_limit::raise(900);

            $filepath = make_request_directory() . '/' . $filename;
            file_put_contents($filepath, $bytes);

            $baseurl = get_config('local_coursegen', 'birtai_service_url') ?: null;
            $baseurleu = get_config('local_coursegen', 'birtai_service_url_eu') ?: null;
            $client = new ai_course_api(null, $baseurl, $baseurleu);
            $result = $client->upload_file('/designer/chat/attachment', $filepath, null, $filename, [
                'session_id' => $session->session_id,
            ]);

            if (empty($result['id'])) {
                return self::error($result['detail'] ?? get_string('designer_attach_failed', 'local_coursegen'));
            }

            return [
                'success' => true,
                'message' => '',
                'data' => [
                    'id' => (string)$result['id'],
                    'name' => (string)($result['name'] ?? $filename),
                    'pages' => (int)($result['pages'] ?? 0),
                    'chars' => (int)($result['chars'] ?? 0),
                ],
            ];
        } catch (\Exception $e) {
            return self::error($e->getMessage());
        }
    }

    /**
     * Build an error result.
     *
     * @param string $message Error message
     * @return array
     */
    private static function error(string $message): array {
        return [
            'success' => false,
            'message' => $message,
            'data' => null,
        ];
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
            'data' => new external_single_structure([
                'id' => new external_value(PARAM_ALPHANUM, 'Attachment ID to send with the next message'),
                'name' => new external_value(PARAM_FILE, 'File name'),
                'pages' => new external_value(PARAM_INT, 'Pages (PDF), 0 otherwise'),
                'chars' => new external_value(PARAM_INT, 'Extracted characters'),
            ], 'Attachment data', VALUE_OPTIONAL, null, NULL_ALLOWED),
        ]);
    }
}
