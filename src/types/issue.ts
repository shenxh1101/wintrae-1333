export type IssueSeverity = 'critical' | 'warning' | 'info';

export type IssueType =
  | 'title_too_short'
  | 'title_too_long'
  | 'title_duplicate'
  | 'title_sensitive_word'
  | 'selling_point_insufficient'
  | 'selling_point_too_many'
  | 'image_missing'
  | 'main_image_insufficient'
  | 'main_image_exceed'
  | 'price_too_low'
  | 'price_too_high'
  | 'price_abnormal'
  | 'stock_zero'
  | 'stock_insufficient'
  | 'spec_inconsistent'
  | 'description_too_short'
  | 'description_paragraph_insufficient'
  | 'required_field_missing'
  | 'sensitive_word_detected';

export type IssueStatus = 'pending' | 'processing' | 'resolved';

export interface CheckIssue {
  id: string;
  productId: string;
  productTitle: string;
  type: IssueType;
  severity: IssueSeverity;
  field: string;
  description: string;
  suggestion: string;
  status: IssueStatus;
  assignee?: string;
  assigneeName?: string;
  createdAt: string;
}

export const ISSUE_TYPE_LABELS: Record<IssueType, string> = {
  title_too_short: '标题字数不足',
  title_too_long: '标题字数超限',
  title_duplicate: '标题重复',
  title_sensitive_word: '标题含敏感词',
  selling_point_insufficient: '卖点数量不足',
  selling_point_too_many: '卖点数量过多',
  image_missing: '图片缺失',
  main_image_insufficient: '主图数量不足',
  main_image_exceed: '主图数量过多',
  price_too_low: '价格过低',
  price_too_high: '价格过高',
  price_abnormal: '价格异常',
  stock_zero: '库存为零',
  stock_insufficient: '库存不足',
  spec_inconsistent: '规格不一致',
  description_too_short: '详情字数不足',
  description_paragraph_insufficient: '详情段落不足',
  required_field_missing: '必填项缺失',
  sensitive_word_detected: '检测到敏感词',
};

export const SEVERITY_LABELS: Record<IssueSeverity, string> = {
  critical: '严重',
  warning: '警告',
  info: '提示',
};

export const STATUS_LABELS: Record<IssueStatus, string> = {
  pending: '待处理',
  processing: '处理中',
  resolved: '已完成',
};
