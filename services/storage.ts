
import { UserTimelineInstance, UserTask } from '../types';

const STORAGE_KEYS = {
  TIMELINES: 'lb_user_timelines',
  TASKS: 'lb_user_tasks'
};

export const storage = {
  getTimelines: (): UserTimelineInstance[] => {
    const data = localStorage.getItem(STORAGE_KEYS.TIMELINES);
    return data ? JSON.parse(data) : [];
  },

  saveTimelines: (timelines: UserTimelineInstance[]) => {
    localStorage.setItem(STORAGE_KEYS.TIMELINES, JSON.stringify(timelines));
  },

  getTasks: (instanceId?: string): UserTask[] => {
    const data = localStorage.getItem(STORAGE_KEYS.TASKS);
    const allTasks: UserTask[] = data ? JSON.parse(data) : [];
    if (instanceId) {
      return allTasks.filter(t => t.instance_id === instanceId);
    }
    return allTasks;
  },

  saveTasks: (tasks: UserTask[]) => {
    // This is tricky for an SPA without a DB. We need to merge appropriately.
    // For simplicity, we'll store all user tasks globally and replace/update.
    const allTasks = storage.getTasks();
    const taskMap = new Map(allTasks.map(t => [t.user_task_id, t]));
    tasks.forEach(t => taskMap.set(t.user_task_id, t));
    localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(Array.from(taskMap.values())));
  },

  updateTask: (userTaskId: string, updates: Partial<UserTask>) => {
    const allTasks = storage.getTasks();
    const updated = allTasks.map(t => t.user_task_id === userTaskId ? { ...t, ...updates } : t);
    localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(updated));
  },

  deleteTimeline: (instanceId: string) => {
    const timelines = storage.getTimelines().filter(t => t.instance_id !== instanceId);
    const tasks = storage.getTasks().filter(t => t.instance_id !== instanceId);
    localStorage.setItem(STORAGE_KEYS.TIMELINES, JSON.stringify(timelines));
    localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(tasks));
  }
};
