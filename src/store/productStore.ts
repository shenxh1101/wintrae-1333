import { create } from 'zustand';
import type { Product } from '../types/product';
import { mockProducts } from '../data/mockProducts';
import { getStorage, setStorage } from '../utils/storage';

interface ProductState {
  products: Product[];
  selectedPlatform: string;
  searchKeyword: string;
  isLoading: boolean;
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
}

const STORAGE_KEY = 'products';

const initialProducts = getStorage<Product[]>(STORAGE_KEY, mockProducts);

export const useProductStore = create<ProductState>((set, get) => ({
  products: initialProducts,
  selectedPlatform: 'all',
  searchKeyword: '',
  isLoading: false,

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
  },

  setSelectedPlatform: (platform) => set({ selectedPlatform: platform }),
  setSearchKeyword: (keyword) => set({ searchKeyword: keyword }),
  setLoading: (loading) => set({ isLoading: loading }),

  importProducts: (newProducts) => {
    const products = [...get().products, ...newProducts];
    set({ products });
    setStorage(STORAGE_KEY, products);
  },

  clearProducts: () => {
    set({ products: [] });
    setStorage(STORAGE_KEY, []);
  },

  getProductById: (id) => {
    return get().products.find((p) => p.id === id);
  },
}));
