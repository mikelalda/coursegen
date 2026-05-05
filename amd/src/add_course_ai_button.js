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
 * Add AI button to course creation/edit form
 *
 * @module     local_coursegen/add_course_ai_button
 * @copyright  2025 Wilber Narvaez <https://birtai.com>
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

import Templates from "core/templates";

/**
 * Initialize the AI button functionality
 */
export const init = () => {
  addAIButton();
};

/**
 * Add the AI button before the submit button
 */
const addAIButton = async () => {
  // Find the submit form element
  const submitElement = document.querySelector(".mb-3.fitem.form-submit");
  let targetElement = submitElement;

  if (!targetElement) {
    // If not found, try alternative selectors
    targetElement =
      document.querySelector('div[data-fieldtype="submit"]') ||
      document.querySelector('input[name="saveandreturn"]')?.closest(".fitem");
  }

  if (!targetElement) {
    return;
  }

  await insertAIButton(targetElement);

  const button = document.querySelector(
    '[data-action="local_coursegen/add_ai_course"]'
  );
  if (button) {
    button.addEventListener("click", handleAIButtonClick);
  }

  // Also add FP Euskadi Designer button.
  const designerBtn = document.querySelector(
    '[data-action="local_coursegen/designer_chat"]'
  );
  if (designerBtn) {
    designerBtn.addEventListener("click", handleDesignerButtonClick);
  }
};

/**
 * Handle the AI button click event
 * @param {Event} e - The click event
 */
const handleAIButtonClick = async (e) => {
  e.preventDefault();
  const btn = e.currentTarget;
  if (btn) {
    btn.setAttribute("disabled", "disabled");
    btn.classList.add("disabled");
  }

  document.querySelector('input[name="local_coursegen_create_ai_course"]').value = 1;
  document.querySelector('input[name="saveanddisplay"]').click();
};

/**
 * Handle the FP Euskadi Designer button click event.
 * Opens the designer chat modal directly without submitting the form.
 * @param {Event} e - The click event
 */
const handleDesignerButtonClick = async (e) => {
  e.preventDefault();
  const btn = e.currentTarget;
  if (btn) {
    btn.setAttribute("disabled", "disabled");
    btn.classList.add("disabled");
  }

  // First save the course form normally to get the course ID.
  // Check if we're editing an existing course.
  const courseIdInput = document.querySelector('input[name="id"]');
  const courseid = courseIdInput ? parseInt(courseIdInput.value, 10) : 0;

  if (!courseid) {
    // Need to save course first via "saveanddisplay" — set hidden flag.
    document.querySelector('input[name="local_coursegen_create_ai_course"]').value = 2;
    document.querySelector('input[name="saveanddisplay"]').click();
    return;
  }

  // Course exists — open the designer chat directly.
  try {
    const { init } = await import("local_coursegen/designer_chat");
    await init({ courseid });
  } catch (error) {
    if (btn) {
      btn.removeAttribute("disabled");
      btn.classList.remove("disabled");
    }
    // eslint-disable-next-line no-console
    console.error("Designer chat error:", error);
  }
};

/**
 * Insert the AI button before the target element
 * @param {Element} targetElement - The element before which to insert the button
 */
const insertAIButton = async (targetElement) => {
  // Check if button already exists to avoid duplicates
  if (document.querySelector('[data-action="local_coursegen/add_ai_course"]')) {
    return;
  }

  // Render the template (no context needed as template is self-contained)
  const { html } = await Templates.renderForPromise(
    "local_coursegen/add_ai_course_button",
    {}
  );
  const buttonContainer = document.createElement("div");
  buttonContainer.innerHTML = html;

  // Insert before the submit element
  targetElement.parentNode.insertBefore(buttonContainer, targetElement);
};
