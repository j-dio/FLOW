// CreateWorkspace.jsx
// Screen where a user creates a new workspace and receives an invite code.
// Emits "create_workspace" via socket and waits for "workspace_created" response.

import { useState, useEffect } from "react";
import socket, { connectSocket, emitCreateWorkspace } from "../utils/socket";
import { saveWorkspaceId } from "../utils/identity";

/**
 * @param {{ identity: { userId: string, displayName: string }, onJoined: (workspaceId: string, code: string) => void, onBack: () => void }} props
 *
 * identity  — the current user's identity from localStorage
 * onJoined  — called when the workspace is successfully created; navigate to board
 * onBack    — called when the user wants to go back to the landing page
 */
export default function CreateWorkspace({ identity, onJoined, onBack }) {
  const [status, setStatus] = useState("idle"); // idle | loading | success | error
  const [inviteCode, setInviteCode] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [copied, setCopied] = useState(false);

  // ── Socket listeners ────────────────────────────────────────────────────────
  useEffect(() => {
    function onWorkspaceCreated({ workspaceId, code }) {
      saveWorkspaceId(workspaceId);
      setInviteCode(code);
      setStatus("success");
    }

    function onWorkspaceError({ message }) {
      setErrorMsg(message ?? "Something went wrong. Please try again.");
      setStatus("error");
    }

    socket.on("workspace_created", onWorkspaceCreated);
    socket.on("workspace_error", onWorkspaceError);

    return () => {
      socket.off("workspace_created", onWorkspaceCreated);
      socket.off("workspace_error", onWorkspaceError);
    };
  }, []);

  // ── Actions ─────────────────────────────────────────────────────────────────
  function handleCreate() {
    setStatus("loading");
    setErrorMsg("");
    connectSocket();
    emitCreateWorkspace(identity);
  }

  function handleCopyCode() {
    navigator.clipboard.writeText(inviteCode).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  function handleEnterBoard() {
    onJoined(inviteCode);
  }

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-zinc-950 text-white flex items-center justify-center px-4">
      <div className="w-full max-w-md">

        {/* Header */}
        <div className="mb-10">
          <button
            onClick={onBack}
            className="text-zinc-500 hover:text-zinc-300 text-sm mb-6 flex items-center gap-1 transition-colors"
          >
            ← Back
          </button>
          <h1 className="text-3xl font-bold tracking-tight">Create a workspace</h1>
          <p className="text-zinc-400 mt-2 text-sm">
            Hi <span className="text-white font-medium">{identity.displayName}</span>. 
            A new workspace will be created for you. Share the invite code with your team.
          </p>
        </div>

        {/* Idle state — create button */}
        {status === "idle" && (
          <button
            onClick={handleCreate}
            className="w-full bg-white text-zinc-950 font-semibold py-3 rounded-lg hover:bg-zinc-100 transition-colors"
          >
            Create workspace
          </button>
        )}

        {/* Loading state */}
        {status === "loading" && (
          <div className="flex items-center gap-3 text-zinc-400">
            <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
            </svg>
            <span className="text-sm">Creating your workspace…</span>
          </div>
        )}

        {/* Error state */}
        {status === "error" && (
          <div className="space-y-4">
            <div className="bg-red-950 border border-red-800 text-red-300 text-sm px-4 py-3 rounded-lg">
              {errorMsg}
            </div>
            <button
              onClick={handleCreate}
              className="w-full bg-white text-zinc-950 font-semibold py-3 rounded-lg hover:bg-zinc-100 transition-colors"
            >
              Try again
            </button>
          </div>
        )}

        {/* Success state — show invite code */}
        {status === "success" && (
          <div className="space-y-6">
            <div className="bg-zinc-900 border border-zinc-700 rounded-xl p-6 text-center">
              <p className="text-zinc-400 text-xs uppercase tracking-widest mb-3">
                Your invite code
              </p>
              <p className="text-5xl font-mono font-bold tracking-[0.25em] text-white">
                {inviteCode}
              </p>
              <p className="text-zinc-500 text-xs mt-3">
                Share this with your teammates so they can join.
              </p>
            </div>

            <button
              onClick={handleCopyCode}
              className="w-full border border-zinc-700 text-zinc-300 font-medium py-3 rounded-lg hover:bg-zinc-900 transition-colors text-sm"
            >
              {copied ? "✓ Copied!" : "Copy code"}
            </button>

            <button
              onClick={handleEnterBoard}
              className="w-full bg-white text-zinc-950 font-semibold py-3 rounded-lg hover:bg-zinc-100 transition-colors"
            >
              Enter workspace →
            </button>
          </div>
        )}

      </div>
    </div>
  );
}