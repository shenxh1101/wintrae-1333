import type { Assignee, ExportTask } from '../types/task';
import { generateId } from '../utils/format';

const now = new Date();
const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);

export const mockAssignees: Assignee[] = [
  {
    id: generateId(),
    name: '张三',
    role: '商品专员',
    taskCount: 12,
  },
  {
    id: generateId(),
    name: '李四',
    role: '运营主管',
    taskCount: 8,
  },
  {
    id: generateId(),
    name: '王五',
    role: '商品专员',
    taskCount: 15,
  },
  {
    id: generateId(),
    name: '赵六',
    role: '内容编辑',
    taskCount: 6,
  },
];

export const mockExportTasks: ExportTask[] = [
  {
    id: generateId(),
    name: '6月商品上架资料检查任务',
    format: 'xlsx',
    scope: 'all',
    issueCount: 45,
    productCount: 20,
    status: 'completed',
    downloadUrl: '#',
    createdAt: yesterday.toISOString(),
    createdBy: '系统管理员',
  },
  {
    id: generateId(),
    name: '严重问题清单-张三',
    format: 'xlsx',
    scope: 'by_severity',
    severityFilter: ['critical'],
    assigneeFilter: '张三',
    issueCount: 12,
    productCount: 8,
    status: 'completed',
    downloadUrl: '#',
    createdAt: twoDaysAgo.toISOString(),
    createdBy: '运营主管',
  },
  {
    id: generateId(),
    name: '淘宝平台图片问题修复',
    format: 'csv',
    scope: 'by_type',
    typeFilter: ['image_missing', 'main_image_insufficient'],
    issueCount: 23,
    productCount: 15,
    status: 'pending',
    createdAt: now.toISOString(),
    createdBy: '系统管理员',
  },
];
