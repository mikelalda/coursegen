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
 * Template Manager for Course Generator.
 *
 * Manages course templates and their configuration.
 * Templates define the structure and types of activities for AI course generation.
 *
 * @package    local_coursegen
 * @copyright  2025 BirtAI <https://birtai.com>
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
class template_manager {
    /** @var string Template ID: Standard course */
    const TEMPLATE_STANDARD = 'standard';

    /** @var string Template ID: SCORM-based course */
    const TEMPLATE_SCORM = 'scorm_based';

    /** @var string Template ID: Interactive course */
    const TEMPLATE_INTERACTIVE = 'interactive';

    /** @var string Template ID: Collaborative course */
    const TEMPLATE_COLLABORATIVE = 'collaborative';

    /**
     * Predefined templates with their configurations.
     *
     * @var array
     */
    private static $templates = [
        self::TEMPLATE_STANDARD => [
            'name' => 'template_standard',
            'description' => 'template_standard_desc',
            'structure_type' => 'sections',
            'default_sections' => 5,
            'icon' => 'i/course',
            'allowed_activities' => ['page', 'quiz', 'assign', 'forum', 'resource', 'url'],
            'tags' => ['general', 'standard', 'mixed'],
        ],
        self::TEMPLATE_SCORM => [
            'name' => 'template_scorm',
            'description' => 'template_scorm_desc',
            'structure_type' => 'topics',
            'default_sections' => 4,
            'icon' => 'f/archive',
            'allowed_activities' => ['scorm', 'quiz', 'page', 'resource'],
            'tags' => ['scorm', 'elearning', 'compliance'],
        ],
        self::TEMPLATE_INTERACTIVE => [
            'name' => 'template_interactive',
            'description' => 'template_interactive_desc',
            'structure_type' => 'sections',
            'default_sections' => 6,
            'icon' => 'i/withsubcat',
            'allowed_activities' => ['h5pactivity', 'lesson', 'quiz', 'forum', 'page'],
            'tags' => ['interactive', 'h5p', 'gamification'],
        ],
        self::TEMPLATE_COLLABORATIVE => [
            'name' => 'template_collaborative',
            'description' => 'template_collaborative_desc',
            'structure_type' => 'weeks',
            'default_sections' => 8,
            'icon' => 'i/group',
            'allowed_activities' => ['forum', 'wiki', 'glossary', 'assign', 'workshop', 'page', 'chat'],
            'tags' => ['collaborative', 'social', 'teamwork'],
        ],
    ];

    /**
     * Get all available templates.
     *
     * @return array Templates with their configurations
     */
    public static function get_all_templates(): array {
        $templates = [];
        $defaulttemplate = self::get_default_template_id();

        foreach (self::$templates as $templateid => $config) {
            $templates[$templateid] = self::build_template_data($templateid, $config);
            $templates[$templateid]['is_default'] = ($templateid === $defaulttemplate);
        }

        return $templates;
    }

    /**
     * Get a specific template by ID.
     *
     * @param string $templateid Template ID
     * @return array|null Template configuration or null if not found
     */
    public static function get_template(string $templateid): ?array {
        if (!isset(self::$templates[$templateid])) {
            return null;
        }

        $template = self::build_template_data($templateid, self::$templates[$templateid]);
        $template['is_default'] = ($templateid === self::get_default_template_id());

        return $template;
    }

    /**
     * Get the default template ID.
     *
     * @return string Default template ID
     */
    public static function get_default_template_id(): string {
        $default = get_config('local_coursegen', 'default_template');
        return !empty($default) ? $default : self::TEMPLATE_STANDARD;
    }

    /**
     * Get the default template.
     *
     * @return array Default template configuration
     */
    public static function get_default_template(): array {
        return self::get_template(self::get_default_template_id());
    }

    /**
     * Get list of template IDs.
     *
     * @return array List of template IDs
     */
    public static function get_template_ids(): array {
        return array_keys(self::$templates);
    }

    /**
     * Get templates as options for select.
     *
     * @return array Template ID => Template name
     */
    public static function get_template_options(): array {
        $options = [];

        foreach (self::$templates as $templateid => $config) {
            $options[$templateid] = get_string($config['name'], 'local_coursegen');
        }

        return $options;
    }

    /**
     * Get templates for a specific tag.
     *
     * @param string $tag Tag to filter by
     * @return array Matching templates
     */
    public static function get_templates_by_tag(string $tag): array {
        $templates = [];

        foreach (self::$templates as $templateid => $config) {
            if (in_array($tag, $config['tags'])) {
                $templates[$templateid] = self::build_template_data($templateid, $config);
            }
        }

        return $templates;
    }

    /**
     * Get allowed activities for a template.
     *
     * Filters by what's actually available in the Moodle instance.
     *
     * @param string $templateid Template ID
     * @return array List of available activity types
     */
    public static function get_template_activities(string $templateid): array {
        $template = self::get_template($templateid);
        if (!$template) {
            return [];
        }

        $allowed = $template['allowed_activities'];
        $available = module_registry::get_available_for_api();

        return array_values(array_intersect($allowed, $available));
    }

    /**
     * Check if a template is valid.
     *
     * @param string $templateid Template ID
     * @return bool True if valid
     */
    public static function is_valid_template(string $templateid): bool {
        return isset(self::$templates[$templateid]);
    }

    /**
     * Build template data with localized strings.
     *
     * @param string $templateid Template ID
     * @param array $config Raw configuration
     * @return array Processed template data
     */
    private static function build_template_data(string $templateid, array $config): array {
        return [
            'template_id' => $templateid,
            'name' => get_string($config['name'], 'local_coursegen'),
            'description' => get_string($config['description'], 'local_coursegen'),
            'structure_type' => $config['structure_type'],
            'default_sections' => $config['default_sections'],
            'icon' => $config['icon'],
            'allowed_activities' => $config['allowed_activities'],
            'tags' => $config['tags'],
        ];
    }

    /**
     * Get structure type options.
     *
     * @return array Structure type options
     */
    public static function get_structure_type_options(): array {
        return [
            'sections' => get_string('structure_sections', 'local_coursegen'),
            'topics' => get_string('structure_topics', 'local_coursegen'),
            'weeks' => get_string('structure_weeks', 'local_coursegen'),
        ];
    }

    /**
     * Get data for API request.
     *
     * @param string $templateid Template ID to use
     * @return array Data for API
     */
    public static function get_api_data(string $templateid): array {
        $template = self::get_template($templateid);

        if (!$template) {
            $template = self::get_default_template();
        }

        return [
            'template_id' => $template['template_id'],
            'structure_type' => $template['structure_type'],
            'allowed_module_types' => self::get_template_activities($template['template_id']),
        ];
    }

    /**
     * Register a custom template.
     *
     * Allows plugins to add their own templates.
     *
     * @param string $templateid Template ID
     * @param array $config Template configuration
     */
    public static function register_template(string $templateid, array $config): void {
        // Ensure required fields.
        $required = ['name', 'description', 'allowed_activities'];
        foreach ($required as $field) {
            if (!isset($config[$field])) {
                throw new \coding_exception("Template config missing required field: {$field}");
            }
        }

        $defaults = [
            'structure_type' => 'sections',
            'default_sections' => 5,
            'icon' => 'i/course',
            'tags' => [],
        ];

        self::$templates[$templateid] = array_merge($defaults, $config);
    }

    /**
     * Get template data for mustache templates.
     *
     * @return array Template data for rendering
     */
    public static function get_templates_for_mustache(): array {
        $templates = [];
        $defaultid = self::get_default_template_id();

        foreach (self::$templates as $templateid => $config) {
            $templates[] = [
                'template_id' => $templateid,
                'name' => get_string($config['name'], 'local_coursegen'),
                'description' => get_string($config['description'], 'local_coursegen'),
                'structure_type' => $config['structure_type'],
                'default_sections' => $config['default_sections'],
                'icon' => $config['icon'],
                'is_default' => ($templateid === $defaultid),
                'is_selected' => ($templateid === $defaultid),
                'activity_count' => count(self::get_template_activities($templateid)),
            ];
        }

        return $templates;
    }
}
