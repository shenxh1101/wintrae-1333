import { create } from 'zustand';
import type { CheckIssue, IssueSeverity, IssueStatus } from '../types/issue';
import { getStorage, setStorage } from '../utils/storage';
import { useTaskStore } from './taskStore';

interface IssueState {
  issues: CheckIssue[];
  selectedSeverity: IssueSeverity | 'all';
  selectedTypes: string[];
  searchKeyword: string;
  selectedIssueId: string | null;
  hasChecked: boolean;
  selectedPlatform: string;
  selectedAssigneeFilter: string;
  setIssues: (issues: CheckIssue[]) => void;
  addIssue: (issue: CheckIssue) => void;
  updateIssue: (id: string, updates: Partial<CheckIssue>) => void;
  deleteIssue: (id: string) => void;
  setSelectedSeverity: (severity: IssueSeverity | 'all') => void;
  setSelectedTypes: (types: string[]) => void;
  toggleSelectedType: (type: string) => void;
  setSearchKeyword: (keyword: string) => void;
  setSelectedIssueId: (id: string | null) => void;
  setHasChecked: (checked: boolean) => void;
  updateIssueStatus: (id: string, status: IssueStatus) => void;
  assignIssue: (id: string, assignee: string, assigneeName: string) => void;
  bulkAssignIssues: (issueIds: string[], assignee: string, assigneeName: string) => void;
  bulkUpdateStatus: (issueIds: string[], status: IssueStatus) => void;
  clearIssues: () => void;
  getFilteredIssues: () => CheckIssue[];
  getIssuesByProduct: (productId: string) => CheckIssue[];
  getIssuesByAssignee: (assigneeId: string) => CheckIssue[];
  setSelectedPlatform: (platform: string) => void;
  setSelectedAssigneeFilter: (assignee: string) => void;
  refreshAssigneeTaskCounts: () => void;
}

const STORAGE_KEY = 'issues';

const initialIssues = getStorage<CheckIssue[]>(STORAGE_KEY, []);

const syncAssigneeTaskCounts = (issues: CheckIssue[]) => {
  const taskStore = useTaskStore.getState();
  const updatedAssignees = taskStore.assignees.map((a) => {
    const count = issues.filter((i) => i.assignee === a.id && i.status !== 'resolved').length;
    return { ...a, taskCount: count };
  });
  useTaskStore.setState({ assignees: updatedAssignees });
  setStorage('assignees', updatedAssignees);
};

export const useIssueStore = create<IssueState>((set, get) => ({
  issues: initialIssues,
  selectedSeverity: 'all',
  selectedTypes: [],
  searchKeyword: '',
  selectedIssueId: null,
  hasChecked: false,
  selectedPlatform: 'all',
  selectedAssigneeFilter: 'all',

  setIssues: (issues) => {
    set({ issues, hasChecked: true });
    setStorage(STORAGE_KEY, issues);
    syncAssigneeTaskCounts(issues);
  },

  addIssue: (issue) => {
    const issues = [...get().issues, issue];
    set({ issues });
    setStorage(STORAGE_KEY, issues);
    syncAssigneeTaskCounts(issues);
  },

  updateIssue: (id, updates) => {
    const issues = get().issues.map((i) => (i.id === id ? { ...i, ...updates } : i));
    set({ issues });
    setStorage(STORAGE_KEY, issues);
    syncAssigneeTaskCounts(issues);
  },

  deleteIssue: (id) => {
    const issues = get().issues.filter((i) => i.id !== id);
    set({ issues });
    setStorage(STORAGE_KEY, issues);
    syncAssigneeTaskCounts(issues);
  },

  setSelectedSeverity: (severity) => set({ selectedSeverity: severity }),
  setSelectedTypes: (types) => set({ selectedTypes: types }),

  toggleSelectedType: (type) => {
    const selectedTypes = get().selectedTypes;
    if (selectedTypes.includes(type)) {
      set({ selectedTypes: selectedTypes.filter((t) => t !== type) });
    } else {
      set({ selectedTypes: [...selectedTypes, type] });
    }
  },

  setSearchKeyword: (keyword) => set({ searchKeyword: keyword }),
  setSelectedIssueId: (id) => set({ selectedIssueId: id }),
  setHasChecked: (checked) => set({ hasChecked: checked }),
  setSelectedPlatform: (platform) => set({ selectedPlatform: platform }),
  setSelectedAssigneeFilter: (assignee) => set({ selectedAssigneeFilter: assignee }),

  updateIssueStatus: (id, status) => {
    const issues = get().issues.map((i) => (i.id === id ? { ...i, status } : i));
    set({ issues });
    setStorage(STORAGE_KEY, issues);
    syncAssigneeTaskCounts(issues);
  },

  assignIssue: (id, assignee, assigneeName) => {
    const issues = get().issues.map((i) =>
      i.id === id ? { ...i, assignee, assigneeName, status: 'processing' as IssueStatus } : i
    );
    set({ issues });
    setStorage(STORAGE_KEY, issues);
    syncAssigneeTaskCounts(issues);
  },

  bulkAssignIssues: (issueIds, assignee, assigneeName) => {
    const issues = get().issues.map((i) =>
      issueIds.includes(i.id)
        ? { ...i, assignee, assigneeName, status: 'processing' as IssueStatus }
        : i
    );
    set({ issues });
    setStorage(STORAGE_KEY, issues);
    syncAssigneeTaskCounts(issues);
  },

  bulkUpdateStatus: (issueIds, status) => {
    const issues = get().issues.map((i) =>
      issueIds.includes(i.id) ? { ...i, status } : i
    );
    set({ issues });
    setStorage(STORAGE_KEY, issues);
    syncAssigneeTaskCounts(issues);
  },

  clearIssues: () => {
    set({ issues: [], hasChecked: false });
    setStorage(STORAGE_KEY, []);
    syncAssigneeTaskCounts([]);
  },

  getFilteredIssues: () => {
    const { issues, selectedSeverity, selectedTypes, searchKeyword, selectedPlatform, selectedAssigneeFilter } = get();
    let filtered = issues;

    if (selectedSeverity !== 'all') {
      filtered = filtered.filter((i) => i.severity === selectedSeverity);
    }

    if (selectedTypes.length > 0) {
      filtered = filtered.filter((i) => selectedTypes.includes(i.type));
    }

    if (selectedPlatform !== 'all') {
      filtered = filtered.filter((i) => {
        const product = useProductStore.getState().getProductById(i.productId);
        return product?.platform === selectedPlatform;
      });
    }

    if (selectedAssigneeFilter !== 'all') {
      if (selectedAssigneeFilter === 'unassigned') {
        filtered = filtered.filter((i) => !i.assignee);
      } else {
        filtered = filtered.filter((i) => i.assignee === selectedAssigneeFilter);
      }
    }

    if (searchKeyword) {
      const keyword = searchKeyword.toLowerCase();
      filtered = filtered.filter(
        (i) =>
          i.productTitle.toLowerCase().includes(keyword) ||
          i.description.toLowerCase().includes(keyword)
      );
    }

    return filtered;
  },

  getIssuesByProduct: (productId) => {
    return get().issues.filter((i) => i.productId === productId);
  },

  getIssuesByAssignee: (assigneeId) => {
    return get().issues.filter((i) => i.assignee === assigneeId);
  },

  refreshAssigneeTaskCounts: () => {
    syncAssigneeTaskCounts(get().issues);
  },
}));

import { useProductStore } from './productStore';
