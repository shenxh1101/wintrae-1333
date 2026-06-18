import type { Product } from '../../types/product';
import type { PlatformRule } from '../../types/rule';
import type { CheckIssue } from '../../types/issue';
import { generateId } from '../../utils/format';

export function checkTitle(product: Product, rule: PlatformRule, allProducts: Product[]): CheckIssue[] {
  const issues: CheckIssue[] = [];
  if (!rule.titleRule.enabled) return issues;

  const title = product.title;
  const titleLen = title.length;

  if (titleLen < rule.titleRule.minLength) {
    issues.push({
      id: generateId(),
      productId: product.id,
      productTitle: product.title,
      type: 'title_too_short',
      severity: 'warning',
      field: 'title',
      description: `标题字数不足，当前 ${titleLen} 字，最少需要 ${rule.titleRule.minLength} 字`,
      suggestion: `建议补充标题内容，增加关键词，使标题长度达到 ${rule.titleRule.minLength} 字以上`,
      status: 'pending',
      createdAt: new Date().toISOString(),
    });
  }

  if (titleLen > rule.titleRule.maxLength) {
    issues.push({
      id: generateId(),
      productId: product.id,
      productTitle: product.title,
      type: 'title_too_long',
      severity: 'warning',
      field: 'title',
      description: `标题字数超限，当前 ${titleLen} 字，最多允许 ${rule.titleRule.maxLength} 字`,
      suggestion: `建议精简标题，保留核心关键词，将长度控制在 ${rule.titleRule.maxLength} 字以内`,
      status: 'pending',
      createdAt: new Date().toISOString(),
    });
  }

  if (rule.titleRule.checkDuplicate) {
    const duplicateCount = allProducts.filter(
      (p) => p.id !== product.id && p.title === product.title && p.platform === product.platform
    ).length;
    if (duplicateCount > 0) {
      issues.push({
        id: generateId(),
        productId: product.id,
        productTitle: product.title,
        type: 'title_duplicate',
        severity: 'critical',
        field: 'title',
        description: `标题重复，已有 ${duplicateCount} 个商品使用相同标题`,
        suggestion: '请修改标题，确保每个商品标题唯一性，避免影响搜索排名',
        status: 'pending',
        createdAt: new Date().toISOString(),
      });
    }
  }

  const sensitiveWords = rule.sensitiveWords.filter((word) => title.includes(word));
  if (sensitiveWords.length > 0) {
    issues.push({
      id: generateId(),
      productId: product.id,
      productTitle: product.title,
      type: 'title_sensitive_word',
      severity: 'critical',
      field: 'title',
      description: `标题包含敏感词：${sensitiveWords.join('、')}`,
      suggestion: '请替换或删除标题中的敏感词，使用合规的宣传用语',
      status: 'pending',
      createdAt: new Date().toISOString(),
    });
  }

  return issues;
}

export function checkSellingPoints(product: Product, rule: PlatformRule): CheckIssue[] {
  const issues: CheckIssue[] = [];
  if (!rule.sellingPointRule.enabled) return issues;

  const points = product.sellingPoints;
  const count = points.length;

  if (count < rule.sellingPointRule.minCount) {
    issues.push({
      id: generateId(),
      productId: product.id,
      productTitle: product.title,
      type: 'selling_point_insufficient',
      severity: 'warning',
      field: 'sellingPoints',
      description: `卖点数量不足，当前 ${count} 个，最少需要 ${rule.sellingPointRule.minCount} 个`,
      suggestion: `建议补充商品卖点，至少填写 ${rule.sellingPointRule.minCount} 个核心卖点`,
      status: 'pending',
      createdAt: new Date().toISOString(),
    });
  }

  if (count > rule.sellingPointRule.maxCount) {
    issues.push({
      id: generateId(),
      productId: product.id,
      productTitle: product.title,
      type: 'selling_point_too_many',
      severity: 'info',
      field: 'sellingPoints',
      description: `卖点数量过多，当前 ${count} 个，建议不超过 ${rule.sellingPointRule.maxCount} 个`,
      suggestion: '建议精简卖点，保留最核心的产品优势',
      status: 'pending',
      createdAt: new Date().toISOString(),
    });
  }

  points.forEach((point, index) => {
    if (point.length > rule.sellingPointRule.maxLengthPerPoint) {
      issues.push({
        id: generateId(),
        productId: product.id,
        productTitle: product.title,
        type: 'selling_point_too_many',
        severity: 'info',
        field: 'sellingPoints',
        description: `第 ${index + 1} 个卖点字数过长，当前 ${point.length} 字，建议不超过 ${rule.sellingPointRule.maxLengthPerPoint} 字`,
        suggestion: '建议精简卖点描述，保持简洁有力',
        status: 'pending',
        createdAt: new Date().toISOString(),
      });
    }
  });

  return issues;
}
