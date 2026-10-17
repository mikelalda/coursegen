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
 * Download a file of the FP Euskadi Designer session (design document, Excel, Word).
 *
 * The backend is not reachable from the browser, so the file is fetched here
 * and sent to the user.
 *
 * @package    local_coursegen
 * @copyright  2026 Mikel Aldalur
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

require_once(__DIR__ . '/../../config.php');
require_once($CFG->libdir . '/filelib.php');

use aiprovider_birtai\httpclient\ai_course_api;

$courseid = required_param('courseid', PARAM_INT);
$name = required_param('name', PARAM_FILE);

$course = get_course($courseid);
require_login($course);
require_capability('moodle/course:update', context_course::instance($course->id));

$session = $DB->get_record('local_coursegen_course_sessions', [
    'courseid' => $course->id,
    'userid' => $USER->id,
], '*', MUST_EXIST);

$baseurl = get_config('local_coursegen', 'birtai_service_url') ?: null;
$baseurleu = get_config('local_coursegen', 'birtai_service_url_eu') ?: null;
$client = new ai_course_api(null, $baseurl, $baseurleu);

// Explicit '&': Moodle sets arg_separator.output to '&amp;'.
$query = ['session_id' => $session->session_id, 'name' => $name, 'userid' => $USER->id];
$endpoint = '/designer/chat/file?' . http_build_query($query, '', '&');
$file = $client->download_file($endpoint, $name);
if (!$file) {
    throw new moodle_exception('filenotfound', 'error');
}

// Only a temporary copy in the user's draft area: send it and drop it.
$content = $file->get_content();
$mimetype = $file->get_mimetype();
$file->delete();

send_file($content, $name, 0, 0, true, true, $mimetype);
