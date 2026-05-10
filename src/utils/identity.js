// identity.js
// Manages user identity (UUID + display name) persisted in localStorage.
// No side effects on import — call getOrCreateIdentity() to read/initialize.

const STORAGE_KEY = "flow_identity";

/**
 * Generates a simple UUID v4.
 * @returns {string}
 */
function generateUUID() {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Returns the stored identity, or null if none exists yet.
 * @returns {{ userId: string, displayName: string } | null}
 */
export function getStoredIdentity() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed?.userId && parsed?.displayName) return parsed;
    return null;
  } catch {
    return null;
  }
}

/**
 * Saves an identity to localStorage.
 * @param {string} userId
 * @param {string} displayName
 * @returns {{ userId: string, displayName: string }}
 */
export function saveIdentity(userId, displayName) {
  const identity = { userId, displayName };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(identity));
  return identity;
}

/**
 * Creates a brand-new identity with a fresh UUID and the given display name.
 * Persists it automatically.
 * @param {string} displayName
 * @returns {{ userId: string, displayName: string }}
 */
export function createIdentity(displayName) {
  const userId = generateUUID();
  return saveIdentity(userId, displayName.trim());
}

/**
 * Returns the stored identity if it exists, otherwise returns null.
 * Callers should prompt for a display name and then call createIdentity().
 * @returns {{ userId: string, displayName: string } | null}
 */
export function getOrCreateIdentity() {
  return getStoredIdentity();
}

/**
 * Saves the last-joined workspaceId so reconnection can re-subscribe.
 * @param {string} workspaceId
 */
export function saveWorkspaceId(workspaceId) {
  try {
    const identity = getStoredIdentity();
    if (identity) {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ ...identity, workspaceId })
      );
    }
  } catch {
    // localStorage unavailable; silently fail
  }
}

/**
 * Returns the stored workspaceId, or null.
 * @returns {string | null}
 */
export function getStoredWorkspaceId() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw)?.workspaceId ?? null;
  } catch {
    return null;
  }
}

/**
 * Clears all stored identity and workspace data.
 * Useful for "leave workspace" or testing.
 */
export function clearIdentity() {
  localStorage.removeItem(STORAGE_KEY);
}