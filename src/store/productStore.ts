import { create } from 'zustand';
import type { Product, ImportBatch } from '../types/product';
import { mockProducts, mockBatches } from '../data/mockProducts';
import { getStorage, setStorage } from '../utils/storage';
import { useIssueStore } from './issueStore';
import { useTaskStore } from './taskStore';
import { generateId } from '../utils/format';

interface ProductState {
  products: Product[];
  batches: ImportBatch[];
  selectedBatchId: string | 'all';
  selectedPlatform: string;
  searchKeyword: string;
  isLoading: boolean;
  lastImportedAt: string | null;
  lastCheckedAt: string | null;
  needsRecheck: boolean;
  setProducts: (products: Product[]) => void;
  addProduct: (product: Product) => void;
  updateProduct: (id: string, updates: Partial<Product>) => void;
  deleteProduct: (id: string) => void;
  setSelectedPlatform: (platform: string) => void;
  setSearchKeyword: (keyword: string) => void;
  setLoading: (loading: boolean) => void;
  importProducts: (products: Product[], batchName?: string) => string;
  clearProducts: () => void;
  getProductById: (id: string) => Product | undefined;
  setLastImportedAt: (time: string | null) => void;
  setLastCheckedAt: (time: string | null) => void;
  setSelectedBatchId: (batchId: string | 'all') => void;
  setNeedsRecheck: (needs: boolean) => void;
  getProductsByBatch: (batchId: string | 'all') => Product[];
  deleteBatch: (batchId: string) => void;
}

const STORAGE_KEY = 'products';
const BATCHES_KEY = 'import_batches';
const LAST_IMPORTED_KEY = 'last_imported_at';
const LAST_CHECKED_KEY = 'last_checked_at';
const NEEDS_RECHECK_KEY = 'needs_recheck';
const SELECTED_BATCH_KEY = 'selected_batch';

const initialProducts = getStorage<Product[]>(STORAGE_KEY, mockProducts);
const initialBatches = getStorage<ImportBatch[]>(BATCHES_KEY, mockBatches);
const initialLastImported = getStorage<string | null>(LAST_IMPORTED_KEY, null);
const initialLastChecked = getStorage<string | null>(LAST_CHECKED_KEY, null);
const initialNeedsRecheck = getStorage<boolean>(NEEDS_RECHECK_KEY, false);
const initialSelectedBatch = getStorage<string | 'all'>(SELECTED_BATCH_KEY, 'all');

export const useProductStore = create<ProductState>((set, get) => ({
  products: initialProducts,
  batches: initialBatches,
  selectedBatchId: initialSelectedBatch,
  selectedPlatform: 'all',
  searchKeyword: '',
  isLoading: false,
  lastImportedAt: initialLastImported,
  lastCheckedAt: initialLastChecked,
  needsRecheck: initialNeedsRecheck,

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

  importProducts: (newProducts, batchName) => {
    const now = new Date().toISOString();
    const batchId = generateId();
    const productsWithBatch = newProducts.map((p) => ({ ...p, batchId }));
    const products = [...get().products, ...productsWithBatch];
    const platform = newProducts.length > 0 ? newProducts[0].platform : undefined;
    const newBatch: ImportBatch = {
      id: batchId,
      name: batchName || `导入批次 ${new Date().toLocaleString('zh-CN')}`,
      importedAt: now,
      productCount: newProducts.length,
      platform,
    };
    const batches = [newBatch, ...get().batches];

    set({
      products,
      batches,
      lastImportedAt: now,
      needsRecheck: true,
      selectedBatchId: batchId,
    });
    setStorage(STORAGE_KEY, products);
    setStorage(BATCHES_KEY, batches);
    setStorage(LAST_IMPORTED_KEY, now);
    setStorage(NEEDS_RECHECK_KEY, true);
    setStorage(SELECTED_BATCH_KEY, batchId);

    return batchId;
  },

  clearProducts: () => {
    set({
      products: [],
      batches: [],
      lastImportedAt: null,
      lastCheckedAt: null,
      needsRecheck: false,
      selectedBatchId: 'all',
    });
    setStorage(STORAGE_KEY, []);
    setStorage(BATCHES_KEY, []);
    setStorage(LAST_IMPORTED_KEY, null);
    setStorage(LAST_CHECKED_KEY, null);
    setStorage(NEEDS_RECHECK_KEY, false);
    setStorage(SELECTED_BATCH_KEY, 'all');

    useIssueStore.setState({ issues: [], hasChecked: false });
    setStorage('issues', []);

    const taskStore = useTaskStore.getState();
    const clearedAssignees = taskStore.assignees.map((a) => ({ ...a, taskCount: 0 }));
    useTaskStore.setState({ assignees: clearedAssignees, tasks: [] });
    setStorage('assignees', clearedAssignees);
    setStorage('export_tasks', []);
  },

  getProductById: (id) => {
    return get().products.find((p) => p.id === id);
  },

  setLastImportedAt: (time) => {
    set({ lastImportedAt: time });
    setStorage(LAST_IMPORTED_KEY, time);
  },

  setLastCheckedAt: (time) => {
    set({ lastCheckedAt: time, needsRecheck: false });
    setStorage(LAST_CHECKED_KEY, time);
    setStorage(NEEDS_RECHECK_KEY, false);
  },

  setSelectedBatchId: (batchId) => {
    set({ selectedBatchId: batchId });
    setStorage(SELECTED_BATCH_KEY, batchId);
  },

  setNeedsRecheck: (needs) => {
    set({ needsRecheck: needs });
    setStorage(NEEDS_RECHECK_KEY, needs);
  },

  getProductsByBatch: (batchId) => {
    if (batchId === 'all') return get().products;
    return get().products.filter((p) => p.batchId === batchId);
  },

  deleteBatch: (batchId) => {
    const products = get().products.filter((p) => p.batchId !== batchId);
    const batches = get().batches.filter((b) => b.id !== batchId);
    const deletedProductIds = get()
      .products.filter((p) => p.batchId === batchId)
      .map((p) => p.id);

    set({ products, batches });
    setStorage(STORAGE_KEY, products);
    setStorage(BATCHES_KEY, batches);

    const issueStore = useIssueStore.getState();
    const remainingIssues = issueStore.issues.filter(
      (i) => !deletedProductIds.includes(i.productId)
    );
    useIssueStore.setState({ issues: remainingIssues });
    setStorage('issues', remainingIssues);

    const taskStore = useTaskStore.getState();
    const updatedAssignees = taskStore.assignees.map((a) => {
      const assignedCount = remainingIssues.filter((i) => i.assignee === a.id).length;
      return { ...a, taskCount: assignedCount };
    });
    useTaskStore.setState({ assignees: updatedAssignees });
    setStorage('assignees', updatedAssignees);
  },
}));
