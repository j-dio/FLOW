// JoinWorkspace.jsx
// Screen where a user enters a 6-character invite code to join a workspace.
// Emits "join_workspace" via socket and waits for "workspace_joined" or "workspace_error".

import { useState, useEffect, useRef } from "react";
import socket, { connectSocket, emitJoinWorkspace } from "../utils/socket";
import { saveWorkspaceId } from "../utils/identity";

/**
 * @param {{ identity: { userId: string, displayName: string }, onJoined: (workspaceId: string) => void, onBack: () => void }} props
 *
 * identity  — the current user's identity from localStorage
 * onJoined  — called when the workspace is successfully joined; navigate to board
 * onBack    — called when the user wants to go back to the landing page
 */
export default function JoinWorkspace({ identity, onJoined, onBack }) {
  const [code, setCode] = useState("");
  const [status, setStatus] = useState("idle"); // idle | loading | error
  const [errorMsg, setErrorMsg] = useState("");
  const inputRef = useRef(null);

  // Auto-focus the input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // ── Socket listeners ────────────────────────────────────────────────────────
  useEffect(() => {
    function onWorkspaceJoined({ workspaceId }) {
      saveWorkspaceId(workspaceId);
      onJoined(workspaceId);
    }

    function onWorkspaceError({ message }) {
      setErrorMsg(message ?? "Invalid code. Please check and try again.");
      setStatus("error");
    }

    socket.on("workspace_joined", onWorkspaceJoined);
    socket.on("workspace_error", onWorkspaceError);

    return () => {
      socket.off("workspace_joined", onWorkspaceJoined);
      socket.off("workspace_error", onWorkspaceError);
    };
  }, [onJoined]);

  // ── Actions ─────────────────────────────────────────────────────────────────
  function handleCodeChange(e) {
    // Only allow letters and numbers, max 6 characters, always uppercase
    const cleaned = e.target.value.replace(/[^a-zA-Z0-9]/g, "").toUpperCase().slice(0, 6);
    setCode(cleaned);
    if (status === "error") {
      setErrorMsg("");
      setStatus("idle");
    }
  }

  function handleJoin() {
    if (code.length !== 6) return;
    setStatus("loading");
    setErrorMsg("");
    connectSocket();
    emitJoinWorkspace(identity, code);
  }

  // Allow submitting with Enter key
  function handleKeyDown(e) {
    if (e.key === "Enter") handleJoin();
  }

  const isReady = code.length === 6;

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
          <h1 className="text-3xl font-bold tracking-tight">Join a workspace</h1>
          <p className="text-zinc-400 mt-2 text-sm">
            Hi <span className="text-white font-medium">{identity.displayName}</span>.
            Enter the 6-character code shared by your teammate.
          </p>
        </div>

        {/* Code input */}
        <div className="space-y-4">
          <div className="relative">
            <input
              ref={inputRef}
              type="text"
              value={code}
              onChange={handleCodeChange}
              onKeyDown={handleKeyDown}
              placeholder="ABC123"
              maxLength={6}
              disabled={status === "loading"}
              className={`
                w-full bg-zinc-900 border rounded-lg px-4 py-4
                text-center text-3xl font-mono font-bold tracking-[0.4em]
                placeholder:text-zinc-700 placeholder:tracking-[0.4em]
                focus:outline-none focus:ring-2 transition-all
                disabled:opacity-50 disabled:cursor-not-allowed
                ${status === "error"
                  ? "border-red-700 focus:ring-red-700 text-red-400"
                  : "border-zinc-700 focus:ring-zinc-500 text-white"
                }
              `}
            />
            {/* Character count indicator */}
            <span className="absolute right-3 bottom-3 text-xs text-zinc-600 font-mono">
              {code.length}/6
            </span>
          </div>

          {/* Inline error message */}
          {status === "error" && (
            <div className="bg-red-950 border border-red-800 text-red-300 text-sm px-4 py-3 rounded-lg">
              {errorMsg}
            </div>
          )}

          {/* Join button */}
          <button
            onClick={handleJoin}
            disabled={!isReady || status === "loading"}
            className={`
              w-full font-semibold py-3 rounded-lg transition-all flex items-center justify-center gap-2
              ${isReady && status !== "loading"
                ? "bg-white text-zinc-950 hover:bg-zinc-100"
                : "bg-zinc-800 text-zinc-500 cursor-not-allowed"
              }
            `}
          >
            {status === "loading" ? (
              <>
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                </svg>
                Joining…
              </>
            ) : (
              "Join workspace →"
            )}
          </button>
        </div>

      </div>
    </div>
  );
}