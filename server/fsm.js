// fsm.js - the pure transition engine. no imports, no side effects, no async. ever.

const STATES = {
  DRAFT: 'DRAFT',
  TIME_ESTIMATING: 'TIME_ESTIMATING',
  IN_PROGRESS: 'IN_PROGRESS',
  PAUSED: 'PAUSED',
  REVIEW: 'REVIEW',
  RESOLVED: 'RESOLVED',
  CANCELLED: 'CANCELLED',
};

const SYMBOLS = {
  ADD_DETAILS: 'add_details',
  PROVIDE_VALID_ESTIMATE: 'provide_valid_estimate',
  PAUSE: 'pause',
  RESUME: 'resume',
  SUBMIT_FOR_REVIEW: 'submit_for_review',
  REQUEST_CHANGES: 'request_changes',
  RECEIVE_PEER_APPROVAL: 'receive_peer_approval',
  CANCEL: 'cancel',
};

// δ as a nested object: TRANSITIONS[state][symbol] = next state
// only defined transitions are listed here - anything else is a no-op by design
const TRANSITIONS = {
  [STATES.DRAFT]: {
    [SYMBOLS.ADD_DETAILS]: STATES.TIME_ESTIMATING,
    [SYMBOLS.CANCEL]:      STATES.CANCELLED,
  },
  [STATES.TIME_ESTIMATING]: {
    [SYMBOLS.PROVIDE_VALID_ESTIMATE]: STATES.IN_PROGRESS,
    [SYMBOLS.CANCEL]:                 STATES.CANCELLED,
  },
  [STATES.IN_PROGRESS]: {
    [SYMBOLS.PAUSE]:            STATES.PAUSED,
    [SYMBOLS.SUBMIT_FOR_REVIEW]: STATES.REVIEW,
    [SYMBOLS.CANCEL]:            STATES.CANCELLED,
  },
  [STATES.PAUSED]: {
    [SYMBOLS.RESUME]: STATES.IN_PROGRESS,
  },
  [STATES.REVIEW]: {
    [SYMBOLS.REQUEST_CHANGES]:      STATES.IN_PROGRESS,
    [SYMBOLS.RECEIVE_PEER_APPROVAL]: STATES.RESOLVED,
  },
  // RESOLVED and CANCELLED are terminal - no outgoing transitions
};

// returns the next state, or the same state if the symbol has no defined path from here
function applyTransition(state, symbol) {
  return TRANSITIONS[state]?.[symbol] ?? state;
}

export { STATES, SYMBOLS, applyTransition };
