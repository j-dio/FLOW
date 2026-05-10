// LandingPage.jsx
// Entry point of the app. Controls which screen the user sees.
//
// Flow:
//   1. Check localStorage for existing identity
//   2a. No identity → show name prompt
//   2b. Has identity → show Create / Join options
//   3a. User picks Create → show CreateWorkspace screen
//   3b. User picks Join   → show JoinWorkspace screen
//   4.  On success → navigate to board (calls onEnterBoard prop)

import { useState } from "react";
import { getOrCreateIdentity, createIdentity } from "../utils/identity";
import CreateWorkspace from "./CreateWorkspace";
import JoinWorkspace from "./JoinWorkspace";

/**
 * @param {{ onEnterBoard: (workspaceId: string) => void }} props
 *
 * onEnterBoard — called when the user successfully creates or joins a workspace.
 *                The parent (App.jsx) uses this to switch to the board view.
 */
export default function LandingPage({ onEnterBoard }) {
  // Resolve identity immediately — null means first-time visitor
  const stored = getOrCreateIdentity();

  const [screen, setScreen] = useState(stored ? "options" : "name-prompt");
  const [identity, setIdentity] = useState(stored);
  const [nameInput, setNameInput] = useState("");
  const [nameError, setNameError] = useState("");

  // ── Name prompt ─────────────────────────────────────────────────────────────
  function handleNameSubmit() {
    const trimmed = nameInput.trim();
    if (!trimmed) {
      setNameError("Please enter a display name.");
      return;
    }
    if (trimmed.length < 2) {
      setNameError("Name must be at least 2 characters.");
      return;
    }
    if (trimmed.length > 24) {
      setNameError("Name must be 24 characters or fewer.");
      return;
    }
    const newIdentity = createIdentity(trimmed);
    setIdentity(newIdentity);
    setScreen("options");
  }

  function handleNameKeyDown(e) {
    if (e.key === "Enter") handleNameSubmit();
  }

  // ── Shared callbacks ────────────────────────────────────────────────────────
  function handleJoined(workspaceId) {
    onEnterBoard(workspaceId);
  }

  // ── Screens ─────────────────────────────────────────────────────────────────
  if (screen === "create") {
    return (
      <CreateWorkspace
        identity={identity}
        onJoined={handleJoined}
        onBack={() => setScreen("options")}
      />
    );
  }

  if (screen === "join") {
    return (
      <JoinWorkspace
        identity={identity}
        onJoined={handleJoined}
        onBack={() => setScreen("options")}
      />
    );
  }

  // ── Name prompt screen ──────────────────────────────────────────────────────
  if (screen === "name-prompt") {
    return (
      <div className="min-h-screen bg-zinc-950 text-white flex items-center justify-center px-4">
        <div className="w-full max-w-md">

          {/* Wordmark */}
          <div className="mb-10">
            <h1 className="text-4xl font-bold tracking-tight">Flow</h1>
            <p className="text-zinc-400 mt-2 text-sm italic">
              "Drop everything else. Go with the Flow."
            </p>
          </div>

          {/* Name prompt */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">
                What should we call you?
              </label>
              <input
                type="text"
                value={nameInput}
                onChange={(e) => {
                  setNameInput(e.target.value);
                  setNameError("");
                }}
                onKeyDown={handleNameKeyDown}
                placeholder="Display name"
                maxLength={24}
                autoFocus
                className={`
                  w-full bg-zinc-900 border rounded-lg px-4 py-3
                  text-white placeholder:text-zinc-600
                  focus:outline-none focus:ring-2 transition-all
                  ${nameError
                    ? "border-red-700 focus:ring-red-700"
                    : "border-zinc-700 focus:ring-zinc-500"
                  }
                `}
              />
              {nameError && (
                <p className="text-red-400 text-xs mt-2">{nameError}</p>
              )}
            </div>

            <button
              onClick={handleNameSubmit}
              className="w-full bg-white text-zinc-950 font-semibold py-3 rounded-lg hover:bg-zinc-100 transition-colors"
            >
              Continue →
            </button>
          </div>

        </div>
      </div>
    );
  }

  // ── Options screen (Create or Join) ─────────────────────────────────────────
  return (
    <div className="min-h-screen bg-zinc-950 text-white flex items-center justify-center px-4">
      <div className="w-full max-w-md">

        {/* Wordmark */}
        <div className="mb-10">
          <h1 className="text-4xl font-bold tracking-tight">Flow</h1>
          <p className="text-zinc-400 mt-2 text-sm italic">
            "Drop everything else. Go with the Flow."
          </p>
          <p className="text-zinc-500 text-sm mt-4">
            Welcome back,{" "}
            <span className="text-zinc-300 font-medium">{identity?.displayName}</span>.
          </p>
        </div>

        {/* Options */}
        <div className="space-y-3">
          <button
            onClick={() => setScreen("create")}
            className="w-full bg-white text-zinc-950 font-semibold py-4 rounded-lg hover:bg-zinc-100 transition-colors text-left px-6"
          >
            <span className="block text-base">Create a workspace</span>
            <span className="block text-xs font-normal text-zinc-500 mt-0.5">
              Start a new session and invite your team
            </span>
          </button>

          <button
            onClick={() => setScreen("join")}
            className="w-full border border-zinc-700 text-zinc-300 font-semibold py-4 rounded-lg hover:bg-zinc-900 transition-colors text-left px-6"
          >
            <span className="block text-base">Join a workspace</span>
            <span className="block text-xs font-normal text-zinc-500 mt-0.5">
              Enter an invite code from your teammate
            </span>
          </button>
        </div>

      </div>
    </div>
  );
}