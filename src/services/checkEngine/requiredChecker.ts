import type { Product } from '../../types/product';
import type { PlatformRule } from '../../types/rule';
import type { CheckIssue } from '../../types/issue';
import { generateId } from '../../utils/format';

const FIELD_LABELS: Record<string, string> = {
  title: '商品标题',
  sellingPoints: '卖点',
  price: '价格',
  stock: '库存',
  images: '图片',
  description: '商品详情',
  specs: '规格',
  logistics: '物流信息',
};

export function checkRequiredFields(product: Product, rule: PlatformRule): CheckIssue[] {
  const issues: CheckIssue[] = [];

  rule.requiredFields.forEach((field) => {
    const fieldLabel = FIELD_LABELS[field] || field;
    let isMissing = false;

    switch (field) {
      case 'title':
        isMissing = !product.title || product.title.trim().length === 0;
        break;
      case 'sellingPoints':
        isMissing = !product.sellingPoints || product.sellingPoints.length === 0;
        break;
      case 'price':
        isMissing = product.price === undefined || product.price === null;
        break;
      case 'stock':
        isMissing = product.stock === undefined || product.stock === null;
        break;
      case 'images':
        isMissing = !product.images || product.images.length === 0;
        break;
      case 'description':
        isMissing = !product.description || product.description.trim().length === 0;
        break;
      case 'specs':
        isMissing = !product.specs || product.specs.length === 0;
        break;
      case 'logistics':
        isMissing = !product.logistics || Object.keys(product.logistics).length === 0;
        break;
      default:
        break;
    }

    if (isMissing) {
      issues.push({
        id: generateId(),
        productId: product.id,
        productTitle: product.title || '未命名商品',
        type: 'required_field_missing',
        severity: 'critical',
        field,
        description: `必填项缺失：${fieldLabel}`,
        suggestion: `请补充商品的${fieldLabel}信息`,
        status: 'pending',
        createdAt: new Date().toISOString(),
      });
    }
  });

  return issues;
}
