// Tests of local_coursegen/add_activity_ai: the "Add activity with AI" modal.
import {loadAmd, flush} from '../helpers';

jest.mock('local_coursegen/module_streaming', () => ({startModuleStreaming: jest.fn(async() => undefined)}));

let Ajax;
let Modal;
let Templates;
let moduleStreaming;
let addActivity;

const STREAM = {ok: true, streamingurl: 'https://ai.example/stream/9', job_id: 'job-9'};

const link = () => document.querySelector('[data-action="local_coursegen/add_activity_ai"]');
const modal = () => Modal.instances[Modal.instances.length - 1];
const $ = (selector) => modal().root.querySelector(selector);
const streamCalls = () => Ajax.callsTo('local_coursegen_create_mod_stream');
const controls = () => [
    $('.local_coursegen_ai_send'), $('textarea'), $('#activity-type-selector'), $('#activity-lang-selector'),
    ...modal().root.querySelectorAll('input[name="generate_images"]'),
];

/**
 * Open the modal from the activity link.
 *
 * @param {object} dataset Data attributes of the link.
 */
const open = async(dataset = {}) => {
    Object.assign(link().dataset, dataset);
    link().click();
    await flush();
};

/**
 * Type a prompt and send the form.
 *
 * @param {string} prompt
 */
const send = async(prompt) => {
    $('textarea').value = prompt;
    $('form.local_coursegen_ai_input').dispatchEvent(new Event('submit', {cancelable: true}));
    await flush();
};

beforeEach(() => {
    jest.resetModules();
    document.body.innerHTML = '<a href="#" data-action="local_coursegen/add_activity_ai" data-sectionnum="2"'
        + ' data-beforemod="" data-courseid="3" data-courselang="eu">Add activity with AI</a>';
    Ajax = require('core/ajax');
    Modal = require('core/modal').default;
    Modal.instances = [];
    Templates = require('core/templates').default;
    moduleStreaming = require('local_coursegen/module_streaming');
    Ajax.setResponses({'local_coursegen_create_mod_stream': STREAM});
    addActivity = loadAmd('local_coursegen/add_activity_ai');
    addActivity.init();
});

describe('opening the modal', () => {
    it('opens it from the activity link, with the course language chosen', async() => {
        await open();

        expect(modal().shown).toBe(true);
        expect(modal().root.classList.contains('local_coursegen_course_ai_modal')).toBe(true);
        expect($('.modal-title').textContent).toBe('[addactivityai_modaltitle]');
        expect($('#activity-lang-selector').value).toBe('eu');
        expect(Templates.render).toHaveBeenCalledWith('local_coursegen/activity_chat_footer', {
            languages: [
                {code: 'es', name: 'Castellano (es)', selected: false},
                {code: 'eu', name: 'Euskara (eu)', selected: true},
                {code: 'en', name: 'English (en)', selected: false},
            ],
        });
    });

    it('chooses Spanish for a course language the AI does not write', async() => {
        await open({courselang: 'fr'});

        expect($('#activity-lang-selector').value).toBe('es');
    });

    it('closes the previous modal before opening another', async() => {
        await open();
        const first = modal();

        await open();

        expect(first.destroyed).toBe(true);
        expect(Modal.instances).toHaveLength(2);
    });
});

describe('creating an activity', () => {
    it('sends the prompt with the type, language and images option, then follows the job', async() => {
        await open();
        $('#activity-type-selector').value = 'quiz';
        $('#activity-lang-selector').value = 'en';
        $('input[name="generate_images"][value="1"]').checked = true;

        await send('  A quiz about volcanoes  ');

        expect(streamCalls()).toEqual([{
            courseid: 3, sectionnum: 2, beforemod: null, prompt: 'A quiz about volcanoes',
            generateimages: 1, activitytype: 'quiz', lang: 'en',
        }]);
        expect(moduleStreaming.startModuleStreaming).toHaveBeenCalledWith(
            STREAM.streamingurl, $('#activity-streaming-section'), {courseid: 3, sectionnum: 2, beforemod: null, jobid: 'job-9'});
    });

    it('shows the prompt as a message, clears the box and shows the progress titles', async() => {
        await open();

        await send('A glossary of welding terms');

        expect($('#activity-user-messages').style.display).toBe('block');
        expect($('#activity-user-messages .local_coursegen_ai_msg.user').textContent).toContain('A glossary of welding terms');
        expect($('textarea').value).toBe('');
        expect($('#activity-streaming-section').style.display).toBe('block');
        const progress = $('[data-region="local_coursegen/course_streaming/progress"]');
        expect(progress.style.display).toBe('block');
        expect(progress.querySelector('h6').textContent).toBe('[module_creation_title]');
        expect(progress.querySelector('small').textContent).toBe('[module_creation_subtitle]');
    });

    it('disables the form while the activity is created and enables it afterwards', async() => {
        let finish;
        moduleStreaming.startModuleStreaming.mockReturnValueOnce(new Promise((resolve) => {
            finish = resolve;
        }));
        await open();

        await send('A forum to introduce yourselves');
        controls().forEach((control) => expect(control.disabled).toBe(true));
        expect($('.local_coursegen_ai_send').style.opacity).toBe('0.7');

        finish();
        await flush();
        controls().forEach((control) => expect(control.disabled).toBe(false));
        expect($('.local_coursegen_ai_send').style.opacity).toBe('1');
    });

    it('shows the error of a refused request as text', async() => {
        Ajax.setResponses({'local_coursegen_create_mod_stream': {
            ok: false, message: '<img src="x" onerror="window.hacked = true">Quota exceeded',
        }});
        await open();

        await send('A quiz');

        const alert = $('[data-region="local_coursegen/course_streaming"] .alert-danger');
        expect(alert.textContent).toBe('❌ [error_label]: <img src="x" onerror="window.hacked = true">Quota exceeded');
        expect(modal().root.querySelector('img')).toBeNull();
        expect(moduleStreaming.startModuleStreaming).not.toHaveBeenCalled();
        controls().forEach((control) => expect(control.disabled).toBe(false));
    });

    it('uses the generic error when the failure has no message', async() => {
        Ajax.setResponses({'local_coursegen_create_mod_stream': () => {
            throw new Error('');
        }});
        await open();

        await send('A quiz');

        expect($('.alert-danger').textContent).toBe('❌ [error_label]: [addactivityai_error]');
    });

    it('sends nothing for an empty prompt', async() => {
        await open();

        await send('   ');

        expect(streamCalls()).toEqual([]);
        expect($('#activity-user-messages').style.display).toBe('none');
    });

    it('sends with Enter, but Shift+Enter starts a new line', async() => {
        await open();
        $('textarea').value = 'An assignment about safety';

        $('textarea').dispatchEvent(new KeyboardEvent('keydown', {key: 'Enter', shiftKey: true, cancelable: true}));
        await flush();
        expect(streamCalls()).toEqual([]);

        $('textarea').dispatchEvent(new KeyboardEvent('keydown', {key: 'Enter', cancelable: true}));
        await flush();
        expect(streamCalls()).toHaveLength(1);
    });
});
