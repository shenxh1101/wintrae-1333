export interface TitleRule {
  enabled: boolean;
  minLength: number;
  maxLength: number;
  checkDuplicate: boolean;
}

export interface SellingPointRule {
  enabled: boolean;
  minCount: number;
  maxCount: number;
  maxLengthPerPoint: number;
}

export interface ImageRule {
  enabled: boolean;
  minMainImages: number;
  maxMainImages: number;
  checkNaming: boolean;
  namingPattern?: string;
}

export interface PriceRule {
  enabled: boolean;
  minPrice: number;
  maxPrice: number;
  checkAbnormal: boolean;
  abnormalThreshold?: number;
}

export interface StockRule {
  enabled: boolean;
  minStock: number;
  checkZeroStock: boolean;
}

export interface DescriptionRule {
  enabled: boolean;
  minParagraphs: number;
  minLength: number;
}

export interface PlatformRule {
  id: string;
  platform: string;
  platformName: string;
  enabled: boolean;
  titleRule: TitleRule;
  sellingPointRule: SellingPointRule;
  imageRule: ImageRule;
  priceRule: PriceRule;
  stockRule: StockRule;
  descriptionRule: DescriptionRule;
  requiredFields: string[];
  sensitiveWords: string[];
}

export const REQUIRED_FIELD_OPTIONS = [
  { value: 'title', label: '商品标题' },
  { value: 'sellingPoints', label: '卖点' },
  { value: 'price', label: '价格' },
  { value: 'stock', label: '库存' },
  { value: 'images', label: '图片' },
  { value: 'description', label: '商品详情' },
  { value: 'specs', label: '规格' },
  { value: 'logistics', label: '物流信息' },
];
