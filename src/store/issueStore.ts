import { create } from 'zustand';
import type { CheckIssue, IssueSeverity, IssueStatus } from '../types/issue';
import { getStorage, setStorage } from '../utils/storage';

interface IssueState {
  issues: CheckIssue[];
  selectedSeverity: IssueSeverity | 'all';
  selectedTypes: string[];
  searchKeyword: string;
  selectedIssueId: string | null;
  hasChecked: boolean;
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
}

const STORAGE_KEY = 'issues';

const initialIssues = getStorage<CheckIssue[]>(STORAGE_KEY, []);

export const useIssueStore = create<IssueState>((set, get) => ({
  issues: initialIssues,
  selectedSeverity: 'all',
  selectedTypes: [],
  searchKeyword: '',
  selectedIssueId: null,
  hasChecked: false,

  setIssues: (issues) => {
    set({ issues, hasChecked: true });
    setStorage(STORAGE_KEY, issues);
  },

  addIssue: (issue) => {
    const issues = [...get().issues, issue];
    set({ issues });
    setStorage(STORAGE_KEY, issues);
  },

  updateIssue: (id, updates) => {
    const issues = get().issues.map((i) => (i.id === id ? { ...i, ...updates } : i));
    set({ issues });
    setStorage(STORAGE_KEY, issues);
  },

  deleteIssue: (id) => {
    const issues = get().issues.filter((i) => i.id !== id);
    set({ issues });
    setStorage(STORAGE_KEY, issues);
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

  updateIssueStatus: (id, status) => {
    const issues = get().issues.map((i) => (i.id === id ? { ...i, status } : i));
    set({ issues });
    setStorage(STORAGE_KEY, issues);
  },

  assignIssue: (id, assignee, assigneeName) => {
    const issues = get().issues.map((i) =>
      i.id === id ? { ...i, assignee, assigneeName } : i
    );
    set({ issues });
    setStorage(STORAGE_KEY, issues);
  },

  bulkAssignIssues: (issueIds, assignee, assigneeName) => {
    const issues = get().issues.map((i) =>
      issueIds.includes(i.id) ? { ...i, assignee, assigneeName } : i
    );
    set({ issues });
    setStorage(STORAGE_KEY, issues);
  },

  bulkUpdateStatus: (issueIds, status) => {
    const issues = get().issues.map((i) =>
      issueIds.includes(i.id) ? { ...i, status } : i
    );
    set({ issues });
    setStorage(STORAGE_KEY, issues);
  },

  clearIssues: () => {
    set({ issues: [], hasChecked: false });
    setStorage(STORAGE_KEY, []);
  },

  getFilteredIssues: () => {
    const { issues, selectedSeverity, selectedTypes, searchKeyword } = get();
    let filtered = issues;

    if (selectedSeverity !== 'all') {
      filtered = filtered.filter((i) => i.severity === selectedSeverity);
    }

    if (selectedTypes.length > 0) {
      filtered = filtered.filter((i) => selectedTypes.includes(i.type));
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
}));
