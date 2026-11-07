// Tests of local_coursegen/course_streaming: following the creation of a course.
import {renderTemplate, flush, FakeEventSource} from '../helpers';

let Ajax;
let Str;
let streaming;
let container;

const statuses = () => Array.from(container.querySelectorAll('[data-region="local_coursegen/course_streaming"] .alert'))
    .map((alert) => [alert.className, alert.textContent]);

/**
 * Start following a course creation and return its event source.
 *
 * @returns {FakeEventSource}
 */
const start = async() => {
    await streaming.startExecutionStreaming('https://ai.example/exec/3', container, 3);
    return FakeEventSource.instances[FakeEventSource.instances.length - 1];
};

beforeEach(() => {
    jest.resetModules();
    FakeEventSource.instances = [];
    global.EventSource = FakeEventSource;
    document.body.innerHTML = `<div class="modal-body">${renderTemplate('local_coursegen/course_streaming_inline', {})}</div>`;
    container = document.querySelector('.modal-body').firstElementChild;
    Ajax = require('core/ajax');
    Str = require('core/str');
    streaming = require('local_coursegen/course_streaming');
});

afterEach(() => {
    delete global.EventSource;
});

describe('course creation progress', () => {
    it('listens to the URL it is given and shows the progress', async() => {
        const source = await start();

        expect(source.url).toBe('https://ai.example/exec/3');
        expect(container.querySelector('[data-region="local_coursegen/course_streaming/progress"]').style.display).toBe('block');
    });

    it('reads events written as JSON', async() => {
        const source = await start();

        await source.emit('execution_activity_start', '{"index": 2, "section_index": 1, "title": "Quiz"}');

        expect(Str.get_string).toHaveBeenCalledWith('execution_activity_start', 'local_coursegen', {index: 2, section: 1, title: 'Quiz'});
        expect(statuses()).toEqual([['alert alert-info mb-2', '[execution_activity_start]']]);
    });

    it('reads events written as a Python dictionary', async() => {
        const source = await start();

        await source.emit('execution_activity_done', "{'done': 3, 'total': 4, 'percent': 75, 'final': True, 'error': None}");

        expect(Str.get_string).toHaveBeenCalledWith('execution_activity_done', 'local_coursegen', {done: 3, total: 4, percent: 75});
    });

    it('falls back to placeholders for an event it cannot read', async() => {
        const source = await start();

        await source.emit('execution_activity_start', 'not a payload');
        await source.emit('execution_progress', '');

        expect(Str.get_string).toHaveBeenCalledWith('execution_activity_start', 'local_coursegen', {index: '?', section: '?', title: ''});
        expect(Str.get_string).toHaveBeenCalledWith('execution_progress', 'local_coursegen', {done: 0, total: 0, percent: 0});
    });

    it('shows a failed activity as an error', async() => {
        const source = await start();

        await source.emit('execution_error', '{}');

        expect(statuses()).toEqual([['alert alert-danger mb-2', '[execution_error_activity]']]);
    });

    it('creates the course when the generation is complete', async() => {
        Ajax.setResponses({'local_coursegen_create_course': {success: true}});
        const source = await start();

        await source.emit('execution_complete', '{}');

        expect(source.closed).toBe(true);
        expect(Ajax.callsTo('local_coursegen_create_course')).toEqual([{courseid: 3}]);
        expect(statuses()).toEqual([['alert alert-info mb-2', '[course_created_success_simple]']]);
    });

    it('shows why the course could not be created', async() => {
        Ajax.setResponses({'local_coursegen_create_course': {success: false, message: 'Section limit reached'}});
        const source = await start();

        await source.emit('execution_complete', '{}');

        expect(Str.get_string).toHaveBeenCalledWith('error_creating_course', 'local_coursegen', 'Section limit reached');
        expect(statuses()).toEqual([['alert alert-danger mb-2', '[error_creating_course]']]);
        await flush();
    });
});
