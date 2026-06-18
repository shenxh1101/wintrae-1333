import { create } from 'zustand';
import type { Product } from '../types/product';
import { mockProducts } from '../data/mockProducts';
import { getStorage, setStorage } from '../utils/storage';
import { useIssueStore } from './issueStore';
import { useTaskStore } from './taskStore';

interface ProductState {
  products: Product[];
  selectedPlatform: string;
  searchKeyword: string;
  isLoading: boolean;
  lastImportedAt: string | null;
  setProducts: (products: Product[]) => void;
  addProduct: (product: Product) => void;
  updateProduct: (id: string, updates: Partial<Product>) => void;
  deleteProduct: (id: string) => void;
  setSelectedPlatform: (platform: string) => void;
  setSearchKeyword: (keyword: string) => void;
  setLoading: (loading: boolean) => void;
  importProducts: (products: Product[]) => void;
  clearProducts: () => void;
  getProductById: (id: string) => Product | undefined;
  setLastImportedAt: (time: string | null) => void;
}

const STORAGE_KEY = 'products';
const LAST_IMPORTED_KEY = 'last_imported_at';

const initialProducts = getStorage<Product[]>(STORAGE_KEY, mockProducts);
const initialLastImported = getStorage<string | null>(LAST_IMPORTED_KEY, null);

export const useProductStore = create<ProductState>((set, get) => ({
  products: initialProducts,
  selectedPlatform: 'all',
  searchKeyword: '',
  isLoading: false,
  lastImportedAt: initialLastImported,

  setProducts: (products) => {
    set({ products });
    setStorage(STORAGE_KEY, products);
  },

  addProduct: (product) => {
    const products = [...get().products, product];
    set({ products });
    setStorage(STORAGE_KEY, products);
  },

  updateProduct: (id, updates) => {
    const products = get().products.map((p) =>
      p.id === id ? { ...p, ...updates, updatedAt: new Date().toISOString() } : p
    );
    set({ products });
    setStorage(STORAGE_KEY, products);
  },

  deleteProduct: (id) => {
    const products = get().products.filter((p) => p.id !== id);
    set({ products });
    setStorage(STORAGE_KEY, products);
    const issueStore = useIssueStore.getState();
    const productIssues = issueStore.issues.filter((i) => i.productId === id);
    if (productIssues.length > 0) {
      const issueIds = productIssues.map((i) => i.id);
      const remainingIssues = issueStore.issues.filter((i) => i.productId !== id);
      useIssueStore.setState({ issues: remainingIssues });
      setStorage('issues', remainingIssues);
      const taskStore = useTaskStore.getState();
      const updatedAssignees = taskStore.assignees.map((a) => {
        const assignedCount = remainingIssues.filter((i) => i.assignee === a.id).length;
        return { ...a, taskCount: assignedCount };
      });
      useTaskStore.setState({ assignees: updatedAssignees });
      setStorage('assignees', updatedAssignees);
    }
  },

  setSelectedPlatform: (platform) => set({ selectedPlatform: platform }),
  setSearchKeyword: (keyword) => set({ searchKeyword: keyword }),
  setLoading: (loading) => set({ isLoading: loading }),

  importProducts: (newProducts) => {
    const products = [...get().products, ...newProducts];
    const now = new Date().toISOString();
    set({ products, lastImportedAt: now });
    setStorage(STORAGE_KEY, products);
    setStorage(LAST_IMPORTED_KEY, now);
  },

  clearProducts: () => {
    set({ products: [], lastImportedAt: null });
    setStorage(STORAGE_KEY, []);
    setStorage(LAST_IMPORTED_KEY, null);
    useIssueStore.setState({ issues: [], hasChecked: false });
    setStorage('issues', []);
    const taskStore = useTaskStore.getState();
    const clearedAssignees = taskStore.assignees.map((a) => ({ ...a, taskCount: 0 }));
    useTaskStore.setState({ assignees: clearedAssignees });
    setStorage('assignees', clearedAssignees);
  },

  getProductById: (id) => {
    return get().products.find((p) => p.id === id);
  },

  setLastImportedAt: (time) => {
    set({ lastImportedAt: time });
    setStorage(LAST_IMPORTED_KEY, time);
  },
}));
