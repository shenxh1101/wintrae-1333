import type { Product } from '../../types/product';
import type { PlatformRule } from '../../types/rule';
import type { CheckIssue } from '../../types/issue';
import { generateId } from '../../utils/format';

export function checkSpecs(product: Product, rule: PlatformRule): CheckIssue[] {
  const issues: CheckIssue[] = [];

  if (product.specs.length === 0) {
    return issues;
  }

  const specNames = [...new Set(product.specs.map((s) => s.name))];
  const specValuesByType: Record<string, string[]> = {};
  specNames.forEach((name) => {
    specValuesByType[name] = product.specs
      .filter((s) => s.name === name)
      .map((s) => s.value);
  });

  const hasPriceSpecs = product.specs.some((s) => s.price !== undefined);
  if (hasPriceSpecs) {
    const prices = product.specs.filter((s) => s.price !== undefined).map((s) => s.price as number);
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    if (maxPrice > minPrice * 3 && minPrice > 0) {
      issues.push({
        id: generateId(),
        productId: product.id,
        productTitle: product.title,
        type: 'spec_inconsistent',
        severity: 'warning',
        field: 'specs',
        description: `规格价格差异过大，最低价 ${minPrice} 元，最高价 ${maxPrice} 元`,
        suggestion: '请确认各规格价格设置是否合理，避免价格差异过大',
        status: 'pending',
        createdAt: new Date().toISOString(),
      });
    }
  }

  const hasStockSpecs = product.specs.some((s) => s.stock !== undefined);
  if (hasStockSpecs) {
    const zeroStockSpecs = product.specs.filter((s) => s.stock === 0);
    if (zeroStockSpecs.length > 0) {
      const specNames = zeroStockSpecs.map((s) => `${s.name}: ${s.value}`).join('、');
      issues.push({
        id: generateId(),
        productId: product.id,
        productTitle: product.title,
        type: 'stock_zero',
        severity: 'warning',
        field: 'specs',
        description: `以下规格库存为零：${specNames}`,
        suggestion: '请及时补充对应规格的库存，或下架缺货规格',
        status: 'pending',
        createdAt: new Date().toISOString(),
      });
    }
  }

  if (specNames.length < 1 && product.specs.length > 0) {
    issues.push({
      id: generateId(),
      productId: product.id,
      productTitle: product.title,
      type: 'spec_inconsistent',
      severity: 'info',
      field: 'specs',
      description: '规格分类较少，建议增加规格维度',
      suggestion: '可考虑增加颜色、尺码等多维度规格，提升用户选择空间',
      status: 'pending',
      createdAt: new Date().toISOString(),
    });
  }

  return issues;
}

export function checkDescription(product: Product, rule: PlatformRule): CheckIssue[] {
  const issues: CheckIssue[] = [];
  if (!rule.descriptionRule.enabled) return issues;

  const description = product.description;
  const descLen = description.length;

  if (descLen === 0) {
    issues.push({
      id: generateId(),
      productId: product.id,
      productTitle: product.title,
      type: 'description_too_short',
      severity: 'critical',
      field: 'description',
      description: '商品详情为空，未填写任何描述信息',
      suggestion: '请填写详细的商品描述，包括产品介绍、参数、使用说明等',
      status: 'pending',
      createdAt: new Date().toISOString(),
    });
    return issues;
  }

  if (descLen < rule.descriptionRule.minLength) {
    issues.push({
      id: generateId(),
      productId: product.id,
      productTitle: product.title,
      type: 'description_too_short',
      severity: 'warning',
      field: 'description',
      description: `详情字数不足，当前 ${descLen} 字，最少需要 ${rule.descriptionRule.minLength} 字`,
      suggestion: `建议补充商品详情内容，至少 ${rule.descriptionRule.minLength} 字，提升转化效果`,
      status: 'pending',
      createdAt: new Date().toISOString(),
    });
  }

  const paragraphs = description.split(/\n\s*\n/).filter((p) => p.trim().length > 0);
  if (paragraphs.length < rule.descriptionRule.minParagraphs) {
    issues.push({
      id: generateId(),
      productId: product.id,
      productTitle: product.title,
      type: 'description_paragraph_insufficient',
      severity: 'info',
      field: 'description',
      description: `详情段落数不足，当前 ${paragraphs.length} 段，建议至少 ${rule.descriptionRule.minParagraphs} 段`,
      suggestion: '建议将商品详情分为多个段落，层次分明，提升阅读体验',
      status: 'pending',
      createdAt: new Date().toISOString(),
    });
  }

  const sensitiveWords = rule.sensitiveWords.filter((word) => description.includes(word));
  if (sensitiveWords.length > 0) {
    issues.push({
      id: generateId(),
      productId: product.id,
      productTitle: product.title,
      type: 'sensitive_word_detected',
      severity: 'critical',
      field: 'description',
      description: `商品详情包含敏感词：${sensitiveWords.join('、')}`,
      suggestion: '请替换或删除详情中的敏感词，使用合规的宣传用语',
      status: 'pending',
      createdAt: new Date().toISOString(),
    });
  }

  return issues;
}
