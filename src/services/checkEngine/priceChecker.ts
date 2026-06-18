import type { Product } from '../../types/product';
import type { PlatformRule } from '../../types/rule';
import type { CheckIssue } from '../../types/issue';
import { generateId } from '../../utils/format';

export function checkPrice(product: Product, rule: PlatformRule): CheckIssue[] {
  const issues: CheckIssue[] = [];
  if (!rule.priceRule.enabled) return issues;

  const price = product.price;

  if (price <= 0) {
    issues.push({
      id: generateId(),
      productId: product.id,
      productTitle: product.title,
      type: 'price_abnormal',
      severity: 'critical',
      field: 'price',
      description: `价格异常，当前价格为 ${price} 元`,
      suggestion: '请设置正确的商品价格，价格必须大于0',
      status: 'pending',
      createdAt: new Date().toISOString(),
    });
    return issues;
  }

  if (price < rule.priceRule.minPrice) {
    issues.push({
      id: generateId(),
      productId: product.id,
      productTitle: product.title,
      type: 'price_too_low',
      severity: 'warning',
      field: 'price',
      description: `价格过低，当前 ${price} 元，最低价格为 ${rule.priceRule.minPrice} 元`,
      suggestion: '请确认价格是否正确，如促销价格请设置合理的原价',
      status: 'pending',
      createdAt: new Date().toISOString(),
    });
  }

  if (price > rule.priceRule.maxPrice) {
    issues.push({
      id: generateId(),
      productId: product.id,
      productTitle: product.title,
      type: 'price_too_high',
      severity: 'warning',
      field: 'price',
      description: `价格过高，当前 ${price} 元，最高价格为 ${rule.priceRule.maxPrice} 元`,
      suggestion: '请确认价格是否正确，避免价格设置过高影响销售',
      status: 'pending',
      createdAt: new Date().toISOString(),
    });
  }

  if (rule.priceRule.checkAbnormal && rule.priceRule.abnormalThreshold) {
    if (price > rule.priceRule.abnormalThreshold) {
      issues.push({
        id: generateId(),
        productId: product.id,
        productTitle: product.title,
        type: 'price_abnormal',
        severity: 'warning',
        field: 'price',
        description: `价格可能异常，当前 ${price} 元，超过 ${rule.priceRule.abnormalThreshold} 元阈值`,
        suggestion: '请核实商品价格是否正确，避免价格标错',
        status: 'pending',
        createdAt: new Date().toISOString(),
      });
    }
  }

  return issues;
}

export function checkStock(product: Product, rule: PlatformRule): CheckIssue[] {
  const issues: CheckIssue[] = [];
  if (!rule.stockRule.enabled) return issues;

  const stock = product.stock;

  if (stock < 0) {
    issues.push({
      id: generateId(),
      productId: product.id,
      productTitle: product.title,
      type: 'stock_insufficient',
      severity: 'critical',
      field: 'stock',
      description: `库存异常，当前库存为 ${stock}`,
      suggestion: '请修正库存数量，库存不能为负数',
      status: 'pending',
      createdAt: new Date().toISOString(),
    });
    return issues;
  }

  if (rule.stockRule.checkZeroStock && stock === 0) {
    issues.push({
      id: generateId(),
      productId: product.id,
      productTitle: product.title,
      type: 'stock_zero',
      severity: 'critical',
      field: 'stock',
      description: '库存为零，商品无法正常销售',
      suggestion: '请及时补货或设置预售，避免影响正常销售',
      status: 'pending',
      createdAt: new Date().toISOString(),
    });
  }

  if (stock > 0 && stock < rule.stockRule.minStock) {
    issues.push({
      id: generateId(),
      productId: product.id,
      productTitle: product.title,
      type: 'stock_insufficient',
      severity: 'warning',
      field: 'stock',
      description: `库存不足，当前 ${stock} 件，建议最低库存 ${rule.stockRule.minStock} 件`,
      suggestion: '库存偏低，建议及时补货，避免缺货影响销售',
      status: 'pending',
      createdAt: new Date().toISOString(),
    });
  }

  return issues;
}
