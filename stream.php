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
// along with Moodle.  If not, see <https://www.gnu.org/licenses/>.

/**
 * Server-Sent Events stream endpoint for AI course/activity generation.
 *
 * @package    local_coursegen
 * @copyright  2025 Wilber Narvaez <https://birtai.com>
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

define('NO_DEBUG_DISPLAY', true);

require_once(__DIR__ . '/../../config.php');

use aiprovider_birtai\httpclient\ai_course_api;
use local_coursegen\module_jobs;

require_login();

$type = required_param('type', PARAM_ALPHA);
$sessionid = optional_param('session_id', '', PARAM_ALPHANUMEXT);
$jobid = optional_param('job_id', '', PARAM_ALPHANUMEXT);

$baseurl = get_config('local_coursegen', 'birtai_service_url') ?: null;
$baseurleu = get_config('local_coursegen', 'birtai_service_url_eu') ?: null;
$client = new ai_course_api(null, $baseurl, $baseurleu);

$backendurl = '';

if ($type === 'course' || $type === 'designer') {
    if ($sessionid === '') {
        local_coursegen_stream_fail(400, 'Missing session_id');
    }

    $session = $DB->get_record('local_coursegen_course_sessions', [
        'session_id' => $sessionid,
        'userid' => $USER->id,
    ]);

    if (!$session) {
        local_coursegen_stream_fail(404, 'AI session not found');
    }

    if (!empty($session->courseid) && $course = $DB->get_record('course', ['id' => $session->courseid])) {
        require_login($course);
        $context = context_course::instance($course->id);
        require_capability('moodle/course:manageactivities', $context);
    }

    if ($type === 'course') {
        $backendurl = $client->get_backend_streaming_url_for_session($sessionid);
    } else {
        $backendurl = $client->get_backend_designer_streaming_url($sessionid);
    }
} else if ($type === 'resource') {
    if ($jobid === '') {
        local_coursegen_stream_fail(400, 'Missing job_id');
    }

    $job = module_jobs::get_by_jobid($jobid);
    if (!$job || (int)$job->userid !== (int)$USER->id) {
        local_coursegen_stream_fail(404, 'AI job not found');
    }

    if (!empty($job->courseid) && $course = $DB->get_record('course', ['id' => $job->courseid])) {
        require_login($course);
        $context = context_course::instance($course->id);
        require_capability('moodle/course:manageactivities', $context);
    }

    $backendurl = $client->get_backend_mod_streaming_url_for_job($jobid);
} else {
    local_coursegen_stream_fail(400, 'Invalid stream type');
}

if (!function_exists('curl_init')) {
    local_coursegen_stream_fail(500, 'cURL extension is required for AI streaming');
}

$licensekey = get_config('aiprovider_birtai', 'licensekey');
if (empty($licensekey) && get_config('aiprovider_birtai', 'use_local_api')) {
    $licensekey = 'moodle-ollama-local';
}

\core\session\manager::write_close();

ignore_user_abort(true);
@set_time_limit(0);
if (function_exists('apache_setenv')) {
    @apache_setenv('no-gzip', '1');
}
@ini_set('zlib.output_compression', '0');
@ini_set('output_buffering', 'off');

while (ob_get_level() > 0) {
    @ob_end_flush();
}

header('Content-Type: text/event-stream; charset=utf-8');
header('Cache-Control: no-cache');
header('Connection: keep-alive');
header('X-Accel-Buffering: no');

echo ": connected\n\n";
@ob_flush();
flush();

$headers = [
    'Accept: text/event-stream',
    'Cache-Control: no-cache',
];
if (!empty($licensekey)) {
    $headers[] = 'License-Key: ' . $licensekey;
}

$sentdata = false;
$ch = curl_init($backendurl);
curl_setopt_array($ch, [
    CURLOPT_HTTPHEADER => $headers,
    CURLOPT_FOLLOWLOCATION => true,
    CURLOPT_RETURNTRANSFER => false,
    CURLOPT_HEADER => false,
    CURLOPT_CONNECTTIMEOUT => 15,
    CURLOPT_TIMEOUT => 0,
    CURLOPT_WRITEFUNCTION => static function ($curl, $data) use (&$sentdata) {
        $sentdata = true;
        echo $data;
        @ob_flush();
        flush();
        return strlen($data);
    },
]);

curl_exec($ch);

$httpcode = (int)curl_getinfo($ch, CURLINFO_RESPONSE_CODE);
if (curl_errno($ch)) {
    local_coursegen_stream_send_error(curl_error($ch));
} else if ($httpcode >= 400 && !$sentdata) {
    local_coursegen_stream_send_error('Backend stream returned HTTP ' . $httpcode);
}

curl_close($ch);
exit;

/**
 * Fail before starting SSE output.
 *
 * @param int $statuscode HTTP status code.
 * @param string $message Error message.
 * @return void
 * @package local_coursegen
 */
function local_coursegen_stream_fail(int $statuscode, string $message): void {
    http_response_code($statuscode);
    header('Content-Type: text/plain; charset=utf-8');
    echo $message;
    exit;
}

/**
 * Emit an SSE error event after the stream has started.
 *
 * @param string $message Error message.
 * @return void
 * @package local_coursegen
 */
function local_coursegen_stream_send_error(string $message): void {
    $lines = preg_split('/\r\n|\r|\n/', $message) ?: ['Unknown streaming error'];
    echo "event: error\n";
    foreach ($lines as $line) {
        echo 'data: ' . $line . "\n";
    }
    echo "\n";
    @ob_flush();
    flush();
}
