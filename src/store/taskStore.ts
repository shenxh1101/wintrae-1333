import { create } from 'zustand';
import type { ExportTask, Assignee, ExportScope, ExportFormat } from '../types/task';
import { mockExportTasks, mockAssignees } from '../data/mockTasks';
import { getStorage, setStorage } from '../utils/storage';

interface TaskState {
  tasks: ExportTask[];
  assignees: Assignee[];
  selectedFormat: ExportFormat;
  selectedScope: ExportScope;
  setTasks: (tasks: ExportTask[]) => void;
  addTask: (task: ExportTask) => void;
  updateTask: (id: string, updates: Partial<ExportTask>) => void;
  deleteTask: (id: string) => void;
  setSelectedFormat: (format: ExportFormat) => void;
  setSelectedScope: (scope: ExportScope) => void;
  addAssignee: (assignee: Assignee) => void;
  updateAssignee: (id: string, updates: Partial<Assignee>) => void;
  deleteAssignee: (id: string) => void;
}

const TASKS_STORAGE_KEY = 'export_tasks';
const ASSIGNEES_STORAGE_KEY = 'assignees';

const initialTasks = getStorage<ExportTask[]>(TASKS_STORAGE_KEY, mockExportTasks);
const initialAssignees = getStorage<Assignee[]>(ASSIGNEES_STORAGE_KEY, mockAssignees);

export const useTaskStore = create<TaskState>((set, get) => ({
  tasks: initialTasks,
  assignees: initialAssignees,
  selectedFormat: 'xlsx',
  selectedScope: 'all',

  setTasks: (tasks) => {
    set({ tasks });
    setStorage(TASKS_STORAGE_KEY, tasks);
  },

  addTask: (task) => {
    const tasks = [task, ...get().tasks];
    set({ tasks });
    setStorage(TASKS_STORAGE_KEY, tasks);
  },

  updateTask: (id, updates) => {
    const tasks = get().tasks.map((t) => (t.id === id ? { ...t, ...updates } : t));
    set({ tasks });
    setStorage(TASKS_STORAGE_KEY, tasks);
  },

  deleteTask: (id) => {
    const tasks = get().tasks.filter((t) => t.id !== id);
    set({ tasks });
    setStorage(TASKS_STORAGE_KEY, tasks);
  },

  setSelectedFormat: (format) => set({ selectedFormat: format }),
  setSelectedScope: (scope) => set({ selectedScope: scope }),

  addAssignee: (assignee) => {
    const assignees = [...get().assignees, assignee];
    set({ assignees });
    setStorage(ASSIGNEES_STORAGE_KEY, assignees);
  },

  updateAssignee: (id, updates) => {
    const assignees = get().assignees.map((a) =>
      a.id === id ? { ...a, ...updates } : a
    );
    set({ assignees });
    setStorage(ASSIGNEES_STORAGE_KEY, assignees);
  },

  deleteAssignee: (id) => {
    const assignees = get().assignees.filter((a) => a.id !== id);
    set({ assignees });
    setStorage(ASSIGNEES_STORAGE_KEY, assignees);
  },
}));
