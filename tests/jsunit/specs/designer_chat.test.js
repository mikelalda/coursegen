// Tests of local_coursegen/designer_chat: the course designer conversation.
import {flush} from '../helpers';

jest.mock('local_coursegen/course_streaming', () => ({startExecutionStreaming: jest.fn(async() => undefined)}));

let Ajax;
let Modal;
let Notification;
let courseStreaming;
let designer;

const FILES = {success: true, files: [
    {name: 'diseno.md', kind: 'design', size: 2048, url: 'https://moodle.example/files/diseno.md'},
    {name: 'plan_v2.xlsx', kind: 'version', size: 500, url: 'https://moodle.example/files/plan_v2.xlsx'},
    {name: 'guia.docx', kind: 'version', size: 4096, url: 'https://moodle.example/files/guia.docx'},
]};
const HISTORY = [
    {role: 'user', content: 'Quiero un curso de soldadura'},
    {role: 'assistant', content: '**Bien**, empecemos.'},
];

/**
 * The answer of local_coursegen_designer_start for a saved conversation.
 *
 * @param {object} extra
 * @returns {object}
 */
const resumed = (extra = {}) => ({success: true, data: {resumed: true, lang: 'es', history: HISTORY, ...extra}});

const modal = () => Modal.instances[Modal.instances.length - 1];
const $ = (selector) => modal().root.querySelector(selector);
const startCalls = () => Ajax.callsTo('local_coursegen_designer_start');

/**
 * Open the designer with the given answers of the web services.
 *
 * @param {object} start Answer of local_coursegen_designer_start.
 * @param {object} others Other answers.
 */
const open = async(start, others = {}) => {
    Ajax.setResponses({
        'local_coursegen_designer_start': start,
        'local_coursegen_designer_files': FILES,
        ...others,
    });
    await designer.init({courseid: 3});
    await flush();
};

beforeEach(() => {
    jest.resetModules();
    Ajax = require('core/ajax');
    Modal = require('core/modal').default;
    Modal.instances = [];
    Notification = require('core/notification').default;
    courseStreaming = require('local_coursegen/course_streaming');
    designer = require('local_coursegen/designer_chat');
});

describe('resuming a conversation', () => {
    it('shows the saved messages and says that the conversation was resumed', async() => {
        await open(resumed());

        expect(startCalls()).toEqual([{courseid: 3, newsession: false, lang: ''}]);
        expect($('#designer-ai-response')).toBeNull();
        const messages = Array.from(modal().root.querySelectorAll('#designer-chat-messages .local_coursegen_ai_msg'));
        expect(messages.map((message) => message.classList.contains('user') ? 'user' : 'ai')).toEqual(['user', 'ai']);
        expect(messages[0].textContent).toContain('Quiero un curso de soldadura');
        expect(messages[1].querySelector('strong').textContent).toBe('Bien');
        expect($('#designer-chat-messages').lastElementChild.textContent).toBe('[designer_resumed]');
    });

    it('enables the toolbar and selects the language of the conversation', async() => {
        await open(resumed({lang: 'eu'}));

        expect($('[data-action="designer-new-conversation"]').disabled).toBe(false);
        expect($('[data-action="designer-toggle-files"]').disabled).toBe(false);
        expect($('[data-region="designer-language"]').value).toBe('eu');
        expect($('[data-region="designer-language"]').disabled).toBe(false);
    });

    it('lists the design files with their icon, size and badges', async() => {
        await open(resumed());

        const items = Array.from($('[data-region="designer-files-list"]').children);
        expect(items.map((item) => item.querySelector('a').textContent)).toEqual(['diseno.md', 'plan_v2.xlsx', 'guia.docx']);
        expect(items.map((item) => item.querySelector('i').className)).toEqual([
            'fa fa-file-text-o text-muted', 'fa fa-file-excel-o text-muted', 'fa fa-file-word-o text-muted',
        ]);
        expect(items.map((item) => item.querySelector('small').textContent)).toEqual(['2 KB', '500 B', '4 KB']);
        expect(items.map((item) => item.querySelector('.badge')?.textContent ?? '')).toEqual([
            '[designer_file_design]', '[designer_file_latest]', '',
        ]);
        expect($('[data-region="designer-files-count"]').textContent).toBe('3');
        expect($('[data-region="designer-files-empty"]').hidden).toBe(true);
    });

    it('shows the files panel on demand and refreshes it each time it opens', async() => {
        await open(resumed());
        const toggle = $('[data-action="designer-toggle-files"]');
        expect($('[data-region="designer-files-panel"]').hidden).toBe(true);

        toggle.click();
        await flush();
        expect($('[data-region="designer-files-panel"]').hidden).toBe(false);
        expect(toggle.getAttribute('aria-expanded')).toBe('true');
        expect(Ajax.callsTo('local_coursegen_designer_files')).toHaveLength(2);

        toggle.click();
        await flush();
        expect($('[data-region="designer-files-panel"]').hidden).toBe(true);
        expect(toggle.getAttribute('aria-expanded')).toBe('false');
        expect(Ajax.callsTo('local_coursegen_designer_files')).toHaveLength(2);
    });

    it('reopens the conversation in another language', async() => {
        await open(resumed());
        const first = modal();

        $('[data-region="designer-language"]').value = 'en';
        $('[data-region="designer-language"]').dispatchEvent(new Event('change'));
        await flush();

        expect(first.destroyed).toBe(true);
        expect(startCalls()[1]).toEqual({courseid: 3, newsession: false, lang: 'en'});
    });

    it('starts a new conversation after confirming', async() => {
        await open(resumed());

        $('[data-action="designer-new-conversation"]').click();
        await flush();

        expect(Notification.saveCancelPromise).toHaveBeenCalledWith(
            '[designer_new_conversation]', '[designer_new_conversation_confirm]', '[designer_new_conversation]');
        expect(startCalls()[1]).toEqual({courseid: 3, newsession: true, lang: ''});
    });

    it('keeps the conversation when starting a new one is cancelled', async() => {
        await open(resumed());
        Notification.saveCancelPromise.mockReturnValueOnce(Promise.reject(new Error('Cancelled')));

        $('[data-action="designer-new-conversation"]').click();
        await flush();

        expect(startCalls()).toHaveLength(1);
        expect(modal().destroyed).toBe(false);
    });
});

describe('a finished design', () => {
    it('offers to create the course and hides the chat input', async() => {
        await open(resumed({readytogenerate: true}));

        expect($('#designer-phase-indicator').style.display).toBe('none');
        expect($('#designer-chat-input-area').style.display).toBe('none');
        expect($('.alert-success').textContent).toContain('[designer_design_complete]');
        expect($('[data-action="designer-continue-editing"]')).not.toBeNull();
        expect($('[data-action="designer-accept-plan"]').textContent).toContain('[accept_planning_create_course]');
    });

    it('lets the user keep editing', async() => {
        await open(resumed({readytogenerate: true}));

        $('[data-action="designer-continue-editing"]').click();

        expect($('#designer-chat-input-area').style.display).toBe('');
        expect($('#designerChatInput').disabled).toBe(false);
    });

    it('creates the course and follows its creation', async() => {
        await open(resumed({readytogenerate: true}), {
            'local_coursegen_plan_course_execute': {success: true, data: {streamingurl: 'https://ai.example/exec/3'}},
        });

        $('[data-action="designer-accept-plan"]').click();
        await flush();

        expect(Ajax.callsTo('local_coursegen_plan_course_execute')).toEqual([{courseid: 3}]);
        expect($('[data-action="designer-accept-plan"]').disabled).toBe(true);
        const container = $('#designer-execution-container');
        expect(courseStreaming.startExecutionStreaming).toHaveBeenCalledWith(
            'https://ai.example/exec/3', container.firstElementChild, 3);
        expect(container.querySelector('h6').textContent).toBe('[course_creating_title]');
    });

    it('gives the button back when the course cannot be created', async() => {
        const failure = new Error('No credits');
        await open(resumed({readytogenerate: true}), {
            'local_coursegen_plan_course_execute': () => {
                throw failure;
            },
        });

        $('[data-action="designer-accept-plan"]').click();
        await flush();

        expect(Notification.exception).toHaveBeenCalledWith(failure);
        expect($('[data-action="designer-accept-plan"]').disabled).toBe(false);
    });
});

describe('a session that cannot start', () => {
    it('shows the reason as text', async() => {
        await open({success: false, message: '<b>Sin créditos</b>'});

        expect($('#designer-ai-response .text-danger').textContent).toBe('<b>Sin créditos</b>');
        expect($('#designer-ai-response b')).toBeNull();
        expect($('[data-action="designer-new-conversation"]').disabled).toBe(true);
    });

    it('shows a failed connection', async() => {
        await open(() => {
            throw new Error('Connection refused');
        });

        expect($('#designer-ai-response .text-danger').textContent).toBe('Connection refused');
    });
});
