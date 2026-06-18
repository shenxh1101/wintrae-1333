import { useState } from 'react';
import {
  Wrench,
  ChevronDown,
  ChevronRight,
  User,
  Clock,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Info,
  Users,
  Send,
  ListTodo,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Modal from '@/components/ui/Modal';
import { useIssueStore } from '@/store/issueStore';
import { useTaskStore } from '@/store/taskStore';
import {
  ISSUE_TYPE_LABELS,
  SEVERITY_LABELS,
  STATUS_LABELS,
  type IssueSeverity,
  type CheckIssue,
  type IssueStatus,
} from '@/types/issue';
import { cn } from '@/lib/utils';
import { generateId, formatDate } from '@/utils/format';

const severityColors: Record<IssueSeverity, string> = {
  critical: 'bg-red-100 text-red-700 border-red-200',
  warning: 'bg-amber-100 text-amber-700 border-amber-200',
  info: 'bg-blue-100 text-blue-700 border-blue-200',
};

const severityIcons = {
  critical: AlertCircle,
  warning: AlertTriangle,
  info: Info,
};

const statusColors: Record<IssueStatus, string> = {
  pending: 'bg-gray-100 text-gray-700',
  processing: 'bg-blue-100 text-blue-700',
  resolved: 'bg-green-100 text-green-700',
};

export default function FixesPage() {
  const { issues, bulkAssignIssues, bulkUpdateStatus } = useIssueStore();
  const { assignees } = useTaskStore();
  const [expandedTypes, setExpandedTypes] = useState<Set<string>>(new Set());
  const [selectedIssues, setSelectedIssues] = useState<Set<string>>(new Set());
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedAssignee, setSelectedAssignee] = useState('');
  const [filterStatus, setFilterStatus] = useState<IssueStatus | 'all'>('all');

  const issuesByType = new Map<string, CheckIssue[]>();
  issues.forEach((issue) => {
    if (filterStatus !== 'all' && issue.status !== filterStatus) return;
    const list = issuesByType.get(issue.type) || [];
    list.push(issue);
    issuesByType.set(issue.type, list);
  });

  const typeEntries = Array.from(issuesByType.entries()).sort(
    (a, b) => b[1].length - a[1].length
  );

  const toggleType = (type: string) => {
    const newExpanded = new Set(expandedTypes);
    if (newExpanded.has(type)) {
      newExpanded.delete(type);
    } else {
      newExpanded.add(type);
    }
    setExpandedTypes(newExpanded);
  };

  const toggleIssue = (issueId: string) => {
    const newSelected = new Set(selectedIssues);
    if (newSelected.has(issueId)) {
      newSelected.delete(issueId);
    } else {
      newSelected.add(issueId);
    }
    setSelectedIssues(newSelected);
  };

  const selectAllByType = (type: string) => {
    const typeIssues = issuesByType.get(type) || [];
    const allSelected = typeIssues.every((i) => selectedIssues.has(i.id));
    const newSelected = new Set(selectedIssues);

    if (allSelected) {
      typeIssues.forEach((i) => newSelected.delete(i.id));
    } else {
      typeIssues.forEach((i) => newSelected.add(i.id));
    }
    setSelectedIssues(newSelected);
  };

  const handleBulkAssign = () => {
    if (!selectedAssignee || selectedIssues.size === 0) return;
    const assignee = assignees.find((a) => a.id === selectedAssignee);
    if (assignee) {
      bulkAssignIssues(
        Array.from(selectedIssues),
        assignee.id,
        assignee.name
      );
      setSelectedIssues(new Set());
    }
    setShowAssignModal(false);
    setSelectedAssignee('');
  };

  const handleMarkResolved = () => {
    if (selectedIssues.size === 0) return;
    bulkUpdateStatus(Array.from(selectedIssues), 'resolved');
    setSelectedIssues(new Set());
  };

  const getSeverityForType = (typeIssues: CheckIssue[]): IssueSeverity => {
    if (typeIssues.some((i) => i.severity === 'critical')) return 'critical';
    if (typeIssues.some((i) => i.severity === 'warning')) return 'warning';
    return 'info';
  };

  const stats = {
    pending: issues.filter((i) => i.status === 'pending').length,
    processing: issues.filter((i) => i.status === 'processing').length,
    resolved: issues.filter((i) => i.status === 'resolved').length,
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">批量修正建议</h1>
          <p className="text-sm text-gray-500 mt-1">
            按问题类型分组查看，批量分配处理任务
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="md"
            disabled={selectedIssues.size === 0}
            onClick={() => setShowAssignModal(true)}
          >
            <User className="w-4 h-4" />
            分配负责人
            {selectedIssues.size > 0 && (
              <Badge variant="primary" size="sm">
                {selectedIssues.size}
              </Badge>
            )}
          </Button>
          <Button
            variant="success"
            size="md"
            disabled={selectedIssues.size === 0}
            onClick={handleMarkResolved}
          >
            <CheckCircle2 className="w-4 h-4" />
            标记完成
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-5">
        <Card
          onClick={() => setFilterStatus('all')}
          hoverable
          className={cn(
            'cursor-pointer transition-all',
            filterStatus === 'all' && 'ring-2 ring-primary-500'
          )}
        >
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">全部问题</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{issues.length}</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-primary-100 flex items-center justify-center">
                <ListTodo className="w-6 h-6 text-primary-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card
          onClick={() => setFilterStatus('pending')}
          hoverable
          className={cn(
            'cursor-pointer transition-all',
            filterStatus === 'pending' && 'ring-2 ring-danger-500'
          )}
        >
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">待处理</p>
                <p className="text-2xl font-bold text-danger-600 mt-1">{stats.pending}</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-danger-100 flex items-center justify-center">
                <Clock className="w-6 h-6 text-danger-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card
          onClick={() => setFilterStatus('processing')}
          hoverable
          className={cn(
            'cursor-pointer transition-all',
            filterStatus === 'processing' && 'ring-2 ring-warning-500'
          )}
        >
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">处理中</p>
                <p className="text-2xl font-bold text-warning-600 mt-1">
                  {stats.processing}
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-warning-100 flex items-center justify-center">
                <Wrench className="w-6 h-6 text-warning-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card
          onClick={() => setFilterStatus('resolved')}
          hoverable
          className={cn(
            'cursor-pointer transition-all',
            filterStatus === 'resolved' && 'ring-2 ring-success-500'
          )}
        >
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">已完成</p>
                <p className="text-2xl font-bold text-success-600 mt-1">{stats.resolved}</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-success-100 flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6 text-success-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-4 gap-5">
        <div className="col-span-3 space-y-4">
          {typeEntries.length > 0 ? (
            typeEntries.map(([type, typeIssues]) => {
              const isExpanded = expandedTypes.has(type);
              const severity = getSeverityForType(typeIssues);
              const SeverityIcon = severityIcons[severity];
              const allSelected = typeIssues.every((i) => selectedIssues.has(i.id));
              const someSelected = typeIssues.some((i) => selectedIssues.has(i.id));

              return (
                <Card key={type}>
                  <button
                    onClick={() => toggleType(type)}
                    className="w-full p-4 flex items-center gap-4 text-left"
                  >
                    <div
                      className={cn(
                        'w-10 h-10 rounded-lg flex items-center justify-center',
                        severityColors[severity]
                      )}
                    >
                      <SeverityIcon className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <p className="font-semibold text-gray-900">
                          {ISSUE_TYPE_LABELS[type as keyof typeof ISSUE_TYPE_LABELS] ||
                            type}
                        </p>
                        <Badge variant={severity === 'critical' ? 'danger' : severity === 'warning' ? 'warning' : 'info'}>
                          {SEVERITY_LABELS[severity]}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-500 mt-0.5">
                        共 {typeIssues.length} 个问题需要处理
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <div
                        onClick={(e) => {
                          e.stopPropagation();
                          selectAllByType(type);
                        }}
                        className={cn(
                          'w-5 h-5 rounded border-2 flex items-center justify-center cursor-pointer transition-colors',
                          allSelected
                            ? 'border-primary-500 bg-primary-500'
                            : someSelected
                            ? 'border-primary-500 bg-primary-200'
                            : 'border-gray-300 hover:border-primary-400'
                        )}
                      >
                        {allSelected && (
                          <svg
                            className="w-3 h-3 text-white"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={3}
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                        )}
                        {someSelected && !allSelected && (
                          <div className="w-2 h-0.5 bg-white rounded" />
                        )}
                      </div>
                      <Badge variant="default" size="sm">
                        {typeIssues.length} 项
                      </Badge>
                      {isExpanded ? (
                        <ChevronDown className="w-5 h-5 text-gray-400" />
                      ) : (
                        <ChevronRight className="w-5 h-5 text-gray-400" />
                      )}
                    </div>
                  </button>

                  {isExpanded && (
                    <div className="px-4 pb-4">
                      <div className="border border-gray-100 rounded-xl overflow-hidden">
                        <div className="max-h-80 overflow-auto">
                          {typeIssues.map((issue, index) => {
                            const isSelected = selectedIssues.has(issue.id);
                            return (
                              <div
                                key={issue.id}
                                className={cn(
                                  'flex items-center gap-3 px-4 py-3 transition-colors',
                                  index !== 0 && 'border-t border-gray-50',
                                  isSelected && 'bg-primary-50/50',
                                  'hover:bg-gray-50'
                                )}
                              >
                                <div
                                  onClick={() => toggleIssue(issue.id)}
                                  className={cn(
                                    'w-5 h-5 rounded border-2 flex items-center justify-center cursor-pointer flex-shrink-0 transition-colors',
                                    isSelected
                                      ? 'border-primary-500 bg-primary-500'
                                      : 'border-gray-300 hover:border-primary-400'
                                  )}
                                >
                                  {isSelected && (
                                    <svg
                                      className="w-3 h-3 text-white"
                                      fill="none"
                                      viewBox="0 0 24 24"
                                      stroke="currentColor"
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={3}
                                        d="M5 13l4 4L19 7"
                                      />
                                    </svg>
                                  )}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm text-gray-900 line-clamp-1">
                                    {issue.productTitle}
                                  </p>
                                  <p className="text-xs text-gray-500 mt-0.5">
                                    {issue.description}
                                  </p>
                                </div>
                                <div className="flex items-center gap-2 flex-shrink-0">
                                  {issue.assigneeName && (
                                    <div className="flex items-center gap-1.5 text-xs text-gray-500">
                                      <User className="w-3.5 h-3.5" />
                                      {issue.assigneeName}
                                    </div>
                                  )}
                                  <Badge
                                    variant={
                                      issue.status === 'resolved'
                                        ? 'success'
                                        : issue.status === 'processing'
                                        ? 'warning'
                                        : 'default'
                                    }
                                    size="sm"
                                  >
                                    {STATUS_LABELS[issue.status]}
                                  </Badge>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  )}
                </Card>
              );
            })
          ) : (
            <Card>
              <CardContent className="py-16 text-center">
                <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                  <Wrench className="w-8 h-8 text-gray-400" />
                </div>
                <p className="text-lg font-medium text-gray-900 mb-1">暂无修正任务</p>
                <p className="text-sm text-gray-500">
                  完成商品检查后，问题将自动显示在此处
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-5">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">负责人列表</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-gray-50">
                {assignees.map((assignee) => (
                  <div
                    key={assignee.id}
                    className="px-4 py-3 flex items-center gap-3 hover:bg-gray-50 transition-colors"
                  >
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white text-sm font-medium">
                      {assignee.name.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">
                        {assignee.name}
                      </p>
                      <p className="text-xs text-gray-500">{assignee.role}</p>
                    </div>
                    <Badge variant="primary" size="sm">
                      {assignee.taskCount} 任务
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">处理进度</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between text-sm mb-1.5">
                    <span className="text-gray-600">总体进度</span>
                    <span className="font-medium text-gray-900">
                      {issues.length > 0
                        ? Math.round((stats.resolved / issues.length) * 100)
                        : 0}
                      %
                    </span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-primary-500 to-primary-600 rounded-full transition-all duration-500"
                      style={{
                        width: `${
                          issues.length > 0
                            ? (stats.resolved / issues.length) * 100
                            : 0
                        }%`,
                      }}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="p-2 bg-gray-50 rounded-lg">
                    <p className="text-lg font-bold text-gray-900">{stats.pending}</p>
                    <p className="text-xs text-gray-500">待处理</p>
                  </div>
                  <div className="p-2 bg-gray-50 rounded-lg">
                    <p className="text-lg font-bold text-warning-600">
                      {stats.processing}
                    </p>
                    <p className="text-xs text-gray-500">处理中</p>
                  </div>
                  <div className="p-2 bg-gray-50 rounded-lg">
                    <p className="text-lg font-bold text-success-600">{stats.resolved}</p>
                    <p className="text-xs text-gray-500">已完成</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">快捷操作</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" size="sm" fullWidth>
                <Users className="w-4 h-4" />
                管理负责人
              </Button>
              <Button
                variant="primary"
                size="sm"
                fullWidth
                onClick={() => setShowAssignModal(true)}
                disabled={selectedIssues.size === 0}
              >
                <Send className="w-4 h-4" />
                批量分配任务
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      <Modal
        isOpen={showAssignModal}
        onClose={() => setShowAssignModal(false)}
        title="分配负责人"
        size="sm"
        footer={
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setShowAssignModal(false)}>
              取消
            </Button>
            <Button variant="primary" onClick={handleBulkAssign}>
              确认分配
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            将为 <span className="font-medium text-gray-900">{selectedIssues.size}</span> 个问题分配负责人
          </p>
          <div className="space-y-2">
            {assignees.map((assignee) => (
              <button
                key={assignee.id}
                onClick={() => setSelectedAssignee(assignee.id)}
                className={cn(
                  'w-full p-3 rounded-xl border flex items-center gap-3 text-left transition-all',
                  selectedAssignee === assignee.id
                    ? 'border-primary-500 bg-primary-50'
                    : 'border-gray-200 hover:border-gray-300'
                )}
              >
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white font-medium">
                  {assignee.name.charAt(0)}
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{assignee.name}</p>
                  <p className="text-sm text-gray-500">{assignee.role}</p>
                </div>
                <div
                  className={cn(
                    'w-5 h-5 rounded-full border-2 flex items-center justify-center',
                    selectedAssignee === assignee.id
                      ? 'border-primary-500 bg-primary-500'
                      : 'border-gray-300'
                  )}
                >
                  {selectedAssignee === assignee.id && (
                    <svg
                      className="w-3 h-3 text-white"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={3}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>
      </Modal>
    </div>
  );
}
