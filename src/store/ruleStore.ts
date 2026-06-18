import { create } from 'zustand';
import type { PlatformRule } from '../types/rule';
import { mockPlatformRules } from '../data/mockRules';
import { getStorage, setStorage } from '../utils/storage';

interface RuleState {
  rules: PlatformRule[];
  activePlatform: string;
  setRules: (rules: PlatformRule[]) => void;
  updateRule: (platform: string, updates: Partial<PlatformRule>) => void;
  addRule: (rule: PlatformRule) => void;
  deleteRule: (platform: string) => void;
  setActivePlatform: (platform: string) => void;
  toggleRuleEnabled: (platform: string) => void;
  getRuleByPlatform: (platform: string) => PlatformRule | undefined;
  addSensitiveWord: (platform: string, word: string) => void;
  removeSensitiveWord: (platform: string, word: string) => void;
  addRequiredField: (platform: string, field: string) => void;
  removeRequiredField: (platform: string, field: string) => void;
}

const STORAGE_KEY = 'rules';

const initialRules = getStorage<PlatformRule[]>(STORAGE_KEY, mockPlatformRules);

export const useRuleStore = create<RuleState>((set, get) => ({
  rules: initialRules,
  activePlatform: 'taobao',

  setRules: (rules) => {
    set({ rules });
    setStorage(STORAGE_KEY, rules);
  },

  updateRule: (platform, updates) => {
    const rules = get().rules.map((r) =>
      r.platform === platform ? { ...r, ...updates } : r
    );
    set({ rules });
    setStorage(STORAGE_KEY, rules);
  },

  addRule: (rule) => {
    const rules = [...get().rules, rule];
    set({ rules });
    setStorage(STORAGE_KEY, rules);
  },

  deleteRule: (platform) => {
    const rules = get().rules.filter((r) => r.platform !== platform);
    set({ rules });
    setStorage(STORAGE_KEY, rules);
  },

  setActivePlatform: (platform) => set({ activePlatform: platform }),

  toggleRuleEnabled: (platform) => {
    const rules = get().rules.map((r) =>
      r.platform === platform ? { ...r, enabled: !r.enabled } : r
    );
    set({ rules });
    setStorage(STORAGE_KEY, rules);
  },

  getRuleByPlatform: (platform) => {
    return get().rules.find((r) => r.platform === platform);
  },

  addSensitiveWord: (platform, word) => {
    const rules = get().rules.map((r) => {
      if (r.platform === platform && !r.sensitiveWords.includes(word)) {
        return { ...r, sensitiveWords: [...r.sensitiveWords, word] };
      }
      return r;
    });
    set({ rules });
    setStorage(STORAGE_KEY, rules);
  },

  removeSensitiveWord: (platform, word) => {
    const rules = get().rules.map((r) => {
      if (r.platform === platform) {
        return { ...r, sensitiveWords: r.sensitiveWords.filter((w) => w !== word) };
      }
      return r;
    });
    set({ rules });
    setStorage(STORAGE_KEY, rules);
  },

  addRequiredField: (platform, field) => {
    const rules = get().rules.map((r) => {
      if (r.platform === platform && !r.requiredFields.includes(field)) {
        return { ...r, requiredFields: [...r.requiredFields, field] };
      }
      return r;
    });
    set({ rules });
    setStorage(STORAGE_KEY, rules);
  },

  removeRequiredField: (platform, field) => {
    const rules = get().rules.map((r) => {
      if (r.platform === platform) {
        return { ...r, requiredFields: r.requiredFields.filter((f) => f !== field) };
      }
      return r;
    });
    set({ rules });
    setStorage(STORAGE_KEY, rules);
  },
}));
