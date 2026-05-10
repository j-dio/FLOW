// MemberList.jsx
// Displays the live list of members currently in the workspace.
// Listens for "member_update" from the server and re-renders automatically.
// Also highlights the current user with a "you" badge.

import { useState, useEffect } from "react";
import socket from "../utils/socket";

/**
 * @param {{ currentUserId: string }} props
 *
 * currentUserId — the logged-in user's UUID (from identity.js)
 *                 used to highlight "you" in the list
 */
export default function MemberList({ currentUserId }) {
  const [members, setMembers] = useState([]);

  // ── Socket listener ─────────────────────────────────────────────────────────
  // Server broadcasts "member_update" with the full current member array
  // whenever someone joins, leaves, or reconnects.
  useEffect(() => {
    function onMemberUpdate({ members: updatedMembers }) {
      setMembers(updatedMembers);
    }

    socket.on("member_update", onMemberUpdate);

    return () => {
      socket.off("member_update", onMemberUpdate);
    };
  }, []);

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="w-56 bg-zinc-900 border-l border-zinc-800 p-4 flex flex-col gap-3">

      {/* Panel header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xs font-semibold uppercase tracking-widest text-zinc-500">
          Members
        </h2>
        <span className="text-xs text-zinc-600 font-mono">
          {members.length}
        </span>
      </div>

      {/* Member list */}
      {members.length === 0 ? (
        <p className="text-zinc-600 text-xs italic">No members yet.</p>
      ) : (
        <ul className="space-y-2">
          {members.map((member) => {
            const isYou = member.userId === currentUserId;
            return (
              <li
                key={member.userId}
                className="flex items-center gap-2"
              >
                {/* Avatar circle — initials */}
                <div className="w-7 h-7 rounded-full bg-zinc-700 flex items-center justify-center flex-shrink-0">
                  <span className="text-xs font-bold text-zinc-300 uppercase">
                    {member.displayName?.[0] ?? "?"}
                  </span>
                </div>

                {/* Name + badge */}
                <div className="flex items-center gap-1 min-w-0">
                  <span className="text-sm text-zinc-200 truncate">
                    {member.displayName}
                  </span>
                  {isYou && (
                    <span className="text-[10px] text-zinc-500 bg-zinc-800 px-1.5 py-0.5 rounded font-medium flex-shrink-0">
                      you
                    </span>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}

    </div>
  );
}