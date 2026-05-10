import { useState } from "react";
import LandingPage from "./components/LandingPage";

export default function App() {
  const [workspaceId, setWorkspaceId] = useState(null);

  if (workspaceId) {
    // Board goes here in Sprint 2 (Sylvia's component)
    return (
      <div className="min-h-screen bg-zinc-950 text-white flex items-center justify-center">
        <p className="text-zinc-400">
          Workspace <span className="text-white font-mono">{workspaceId}</span> — board coming in Sprint 2!
        </p>
      </div>
    );
  }

  return <LandingPage onEnterBoard={(id) => setWorkspaceId(id)} />;
}