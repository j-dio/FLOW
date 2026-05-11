class Workspace {
  constructor(workspaceId, code) {
    this.workspaceId = workspaceId;
    this.code = code;
    this.members = new Map();   // userId → User
    this.tasks = new Map();     // taskId → Task
    this.cleanupTimer = null;
  }

  addMember(user) {
    this.members.set(user.userId, user);
  }

  removeMember(userId) {
    this.members.delete(userId);
  }

  // strips socketId before broadcasting — clients don't need it
  getMembersArray() {
    return Array.from(this.members.values()).map(({ userId, displayName }) => ({
      userId,
      displayName,
    }));
  }

  addTask(task) {
    this.tasks.set(task.taskId, task);
  }

  getTask(taskId) {
    return this.tasks.get(taskId) ?? null;
  }

  getTasksArray() {
    return Array.from(this.tasks.values()).map(t => t.toJSON());
  }
}

export default Workspace;
