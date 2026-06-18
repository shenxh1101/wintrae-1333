import type { Product } from '../../types/product';
import type { PlatformRule } from '../../types/rule';
import type { CheckIssue } from '../../types/issue';
import { generateId } from '../../utils/format';

export function checkImages(product: Product, rule: PlatformRule): CheckIssue[] {
  const issues: CheckIssue[] = [];
  if (!rule.imageRule.enabled) return issues;

  const mainImages = product.images.filter((img) => img.type === 'main');
  const mainCount = mainImages.length;

  if (mainCount === 0 && product.images.length === 0) {
    issues.push({
      id: generateId(),
      productId: product.id,
      productTitle: product.title,
      type: 'image_missing',
      severity: 'critical',
      field: 'images',
      description: '商品图片缺失，没有上传任何图片',
      suggestion: '请上传商品主图和详情图，至少满足平台主图数量要求',
      status: 'pending',
      createdAt: new Date().toISOString(),
    });
  }

  if (mainCount < rule.imageRule.minMainImages) {
    issues.push({
      id: generateId(),
      productId: product.id,
      productTitle: product.title,
      type: 'main_image_insufficient',
      severity: 'critical',
      field: 'images',
      description: `主图数量不足，当前 ${mainCount} 张，最少需要 ${rule.imageRule.minMainImages} 张`,
      suggestion: `请补充主图，至少上传 ${rule.imageRule.minMainImages} 张主图`,
      status: 'pending',
      createdAt: new Date().toISOString(),
    });
  }

  if (mainCount > rule.imageRule.maxMainImages) {
    issues.push({
      id: generateId(),
      productId: product.id,
      productTitle: product.title,
      type: 'main_image_exceed',
      severity: 'info',
      field: 'images',
      description: `主图数量过多，当前 ${mainCount} 张，建议不超过 ${rule.imageRule.maxMainImages} 张`,
      suggestion: '建议精简主图数量，保留最有吸引力的图片',
      status: 'pending',
      createdAt: new Date().toISOString(),
    });
  }

  if (rule.imageRule.checkNaming && rule.imageRule.namingPattern) {
    const pattern = new RegExp(rule.imageRule.namingPattern);
    const invalidNames = product.images
      .filter((img) => img.name && !pattern.test(img.name))
      .map((img) => img.name);
    if (invalidNames.length > 0) {
      issues.push({
        id: generateId(),
        productId: product.id,
        productTitle: product.title,
        type: 'image_missing',
        severity: 'warning',
        field: 'images',
        description: `图片命名不规范：${invalidNames.join('、')}`,
        suggestion: '请按照命名规范重命名图片文件',
        status: 'pending',
        createdAt: new Date().toISOString(),
      });
    }
  }

  return issues;
}
