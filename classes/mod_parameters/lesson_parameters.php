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

namespace local_coursegen\mod_parameters;

defined('MOODLE_INTERNAL') || die();

/**
 * Class lesson_parameters
 *
 * Handles parameter adjustment for lesson modules created by AI.
 * Prepares the lesson module parameters and stores page data for post-creation.
 *
 * @package    local_coursegen
 * @copyright  2025 BirtAI <https://birtai.com>
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
class lesson_parameters extends base_parameters {

    /**
     * Returns the adjusted parameters for the lesson module.
     *
     * Processes the AI-generated lesson structure and prepares it for
     * Moodle's lesson module creation.
     *
     * @return object Adjusted parameters for the lesson module.
     */
    public function get_parameters() {
        $params = $this->parameters;

        // Set default values if not present.
        if (!isset($params->practice)) {
            $params->practice = 0;
        }

        if (!isset($params->modattempts)) {
            $params->modattempts = 0;
        }

        if (!isset($params->grade)) {
            $params->grade = 100;
        }

        if (!isset($params->maxanswers)) {
            $params->maxanswers = 4;
        }

        if (!isset($params->maxattempts)) {
            $params->maxattempts = 1;
        }

        if (!isset($params->feedback)) {
            $params->feedback = 1;
        }

        if (!isset($params->retake)) {
            $params->retake = 1;
        }

        if (!isset($params->progressbar)) {
            $params->progressbar = 1;
        }

        // Process mod_settings if present (contains lesson pages).
        if (isset($params->mod_settings) && !empty($params->mod_settings)) {
            $modsettings = $params->mod_settings;

            // Store pages for post-creation processing.
            if (isset($modsettings['pages']) && isset($modsettings['create_lesson_pages'])) {
                // Pages will be created after the lesson module exists.
                $params->_pending_pages = $modsettings['pages'];
            }
        }

        return $params;
    }

    /**
     * Get the pending pages to be created after the lesson module.
     *
     * @return array Array of page definitions.
     */
    public function get_pending_pages(): array {
        if (isset($this->parameters->_pending_pages)) {
            return $this->parameters->_pending_pages;
        }
        return [];
    }

    /**
     * Check if there are pending pages to create.
     *
     * @return bool True if there are pages to create.
     */
    public function has_pending_pages(): bool {
        return !empty($this->parameters->_pending_pages);
    }
}
