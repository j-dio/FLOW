import { randomUUID } from 'node:crypto';
import { STATES, SYMBOLS, applyTransition } from './fsm.js';

class Task {
  constructor(name, creatorId) {
    this.taskId = randomUUID();
    this.name = name;
    this.creatorId = creatorId;
    this.state = STATES.DRAFT;
    this.estimateMinutes = null;
    // timer fields — all managed by _updateTimers
    this.startedAt = null;    // Date.now() when IN_PROGRESS was first entered
    this.pausedAt = null;     // Date.now() when the current PAUSED period started
    this.accumulatedMs = 0;   // total ms spent paused across all pauses
    this.resolvedAt = null;
  }

  setEstimate(minutes) {
    this.estimateMinutes = minutes;
  }

  // applies the symbol with application-layer guards before touching the fsm
  // returns { ok: true } or { ok: false, reason: string }
  transition(symbol, userId, memberCount) {
    if (symbol === SYMBOLS.PROVIDE_VALID_ESTIMATE) {
      if (!Number.isInteger(this.estimateMinutes) || this.estimateMinutes <= 0) {
        return { ok: false, reason: 'estimate must be a positive whole number of minutes' };
      }
    }

    if (symbol === SYMBOLS.RECEIVE_PEER_APPROVAL) {
      // solo workspace (1 member) is allowed to self-approve — relaxed rule per prd
      if (memberCount >= 2 && userId === this.creatorId) {
        return { ok: false, reason: 'you cannot approve your own task' };
      }
    }

    const next = applyTransition(this.state, symbol);

    if (next === this.state) {
      return { ok: false, reason: `${symbol} is not a valid transition from ${this.state}` };
    }

    this._updateTimers(next);
    this.state = next;
    return { ok: true };
  }

  // keeps timer fields consistent when state changes
  _updateTimers(nextState) {
    const now = Date.now();

    if (nextState === STATES.IN_PROGRESS) {
      if (this.startedAt === null) {
        this.startedAt = now;
      } else if (this.pausedAt !== null) {
        // resuming from pause — fold the paused duration into accumulated total
        this.accumulatedMs += now - this.pausedAt;
        this.pausedAt = null;
      }
    }

    if (nextState === STATES.PAUSED) {
      this.pausedAt = now;
    }

    if (nextState === STATES.RESOLVED) {
      this.resolvedAt = now;
    }
  }

  getElapsedMs() {
    if (this.startedAt === null) return 0;
    // use pausedAt as the ceiling if currently paused so elapsed doesn't drift upward
    const effectiveNow = this.state === STATES.PAUSED ? this.pausedAt : Date.now();
    return effectiveNow - this.startedAt - this.accumulatedMs;
  }

  toJSON() {
    return {
      taskId: this.taskId,
      name: this.name,
      creatorId: this.creatorId,
      state: this.state,
      estimateMinutes: this.estimateMinutes,
      elapsedMs: this.getElapsedMs(),
      resolvedAt: this.resolvedAt,
    };
  }
}

export default Task;
