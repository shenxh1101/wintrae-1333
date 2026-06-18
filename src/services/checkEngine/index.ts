import type { Product } from '../../types/product';
import type { PlatformRule } from '../../types/rule';
import type { CheckIssue } from '../../types/issue';
import { checkTitle, checkSellingPoints } from './titleChecker';
import { checkImages } from './imageChecker';
import { checkPrice, checkStock } from './priceChecker';
import { checkSpecs, checkDescription } from './specChecker';
import { checkRequiredFields } from './requiredChecker';

export interface CheckResult {
  total: number;
  issues: CheckIssue[];
  criticalCount: number;
  warningCount: number;
  infoCount: number;
  affectedProducts: number;
}

export function runCheck(products: Product[], rules: PlatformRule[]): CheckResult {
  const allIssues: CheckIssue[] = [];
  const affectedProductIds = new Set<string>();

  products.forEach((product) => {
    const platformRule = rules.find((r) => r.platform === product.platform && r.enabled);
    if (!platformRule) return;

    const productIssues: CheckIssue[] = [];

    productIssues.push(...checkTitle(product, platformRule, products));
    productIssues.push(...checkSellingPoints(product, platformRule));
    productIssues.push(...checkImages(product, platformRule));
    productIssues.push(...checkPrice(product, platformRule));
    productIssues.push(...checkStock(product, platformRule));
    productIssues.push(...checkSpecs(product, platformRule));
    productIssues.push(...checkDescription(product, platformRule));
    productIssues.push(...checkRequiredFields(product, platformRule));

    if (productIssues.length > 0) {
      affectedProductIds.add(product.id);
      allIssues.push(...productIssues);
    }
  });

  const criticalCount = allIssues.filter((i) => i.severity === 'critical').length;
  const warningCount = allIssues.filter((i) => i.severity === 'warning').length;
  const infoCount = allIssues.filter((i) => i.severity === 'info').length;

  return {
    total: allIssues.length,
    issues: allIssues,
    criticalCount,
    warningCount,
    infoCount,
    affectedProducts: affectedProductIds.size,
  };
}

export function getIssuesByProduct(issues: CheckIssue[], productId: string): CheckIssue[] {
  return issues.filter((issue) => issue.productId === productId);
}

export function getIssuesBySeverity(issues: CheckIssue[], severity: string): CheckIssue[] {
  return issues.filter((issue) => issue.severity === severity);
}

export function getIssuesByType(issues: CheckIssue[], type: string): CheckIssue[] {
  return issues.filter((issue) => issue.type === type);
}

export function getIssueTypeStats(issues: CheckIssue[]): { type: string; count: number }[] {
  const typeMap: Record<string, number> = {};
  issues.forEach((issue) => {
    typeMap[issue.type] = (typeMap[issue.type] || 0) + 1;
  });
  return Object.entries(typeMap)
    .map(([type, count]) => ({ type, count }))
    .sort((a, b) => b.count - a.count);
}
