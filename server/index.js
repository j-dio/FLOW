import express from 'express';
import { createServer } from 'node:http';
import { Server } from 'socket.io';
import { randomUUID } from 'node:crypto';
import Workspace from './Workspace.js';
import Task from './Task.js';
import User from './User.js';

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: '*' },
});

// in-memory store — no database, workspaces are ephemeral
const workspaces = new Map();  // workspaceId → Workspace
const codeIndex  = new Map();  // code → workspaceId

function generateCode() {
  // excludes 0/O and 1/I to avoid visual confusion when sharing verbally
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code;
  do {
    code = Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  } while (codeIndex.has(code));
  return code;
}

const CLEANUP_DELAY = 5 * 60 * 1000;

io.on('connection', (socket) => {
  // per-socket state — which workspace and user this connection belongs to
  let currentWorkspaceId = null;
  let currentUserId = null;

  socket.on('create_workspace', (data) => {
    if (!data?.userId || !data?.displayName) return;

    const id   = randomUUID();
    const code = generateCode();
    const ws   = new Workspace(id, code);
    const user = new User(data.userId, data.displayName, socket.id);

    ws.addMember(user);
    workspaces.set(id, ws);
    codeIndex.set(code, id);

    socket.join(id);
    currentWorkspaceId = id;
    currentUserId = data.userId;

    socket.emit('workspace_created', { workspaceId: id, code });
    io.to(id).emit('member_update', { members: ws.getMembersArray() });
  });

  socket.on('join_workspace', (data) => {
    if (!data?.userId || !data?.displayName || !data?.code) return;

    const id = codeIndex.get(data.code.toUpperCase());
    if (!id) {
      socket.emit('workspace_error', { message: 'Workspace not found. Check the invite code.' });
      return;
    }

    const ws = workspaces.get(id);
    if (!ws) {
      socket.emit('workspace_error', { message: 'Workspace no longer exists.' });
      return;
    }

    if (ws.cleanupTimer) {
      clearTimeout(ws.cleanupTimer);
      ws.cleanupTimer = null;
    }

    const user = new User(data.userId, data.displayName, socket.id);
    ws.addMember(user);

    socket.join(id);
    currentWorkspaceId = id;
    currentUserId = data.userId;

    socket.emit('workspace_joined', { workspaceId: id });
    io.to(id).emit('member_update', { members: ws.getMembersArray() });
  });

  socket.on('rejoin_workspace', (data) => {
    if (!data?.userId || !data?.displayName || !data?.workspaceId) return;

    const ws = workspaces.get(data.workspaceId);
    if (!ws) {
      // workspace was cleaned up while the client was offline
      socket.emit('workspace_error', { message: 'Your workspace expired. Create or join a new one.' });
      return;
    }

    if (ws.cleanupTimer) {
      clearTimeout(ws.cleanupTimer);
      ws.cleanupTimer = null;
    }

    const user = new User(data.userId, data.displayName, socket.id);
    ws.addMember(user);

    socket.join(data.workspaceId);
    currentWorkspaceId = data.workspaceId;
    currentUserId = data.userId;

    // full state dump so the rejoining client catches up immediately
    socket.emit('workspace_state', {
      workspaceId: data.workspaceId,
      members: ws.getMembersArray(),
      tasks: ws.getTasksArray(),
    });
    io.to(data.workspaceId).emit('member_update', { members: ws.getMembersArray() });
  });

  // sprint 2: create_task and apply_transition handlers go here

  socket.on('disconnect', () => {
    if (!currentWorkspaceId || !currentUserId) return;

    const ws = workspaces.get(currentWorkspaceId);
    if (!ws) return;

    ws.removeMember(currentUserId);
    io.to(currentWorkspaceId).emit('member_update', { members: ws.getMembersArray() });

    if (ws.members.size === 0) {
      ws.cleanupTimer = setTimeout(() => {
        codeIndex.delete(ws.code);
        workspaces.delete(currentWorkspaceId);
        console.log(`[workspace] ${currentWorkspaceId} cleaned up after idle`);
      }, CLEANUP_DELAY);
    }
  });
});

const PORT = process.env.PORT ?? 3000;
httpServer.listen(PORT, () => {
  console.log(`[server] listening on http://localhost:${PORT}`);
});
