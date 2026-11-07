// Fake of core/custom_interaction_events: the real one turns keyboard actions
// into these events; here only clicks happen, so there is nothing to define.
export default {
    events: {
        activate: 'cie:activate',
        keyboardActivate: 'cie:keyboardactivate',
    },
    define: jest.fn(),
};
