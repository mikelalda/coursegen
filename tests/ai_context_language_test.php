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

#[\PHPUnit\Framework\Attributes\CoversClass(\local_coursegen\ai_context::class)]
/**
 * Tests for the AI content language resolution.
 *
 * Activities added with the AI button used to be generated in Spanish whatever
 * the course language was, because no language ever reached the AI service.
 *
 * @package    local_coursegen
 * @copyright  2026 Mikel Aldalur
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 * @covers     \local_coursegen\ai_context::normalize_language
 * @covers     \local_coursegen\ai_context::resolve_language
 */
final class ai_context_language_test extends \advanced_testcase {
    /**
     * Moodle codes carry a region or a variant; the AI service only knows the base.
     */
    public function test_moodle_codes_are_reduced_to_a_supported_language(): void {
        $this->assertSame('es', ai_context::normalize_language('es_mx'));
        $this->assertSame('eu', ai_context::normalize_language('eu_x_kids'));
        $this->assertSame('en', ai_context::normalize_language('EN-GB'));
    }

    /**
     * An unsupported language must be reported as such, not silently mapped.
     */
    public function test_an_unsupported_language_is_rejected(): void {
        $this->assertNull(ai_context::normalize_language('fr'));
        $this->assertNull(ai_context::normalize_language(''));
        $this->assertNull(ai_context::normalize_language(null));
    }

    /**
     * The list offered in the forms is exactly what the AI has prompts for.
     */
    public function test_the_offered_languages_are_the_supported_ones(): void {
        $this->assertSame(
            ai_context::SUPPORTED_LANGS,
            array_keys(ai_context::get_supported_languages())
        );
    }

    /**
     * What the user picked wins over what the course had stored.
     */
    public function test_an_explicit_request_wins(): void {
        $this->resetAfterTest();
        $course = $this->getDataGenerator()->create_course();
        ai_context::save_course_context($course->id, ai_context::CONTEXT_TYPE_CUSTOM_PROMPT, null, 'es', 'x');

        $this->assertSame('eu', ai_context::resolve_language($course->id, 'eu'));
    }

    /**
     * With nothing requested, the language the course was planned in is used.
     */
    public function test_the_stored_course_language_is_used(): void {
        $this->resetAfterTest();
        $course = $this->getDataGenerator()->create_course();
        ai_context::save_course_context($course->id, ai_context::CONTEXT_TYPE_CUSTOM_PROMPT, null, 'eu', 'x');

        $this->assertSame('eu', ai_context::resolve_language($course->id));
    }

    /**
     * A course never planned with AI falls back to the interface language.
     *
     * This is the case that used to produce Spanish activities inside a Basque
     * course: there was no stored language, so the service defaulted to Spanish.
     */
    public function test_an_unplanned_course_follows_the_interface_language(): void {
        $this->resetAfterTest();
        $course = $this->getDataGenerator()->create_course();

        // Force the interface language directly: force_current_language() is a
        // no-op when the language pack is not installed, which is normally the
        // case for non-English packs in a test environment.
        global $SESSION;
        $SESSION->forcelang = 'eu';
        $this->assertSame('eu', ai_context::resolve_language($course->id));
    }

    /**
     * An interface language the AI does not speak still yields a usable one.
     */
    public function test_an_unsupported_interface_language_falls_back(): void {
        $this->resetAfterTest();
        $course = $this->getDataGenerator()->create_course();

        force_current_language('fr');
        $this->assertContains(
            ai_context::resolve_language($course->id),
            ai_context::SUPPORTED_LANGS
        );
    }
}
