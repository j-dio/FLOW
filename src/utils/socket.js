// socket.js
// Single shared Socket.io client instance for the entire app.
// Handles connection, reconnection, and identity re-subscription.
//
// Usage: import socket from '../utils/socket';

import { io } from "socket.io-client";
import {
  getStoredIdentity,
  getStoredWorkspaceId,
} from "./identity";

// ─── Config ───────────────────────────────────────────────────────────────────
// Change this to Dio's server URL once his backend is running.
// During solo development, you can spin up a minimal mock server or just
// let connection attempts fail silently — the rest of your UI still renders.
const SERVER_URL = import.meta.env.VITE_SERVER_URL ?? "http://localhost:3000";

// ─── Socket instance ──────────────────────────────────────────────────────────
const socket = io(SERVER_URL, {
  autoConnect: false,   // We control when to connect (after identity is known)
  reconnection: true,
  reconnectionAttempts: Infinity,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
});

// ─── Reconnection logic ───────────────────────────────────────────────────────
// When the socket reconnects after a drop, re-subscribe to the workspace
// using the identity and workspaceId stored in localStorage.
socket.on("connect", () => {
  console.log("[socket] connected:", socket.id);

  const identity = getStoredIdentity();
  const workspaceId = getStoredWorkspaceId();

  // If the user already belongs to a workspace, re-join it automatically.
  // Dio's server will re-attach the identity and broadcast full state back.
  if (identity && workspaceId) {
    console.log("[socket] rejoining workspace:", workspaceId);
    socket.emit("rejoin_workspace", {
      userId: identity.userId,
      displayName: identity.displayName,
      workspaceId,
    });
  }
});

socket.on("disconnect", (reason) => {
  console.log("[socket] disconnected:", reason);
});

socket.on("connect_error", (err) => {
  console.warn("[socket] connection error:", err.message);
});

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Call this once the user has an identity (after name prompt or on return visit).
 * Starts the socket connection for the first time.
 */
export function connectSocket() {
  if (!socket.connected) {
    socket.connect();
  }
}

/**
 * Emits create_workspace with the user's identity.
 * The server responds with a "workspace_created" event containing the invite code.
 * @param {{ userId: string, displayName: string }} identity
 */
export function emitCreateWorkspace(identity) {
  socket.emit("create_workspace", {
    userId: identity.userId,
    displayName: identity.displayName,
  });
}

/**
 * Emits join_workspace with the user's identity and the invite code.
 * The server responds with "workspace_joined" on success or "workspace_error" on failure.
 * @param {{ userId: string, displayName: string }} identity
 * @param {string} code - 6-character invite code
 */
export function emitJoinWorkspace(identity, code) {
  socket.emit("join_workspace", {
    userId: identity.userId,
    displayName: identity.displayName,
    code: code.trim().toUpperCase(),
  });
}

export default socket;