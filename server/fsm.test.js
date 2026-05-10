// fsm.test.js - unit tests for applyTransition
// run with: node server/fsm.test.js

import assert from 'node:assert/strict';
import { STATES, SYMBOLS, applyTransition } from './fsm.js';

let passed = 0;
let failed = 0;

function test(label, fn) {
  try {
    fn();
    console.log(`  ✓ ${label}`);
    passed++;
  } catch (err) {
    console.error(`  ✗ ${label}`);
    console.error(`    ${err.message}`);
    failed++;
  }
}

// ── defined transitions (every row in δ) ─────────────────────────────────────

console.log('\ndefined transitions');

test('DRAFT + add_details → TIME_ESTIMATING', () => {
  assert.equal(applyTransition(STATES.DRAFT, SYMBOLS.ADD_DETAILS), STATES.TIME_ESTIMATING);
});

test('DRAFT + cancel → CANCELLED', () => {
  assert.equal(applyTransition(STATES.DRAFT, SYMBOLS.CANCEL), STATES.CANCELLED);
});

test('TIME_ESTIMATING + provide_valid_estimate → IN_PROGRESS', () => {
  assert.equal(applyTransition(STATES.TIME_ESTIMATING, SYMBOLS.PROVIDE_VALID_ESTIMATE), STATES.IN_PROGRESS);
});

test('TIME_ESTIMATING + cancel → CANCELLED', () => {
  assert.equal(applyTransition(STATES.TIME_ESTIMATING, SYMBOLS.CANCEL), STATES.CANCELLED);
});

test('IN_PROGRESS + pause → PAUSED', () => {
  assert.equal(applyTransition(STATES.IN_PROGRESS, SYMBOLS.PAUSE), STATES.PAUSED);
});

test('IN_PROGRESS + submit_for_review → REVIEW', () => {
  assert.equal(applyTransition(STATES.IN_PROGRESS, SYMBOLS.SUBMIT_FOR_REVIEW), STATES.REVIEW);
});

test('IN_PROGRESS + cancel → CANCELLED', () => {
  assert.equal(applyTransition(STATES.IN_PROGRESS, SYMBOLS.CANCEL), STATES.CANCELLED);
});

test('PAUSED + resume → IN_PROGRESS', () => {
  assert.equal(applyTransition(STATES.PAUSED, SYMBOLS.RESUME), STATES.IN_PROGRESS);
});

test('REVIEW + request_changes → IN_PROGRESS', () => {
  assert.equal(applyTransition(STATES.REVIEW, SYMBOLS.REQUEST_CHANGES), STATES.IN_PROGRESS);
});

test('REVIEW + receive_peer_approval → RESOLVED', () => {
  assert.equal(applyTransition(STATES.REVIEW, SYMBOLS.RECEIVE_PEER_APPROVAL), STATES.RESOLVED);
});

// ── no-ops (one undefined symbol per state) ───────────────────────────────────

console.log('\nno-ops — undefined symbols must return state unchanged');

test('DRAFT + resume → DRAFT', () => {
  assert.equal(applyTransition(STATES.DRAFT, SYMBOLS.RESUME), STATES.DRAFT);
});

test('TIME_ESTIMATING + pause → TIME_ESTIMATING', () => {
  assert.equal(applyTransition(STATES.TIME_ESTIMATING, SYMBOLS.PAUSE), STATES.TIME_ESTIMATING);
});

test('IN_PROGRESS + add_details → IN_PROGRESS', () => {
  assert.equal(applyTransition(STATES.IN_PROGRESS, SYMBOLS.ADD_DETAILS), STATES.IN_PROGRESS);
});

test('PAUSED + cancel → PAUSED', () => {
  // cancel has no defined path from PAUSED — must not accidentally transition
  assert.equal(applyTransition(STATES.PAUSED, SYMBOLS.CANCEL), STATES.PAUSED);
});

test('REVIEW + cancel → REVIEW', () => {
  // cancel has no defined path from REVIEW — must not accidentally transition
  assert.equal(applyTransition(STATES.REVIEW, SYMBOLS.CANCEL), STATES.REVIEW);
});

test('RESOLVED + receive_peer_approval → RESOLVED', () => {
  // terminal state — nothing should move it
  assert.equal(applyTransition(STATES.RESOLVED, SYMBOLS.RECEIVE_PEER_APPROVAL), STATES.RESOLVED);
});

test('CANCELLED + add_details → CANCELLED', () => {
  // terminal state — nothing should move it
  assert.equal(applyTransition(STATES.CANCELLED, SYMBOLS.ADD_DETAILS), STATES.CANCELLED);
});

// ── happy path ────────────────────────────────────────────────────────────────

console.log('\nhappy path — DRAFT → RESOLVED');

test('straight through: add_details → provide_valid_estimate → submit_for_review → receive_peer_approval', () => {
  let state = STATES.DRAFT;
  state = applyTransition(state, SYMBOLS.ADD_DETAILS);
  assert.equal(state, STATES.TIME_ESTIMATING);
  state = applyTransition(state, SYMBOLS.PROVIDE_VALID_ESTIMATE);
  assert.equal(state, STATES.IN_PROGRESS);
  state = applyTransition(state, SYMBOLS.SUBMIT_FOR_REVIEW);
  assert.equal(state, STATES.REVIEW);
  state = applyTransition(state, SYMBOLS.RECEIVE_PEER_APPROVAL);
  assert.equal(state, STATES.RESOLVED);
});

test('with a pause/resume in the middle', () => {
  let state = STATES.DRAFT;
  state = applyTransition(state, SYMBOLS.ADD_DETAILS);
  state = applyTransition(state, SYMBOLS.PROVIDE_VALID_ESTIMATE);
  state = applyTransition(state, SYMBOLS.PAUSE);
  assert.equal(state, STATES.PAUSED);
  state = applyTransition(state, SYMBOLS.RESUME);
  assert.equal(state, STATES.IN_PROGRESS);
  state = applyTransition(state, SYMBOLS.SUBMIT_FOR_REVIEW);
  state = applyTransition(state, SYMBOLS.RECEIVE_PEER_APPROVAL);
  assert.equal(state, STATES.RESOLVED);
});

test('review rejects then approves', () => {
  let state = STATES.IN_PROGRESS;
  state = applyTransition(state, SYMBOLS.SUBMIT_FOR_REVIEW);
  assert.equal(state, STATES.REVIEW);
  state = applyTransition(state, SYMBOLS.REQUEST_CHANGES);
  assert.equal(state, STATES.IN_PROGRESS);
  state = applyTransition(state, SYMBOLS.SUBMIT_FOR_REVIEW);
  state = applyTransition(state, SYMBOLS.RECEIVE_PEER_APPROVAL);
  assert.equal(state, STATES.RESOLVED);
});

// ── cancel paths (from each cancellable state) ────────────────────────────────

console.log('\ncancel paths');

test('DRAFT → cancel → CANCELLED', () => {
  assert.equal(applyTransition(STATES.DRAFT, SYMBOLS.CANCEL), STATES.CANCELLED);
});

test('TIME_ESTIMATING → cancel → CANCELLED', () => {
  assert.equal(applyTransition(STATES.TIME_ESTIMATING, SYMBOLS.CANCEL), STATES.CANCELLED);
});

test('IN_PROGRESS → cancel → CANCELLED', () => {
  assert.equal(applyTransition(STATES.IN_PROGRESS, SYMBOLS.CANCEL), STATES.CANCELLED);
});

// ── summary ───────────────────────────────────────────────────────────────────

console.log(`\n${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
