export type ExportFormat = 'xlsx' | 'csv';
export type ExportScope = 'all' | 'selected' | 'by_severity' | 'by_type' | 'by_assignee' | 'custom';
export type ExportTaskStatus = 'pending' | 'generating' | 'completed' | 'failed';

export interface ExportTask {
  id: string;
  name: string;
  format: ExportFormat;
  scope: ExportScope;
  severityFilter?: string[];
  typeFilter?: string[];
  assigneeFilter?: string;
  platformFilter?: string;
  issueCount: number;
  productCount: number;
  status: ExportTaskStatus;
  downloadUrl?: string;
  createdAt: string;
  createdBy: string;
  issueSnapshots?: ExportIssueSnapshot[];
}

export interface ExportIssueSnapshot {
  productId: string;
  productTitle: string;
  issueType: string;
  severity: string;
  description: string;
  suggestion: string;
  status: string;
  assigneeName?: string;
}

export interface Assignee {
  id: string;
  name: string;
  role: string;
  avatar?: string;
  taskCount: number;
}

export interface FilterPreset {
  id: string;
  name: string;
  scope: ExportScope;
  severityFilter?: string[];
  typeFilter?: string[];
  assigneeFilter?: string;
  platformFilter?: string;
  statusFilter?: string;
  batchFilter?: string;
  isQuick?: boolean;
  createdAt: string;
}
