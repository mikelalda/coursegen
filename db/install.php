<?php
// This file is part of Moodle - https://moodle.org/
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
 * Code to be executed after the plugin's database scheme has been installed is defined here.
 *
 * @package     local_coursegen
 * @category    upgrade
 * @copyright   2025 Josue Condori <https://birtai.com>
 * @license     https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

/**
 * Custom code to be run on installing the plugin.
 */
function xmldb_local_coursegen_install() {
    global $CFG, $DB;

    // Install base system instruction if it doesn't exist.
    local_coursegen_install_base_system_instruction();

    return true;
}

/**
 * Install the base system instruction from the fixtures file.
 *
 * @return bool True if installed successfully, false otherwise.
 */
function local_coursegen_install_base_system_instruction() {
    global $CFG, $DB;

    $baseinstructionname = get_string('basesysteminstructionname', 'local_coursegen');

    // Check if base instruction already exists.
    $existing = $DB->get_record('local_coursegen_system_instruction', [
        'name' => $baseinstructionname,
        'deleted' => 0,
    ]);

    if ($existing) {
        // Base instruction already exists.
        return true;
    }

    // Load content from fixtures file.
    $fixturepath = $CFG->dirroot . '/local/coursegen/fixtures/base_system_instruction.md';
    if (!file_exists($fixturepath)) {
        debugging('Base system instruction fixture file not found: ' . $fixturepath, DEBUG_DEVELOPER);
        return false;
    }

    $content = file_get_contents($fixturepath);
    if ($content === false) {
        debugging('Failed to read base system instruction fixture file', DEBUG_DEVELOPER);
        return false;
    }

    // Convert Markdown to HTML for storage.
    $content = format_text($content, FORMAT_MARKDOWN, ['trusted' => true, 'noclean' => true]);

    // Create the base system instruction.
    $now = time();
    $record = new stdClass();
    $record->name = $baseinstructionname;
    $record->content = $content;
    $record->deleted = 0;
    $record->timecreated = $now;
    $record->timemodified = $now;
    $record->usermodified = get_admin()->id;

    try {
        $DB->insert_record('local_coursegen_system_instruction', $record);
        return true;
    } catch (Exception $e) {
        debugging('Failed to install base system instruction: ' . $e->getMessage(), DEBUG_DEVELOPER);
        return false;
    }
}
