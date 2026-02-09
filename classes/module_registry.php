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
 * Module Registry for Course Generator.
 *
 * Manages the registry of supported Moodle modules for AI course generation.
 * Provides information about module capabilities, installation status, and configuration.
 *
 * @package    local_coursegen
 * @copyright  2025 BirtAI <https://birtai.com>
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
class module_registry {

    /** @var string Category: Content modules */
    const CATEGORY_CONTENT = 'content';

    /** @var string Category: Interactive modules */
    const CATEGORY_INTERACTIVE = 'interactive';

    /** @var string Category: Assessment modules */
    const CATEGORY_ASSESSMENT = 'assessment';

    /** @var string Category: Collaboration modules */
    const CATEGORY_COLLABORATION = 'collaboration';

    /** @var string Category: Special/Tools modules */
    const CATEGORY_TOOLS = 'tools';

    /**
     * Supported modules with their capabilities and metadata.
     *
     * @var array
     */
    private static $supportedmodules = [
        // Content modules.
        'page' => [
            'name' => 'Page',
            'category' => self::CATEGORY_CONTENT,
            'has_parameters_class' => false,
            'has_settings_class' => false,
            'requires_file' => false,
            'supports_grading' => false,
            'priority' => 'high',
        ],
        'book' => [
            'name' => 'Book',
            'category' => self::CATEGORY_CONTENT,
            'has_parameters_class' => true,
            'has_settings_class' => true,
            'requires_file' => false,
            'supports_grading' => false,
            'priority' => 'high',
        ],
        'label' => [
            'name' => 'Label',
            'category' => self::CATEGORY_CONTENT,
            'has_parameters_class' => false,
            'has_settings_class' => false,
            'requires_file' => false,
            'supports_grading' => false,
            'priority' => 'low',
        ],
        'folder' => [
            'name' => 'Folder',
            'category' => self::CATEGORY_CONTENT,
            'has_parameters_class' => false,
            'has_settings_class' => false,
            'requires_file' => true,
            'supports_grading' => false,
            'priority' => 'low',
        ],
        'resource' => [
            'name' => 'File',
            'category' => self::CATEGORY_CONTENT,
            'has_parameters_class' => true,
            'has_settings_class' => false,
            'requires_file' => true,
            'supports_grading' => false,
            'priority' => 'medium',
        ],
        'url' => [
            'name' => 'URL',
            'category' => self::CATEGORY_CONTENT,
            'has_parameters_class' => false,
            'has_settings_class' => false,
            'requires_file' => false,
            'supports_grading' => false,
            'priority' => 'medium',
        ],
        'imscp' => [
            'name' => 'IMS Content Package',
            'category' => self::CATEGORY_CONTENT,
            'has_parameters_class' => true,
            'has_settings_class' => false,
            'requires_file' => true,
            'supports_grading' => false,
            'priority' => 'low',
        ],

        // Interactive modules.
        'scorm' => [
            'name' => 'SCORM Package',
            'category' => self::CATEGORY_INTERACTIVE,
            'has_parameters_class' => true,
            'has_settings_class' => false,
            'requires_file' => true,
            'supports_grading' => true,
            'priority' => 'high',
        ],
        'h5pactivity' => [
            'name' => 'H5P',
            'category' => self::CATEGORY_INTERACTIVE,
            'has_parameters_class' => true,
            'has_settings_class' => false,
            'requires_file' => true,
            'supports_grading' => true,
            'priority' => 'high',
        ],
        'hvp' => [
            'name' => 'H5P (Plugin)',
            'category' => self::CATEGORY_INTERACTIVE,
            'has_parameters_class' => false,
            'has_settings_class' => false,
            'requires_file' => true,
            'supports_grading' => true,
            'priority' => 'medium',
        ],
        'lesson' => [
            'name' => 'Lesson',
            'category' => self::CATEGORY_INTERACTIVE,
            'has_parameters_class' => true,
            'has_settings_class' => true,
            'requires_file' => false,
            'supports_grading' => true,
            'priority' => 'high',
        ],

        // Assessment modules.
        'quiz' => [
            'name' => 'Quiz',
            'category' => self::CATEGORY_ASSESSMENT,
            'has_parameters_class' => false,
            'has_settings_class' => true,
            'requires_file' => false,
            'supports_grading' => true,
            'priority' => 'high',
        ],
        'assign' => [
            'name' => 'Assignment',
            'category' => self::CATEGORY_ASSESSMENT,
            'has_parameters_class' => false,
            'has_settings_class' => false,
            'requires_file' => false,
            'supports_grading' => true,
            'priority' => 'high',
        ],
        'workshop' => [
            'name' => 'Workshop',
            'category' => self::CATEGORY_ASSESSMENT,
            'has_parameters_class' => false,
            'has_settings_class' => false,
            'requires_file' => false,
            'supports_grading' => true,
            'priority' => 'medium',
        ],
        'feedback' => [
            'name' => 'Feedback',
            'category' => self::CATEGORY_ASSESSMENT,
            'has_parameters_class' => false,
            'has_settings_class' => false,
            'requires_file' => false,
            'supports_grading' => false,
            'priority' => 'medium',
        ],
        'choice' => [
            'name' => 'Choice',
            'category' => self::CATEGORY_ASSESSMENT,
            'has_parameters_class' => false,
            'has_settings_class' => false,
            'requires_file' => false,
            'supports_grading' => false,
            'priority' => 'low',
        ],

        // Collaboration modules.
        'forum' => [
            'name' => 'Forum',
            'category' => self::CATEGORY_COLLABORATION,
            'has_parameters_class' => false,
            'has_settings_class' => true,
            'requires_file' => false,
            'supports_grading' => true,
            'priority' => 'high',
        ],
        'wiki' => [
            'name' => 'Wiki',
            'category' => self::CATEGORY_COLLABORATION,
            'has_parameters_class' => false,
            'has_settings_class' => false,
            'requires_file' => false,
            'supports_grading' => false,
            'priority' => 'medium',
        ],
        'glossary' => [
            'name' => 'Glossary',
            'category' => self::CATEGORY_COLLABORATION,
            'has_parameters_class' => false,
            'has_settings_class' => true,
            'requires_file' => false,
            'supports_grading' => true,
            'priority' => 'medium',
        ],
        'data' => [
            'name' => 'Database',
            'category' => self::CATEGORY_COLLABORATION,
            'has_parameters_class' => false,
            'has_settings_class' => false,
            'requires_file' => false,
            'supports_grading' => true,
            'priority' => 'low',
        ],
        'chat' => [
            'name' => 'Chat',
            'category' => self::CATEGORY_COLLABORATION,
            'has_parameters_class' => false,
            'has_settings_class' => false,
            'requires_file' => false,
            'supports_grading' => false,
            'priority' => 'low',
        ],

        // Tools.
        'lti' => [
            'name' => 'External Tool (LTI)',
            'category' => self::CATEGORY_TOOLS,
            'has_parameters_class' => false,
            'has_settings_class' => false,
            'requires_file' => false,
            'supports_grading' => true,
            'priority' => 'low',
        ],
        'bigbluebuttonbn' => [
            'name' => 'BigBlueButton',
            'category' => self::CATEGORY_TOOLS,
            'has_parameters_class' => false,
            'has_settings_class' => false,
            'requires_file' => false,
            'supports_grading' => false,
            'priority' => 'low',
        ],
    ];

    /**
     * Check if a module is installed in Moodle.
     *
     * @param string $modname Module name
     * @return bool True if installed
     */
    public static function is_module_installed(string $modname): bool {
        global $CFG;
        return file_exists($CFG->dirroot . '/mod/' . $modname . '/lib.php');
    }

    /**
     * Check if a module is enabled for coursegen.
     *
     * @param string $modname Module name
     * @return bool True if enabled
     */
    public static function is_module_enabled(string $modname): bool {
        $disabled = get_config('local_coursegen', 'disabled_modules');
        if (empty($disabled)) {
            return true;
        }
        $disabledlist = array_map('trim', explode(',', $disabled));
        return !in_array($modname, $disabledlist);
    }

    /**
     * Get list of modules available for the API.
     *
     * Returns only modules that are both installed and enabled.
     *
     * @return array List of module names
     */
    public static function get_available_for_api(): array {
        $available = [];

        foreach (self::$supportedmodules as $modname => $config) {
            if (self::is_module_installed($modname) && self::is_module_enabled($modname)) {
                $available[] = $modname;
            }
        }

        return $available;
    }

    /**
     * Get full configuration of available modules.
     *
     * @return array Module configurations keyed by module name
     */
    public static function get_modules_config(): array {
        $config = [];

        foreach (self::$supportedmodules as $modname => $modconfig) {
            $installed = self::is_module_installed($modname);
            $enabled = self::is_module_enabled($modname);

            $config[$modname] = array_merge($modconfig, [
                'installed' => $installed,
                'enabled' => $enabled,
                'available' => $installed && $enabled,
            ]);
        }

        return $config;
    }

    /**
     * Get modules by category.
     *
     * @param string $category Category constant
     * @param bool $onlyavailable Only return available modules
     * @return array List of module names
     */
    public static function get_modules_by_category(string $category, bool $onlyavailable = true): array {
        $modules = [];

        foreach (self::$supportedmodules as $modname => $config) {
            if ($config['category'] !== $category) {
                continue;
            }

            if ($onlyavailable) {
                if (!self::is_module_installed($modname) || !self::is_module_enabled($modname)) {
                    continue;
                }
            }

            $modules[] = $modname;
        }

        return $modules;
    }

    /**
     * Get modules by priority level.
     *
     * @param string $priority Priority level: high, medium, low
     * @param bool $onlyavailable Only return available modules
     * @return array List of module names
     */
    public static function get_modules_by_priority(string $priority, bool $onlyavailable = true): array {
        $modules = [];

        foreach (self::$supportedmodules as $modname => $config) {
            if ($config['priority'] !== $priority) {
                continue;
            }

            if ($onlyavailable) {
                if (!self::is_module_installed($modname) || !self::is_module_enabled($modname)) {
                    continue;
                }
            }

            $modules[] = $modname;
        }

        return $modules;
    }

    /**
     * Get module configuration.
     *
     * @param string $modname Module name
     * @return array|null Module configuration or null if not found
     */
    public static function get_module_config(string $modname): ?array {
        if (!isset(self::$supportedmodules[$modname])) {
            return null;
        }

        $config = self::$supportedmodules[$modname];
        $config['installed'] = self::is_module_installed($modname);
        $config['enabled'] = self::is_module_enabled($modname);
        $config['available'] = $config['installed'] && $config['enabled'];

        return $config;
    }

    /**
     * Check if a module is supported by coursegen.
     *
     * @param string $modname Module name
     * @return bool True if supported
     */
    public static function is_supported(string $modname): bool {
        return isset(self::$supportedmodules[$modname]);
    }

    /**
     * Get all supported module names.
     *
     * @return array List of supported module names
     */
    public static function get_supported_modules(): array {
        return array_keys(self::$supportedmodules);
    }

    /**
     * Get all categories.
     *
     * @return array Category constants and their names
     */
    public static function get_categories(): array {
        return [
            self::CATEGORY_CONTENT => get_string('category_content', 'local_coursegen'),
            self::CATEGORY_INTERACTIVE => get_string('category_interactive', 'local_coursegen'),
            self::CATEGORY_ASSESSMENT => get_string('category_assessment', 'local_coursegen'),
            self::CATEGORY_COLLABORATION => get_string('category_collaboration', 'local_coursegen'),
            self::CATEGORY_TOOLS => get_string('category_tools', 'local_coursegen'),
        ];
    }

    /**
     * Get modules that require file upload.
     *
     * @param bool $onlyavailable Only return available modules
     * @return array List of module names
     */
    public static function get_file_modules(bool $onlyavailable = true): array {
        $modules = [];

        foreach (self::$supportedmodules as $modname => $config) {
            if (!$config['requires_file']) {
                continue;
            }

            if ($onlyavailable) {
                if (!self::is_module_installed($modname) || !self::is_module_enabled($modname)) {
                    continue;
                }
            }

            $modules[] = $modname;
        }

        return $modules;
    }

    /**
     * Get modules that support grading.
     *
     * @param bool $onlyavailable Only return available modules
     * @return array List of module names
     */
    public static function get_gradable_modules(bool $onlyavailable = true): array {
        $modules = [];

        foreach (self::$supportedmodules as $modname => $config) {
            if (!$config['supports_grading']) {
                continue;
            }

            if ($onlyavailable) {
                if (!self::is_module_installed($modname) || !self::is_module_enabled($modname)) {
                    continue;
                }
            }

            $modules[] = $modname;
        }

        return $modules;
    }

    /**
     * Register a new module (for plugin extensibility).
     *
     * @param string $modname Module name
     * @param array $config Module configuration
     */
    public static function register_module(string $modname, array $config): void {
        // Ensure required fields.
        $defaults = [
            'name' => $modname,
            'category' => self::CATEGORY_TOOLS,
            'has_parameters_class' => false,
            'has_settings_class' => false,
            'requires_file' => false,
            'supports_grading' => false,
            'priority' => 'low',
        ];

        self::$supportedmodules[$modname] = array_merge($defaults, $config);
    }

    /**
     * Get data for API request.
     *
     * Returns a simplified list of available modules for the API.
     *
     * @return array Data for API
     */
    public static function get_api_data(): array {
        return [
            'available_moodle_modules' => self::get_available_for_api(),
            'modules_config' => self::get_modules_config(),
        ];
    }
}
