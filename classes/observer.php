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

/**
 * Event observers of local_coursegen.
 *
 * @package    local_coursegen
 * @copyright  2026 Mikel Aldalur
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
class observer {
    /** @var string[] Plugin tables keyed by course. */
    const COURSE_TABLES = [
        'local_coursegen_course_data',
        'local_coursegen_course_context',
        'local_coursegen_course_sessions',
        'local_coursegen_module_jobs',
    ];

    /**
     * Forget the AI data of a deleted course.
     *
     * The designer conversations on the AI service are not deleted here: they
     * expire with its retention (DESIGNER_RETENTION_DAYS).
     *
     * @param \core\event\course_deleted $event
     */
    public static function course_deleted(\core\event\course_deleted $event): void {
        global $DB;

        foreach (self::COURSE_TABLES as $table) {
            $DB->delete_records($table, ['courseid' => $event->objectid]);
        }
    }
}
