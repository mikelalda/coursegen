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
 * TODO describe module chatbot
 *
 * @module     local_coursegen/repository/chatbot
 * @copyright  2025 Wilber Narvaez <https://birtai.com>
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
import ajax from "core/ajax";

/**
 * Send a planning message for the course AI conversation.
 * The backend should also return a streaming URL to reconnect to the stream.
 *
 * @param {{
 *   courseid: number,
 *   text: string,
 * }} payload - The payload to send the planning message
 * @return {Promise<Object>} response
 */
export async function planCourseMessage({courseid, text}) {
    const args = {
        courseid: Number(courseid) || 0,
        text,
    };
    return ajax.call([
        {
            methodname: "local_coursegen_plan_course_message",
            args,
        },
    ])[0];
}

/**
 * Create module for ask question to chatbot based in that information.
 *
 * @param {{
 *     courseid: number,
 *     sectionnum: number,
 *     beforemod: number,
 *     jobid: number,
 * }} payload - The payload to create module
 * - courseid: The ID of the course to create module for
 * - sectionnum: The number of the section to create module for
 * - beforemod: The ID of the module before which the new module will be created
 * @return {Promise<Object>} response
 */
export async function createMod({courseid, sectionnum, beforemod, jobid}) {
    const args = {
        courseid: Number(courseid),
        sectionnum: Number(sectionnum),
        beforemod: beforemod ? Number(beforemod) : null,
        jobid: jobid
    };
    return ajax.call([
        {
            methodname: "local_coursegen_create_mod",
            args,
        },
    ])[0];
}

/**
 * Create module with streaming support for real-time updates.
 *
 * @param {{
 *     courseid: number,
 *     sectionnum: number,
 *     beforemod: number,
 *     prompt: string,
 *     generateimages: number,
 *     activitytype: string,
 *     lang: string,
 * }} payload - The payload to create module with streaming
 * - courseid: The ID of the course to create module for
 * - sectionnum: The number of the section to create module for
 * - beforemod: The ID of the module before which the new module will be created
 * - prompt: The message to create
 * - generateimages: 0 not generate images, 1 generate images
 * - activitytype: The type of activity to create (auto, page, quiz, etc.)
 * - lang: Language the AI must write the activity in (es, eu, en)
 * @return {Promise<Object>} response
 */
export async function createModStream({courseid, sectionnum, beforemod, prompt, generateimages, activitytype, lang}) {
    const args = {
        courseid: Number(courseid),
        sectionnum: Number(sectionnum),
        beforemod: beforemod ? Number(beforemod) : null,
        prompt,
        generateimages: generateimages ? Number(generateimages) : 0,
        activitytype: activitytype || 'auto',
        lang: lang || null,
    };
    return ajax.call([
        {
            methodname: "local_coursegen_create_mod_stream",
            args,
        },
    ])[0];
}

/**
 * Apply AI-generated content to an existing course.
 *
 * @param {{
 *     courseid: number,
 * }} payload - The payload to apply course content
 * - courseid: The course ID to apply content to
 * @return {Promise<Object>} response
 */
export async function createCourse({courseid}) {
    const args = {
        courseid: Number(courseid),
    };
    return ajax.call([
        {
            methodname: "local_coursegen_create_course",
            args,
        },
    ])[0];
}

/**
 * Execute AI course planning session.
 *
 * @param {number} courseid - The course ID to execute
 * @return {Promise<Object>} response
 */
export async function planCourseExecute(courseid) {
    return ajax.call([
        {
            methodname: "local_coursegen_plan_course_execute",
            args: {courseid: Number(courseid)},
        },
    ])[0];
}

/**
 * Start FP Euskadi Designer interactive chat session.
 *
 * @param {{courseid: number, newsession: boolean, lang: string}} payload newsession discards the saved
 *     conversation; lang changes the course's AI language
 * @return {Promise<Object>} response with session_id and streamingurl (new) or history (resumed)
 */
export async function designerStart({courseid, newsession = false, lang = ""}) {
    return ajax.call([
        {
            methodname: "local_coursegen_designer_start",
            args: {courseid: Number(courseid), newsession: Boolean(newsession), lang: String(lang || "")},
        },
    ])[0];
}

/**
 * Send message to the FP Euskadi Designer chat session.
 *
 * @param {{courseid: number, text: string, attachmentids: string[]}} payload
 * @return {Promise<Object>} response with streamingurl
 */
export async function designerMessage({courseid, text, attachmentids = []}) {
    return ajax.call([
        {
            methodname: "local_coursegen_designer_message",
            args: {
                courseid: Number(courseid),
                text,
                attachmentids,
            },
        },
    ])[0];
}

/**
 * List the downloadable files of the FP Euskadi Designer session.
 *
 * @param {{courseid: number}} payload
 * @return {Promise<Object>} response with files: [{name, kind, size, modified, url}]
 */
export async function designerFiles({courseid}) {
    return ajax.call([
        {
            methodname: "local_coursegen_designer_files",
            args: {courseid: Number(courseid)},
        },
    ])[0];
}

/**
 * Upload a document to the FP Euskadi Designer chat; it goes with the next message.
 *
 * @param {{courseid: number, filename: string, content: string}} payload content is base64
 * @return {Promise<Object>} response with the attachment id, name, pages and chars
 */
export async function designerUpload({courseid, filename, content}) {
    return ajax.call([
        {
            methodname: "local_coursegen_designer_upload",
            args: {
                courseid: Number(courseid),
                filename,
                content,
            },
        },
    ])[0];
}
