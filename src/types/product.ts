export interface ProductImage {
  id: string;
  url: string;
  type: 'main' | 'detail' | 'sku';
  sort: number;
  name?: string;
}

export interface ProductSpec {
  id: string;
  name: string;
  value: string;
  price?: number;
  stock?: number;
}

export interface LogisticsInfo {
  weight?: number;
  size?: string;
  shippingMethod?: string;
  shippingFee?: number;
}

export interface ImportBatch {
  id: string;
  name: string;
  importedAt: string;
  productCount: number;
  platform?: string;
}

export interface Product {
  id: string;
  title: string;
  sellingPoints: string[];
  price: number;
  originalPrice?: number;
  stock: number;
  images: ProductImage[];
  specs: ProductSpec[];
  description: string;
  logistics: LogisticsInfo;
  platform: string;
  category?: string;
  batchId: string;
  createdAt: string;
  updatedAt: string;
}
