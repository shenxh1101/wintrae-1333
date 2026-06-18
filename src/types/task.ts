export type ExportFormat = 'xlsx' | 'csv';
export type ExportScope = 'all' | 'selected' | 'by_severity' | 'by_type' | 'by_assignee';
export type ExportTaskStatus = 'pending' | 'generating' | 'completed' | 'failed';

export interface ExportTask {
  id: string;
  name: string;
  format: ExportFormat;
  scope: ExportScope;
  severityFilter?: string[];
  typeFilter?: string[];
  assigneeFilter?: string;
  issueCount: number;
  productCount: number;
  status: ExportTaskStatus;
  downloadUrl?: string;
  createdAt: string;
  createdBy: string;
}

export interface Assignee {
  id: string;
  name: string;
  role: string;
  avatar?: string;
  taskCount: number;
}
