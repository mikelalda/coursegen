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

/**
 * Class book_parameters
 *
 * Handles parameter adjustment for book modules created by AI.
 * Prepares the book module parameters and stores chapter data for post-creation.
 *
 * @package    local_coursegen
 * @copyright  2025 BirtAI <https://birtai.com>
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
class book_parameters extends base_parameters {
    /**
     * Returns the adjusted parameters for the book module.
     *
     * Processes the AI-generated book structure and prepares it for
     * Moodle's book module creation.
     *
     * @return object Adjusted parameters for the book module.
     */
    public function get_parameters() {
        $params = $this->parameters;

        // Set default values if not present.
        if (!isset($params->numbering)) {
            // 0 = none, 1 = numbers, 2 = bullets, 3 = indented.
            $params->numbering = 1;
        }

        if (!isset($params->navstyle)) {
            // 0 = none, 1 = images, 2 = text.
            $params->navstyle = 1;
        }

        if (!isset($params->customtitles)) {
            $params->customtitles = 0;
        }

        // Process mod_settings if present (contains book chapters).
        if (isset($params->mod_settings) && !empty($params->mod_settings)) {
            $modsettings = $params->mod_settings;

            // Store chapters for post-creation processing.
            if (isset($modsettings['chapters']) && isset($modsettings['create_book_chapters'])) {
                // Chapters will be created after the book module exists.
                $params->_pending_chapters = $modsettings['chapters'];
            }
        }

        return $params;
    }

    /**
     * Get the pending chapters to be created after the book module.
     *
     * @return array Array of chapter definitions.
     */
    public function get_pending_chapters(): array {
        if (isset($this->parameters->_pending_chapters)) {
            return $this->parameters->_pending_chapters;
        }
        return [];
    }

    /**
     * Check if there are pending chapters to create.
     *
     * @return bool True if there are chapters to create.
     */
    public function has_pending_chapters(): bool {
        return !empty($this->parameters->_pending_chapters);
    }
}
