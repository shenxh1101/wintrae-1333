import { useState, useEffect } from 'react';
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
  LayoutGrid,
  ListChecks,
  Lightbulb,
  KanbanSquare,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Modal from '@/components/ui/Modal';
import { useIssueStore } from '@/store/issueStore';
import { useTaskStore } from '@/store/taskStore';
import { useProductStore } from '@/store/productStore';
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

type ViewMode = 'by_type' | 'by_assignee' | 'kanban';

export default function FixesPage() {
  const {
    issues,
    bulkAssignIssues,
    bulkUpdateStatus,
    getFilteredIssues,
    updateIssueStatus,
  } = useIssueStore();
  const { assignees } = useTaskStore();
  const { products, batches, selectedBatchId, setSelectedBatchId } = useProductStore();
  const [expandedKeys, setExpandedKeys] = useState<Set<string>>(new Set());
  const [selectedIssues, setSelectedIssues] = useState<Set<string>>(new Set());
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedAssignee, setSelectedAssignee] = useState('');
  const [filterStatus, setFilterStatus] = useState<IssueStatus | 'all'>('all');
  const [viewMode, setViewMode] = useState<ViewMode>('by_type');
  const [expandedSuggestions, setExpandedSuggestions] = useState<Set<string>>(new Set());
  const [draggingIssueId, setDraggingIssueId] = useState<string | null>(null);
  const [dropTargetStatus, setDropTargetStatus] = useState<IssueStatus | null>(null);

  useEffect(() => {
    useIssueStore.getState().refreshAssigneeTaskCounts();
  }, [issues]);

  const handleBatchChange = (batchId: string | 'all') => {
    setSelectedBatchId(batchId);
  };

  const toggleSuggestion = (issueId: string) => {
    const newExpanded = new Set(expandedSuggestions);
    if (newExpanded.has(issueId)) {
      newExpanded.delete(issueId);
    } else {
      newExpanded.add(issueId);
    }
    setExpandedSuggestions(newExpanded);
  };

  const toggleExpand = (key: string) => {
    const newExpanded = new Set(expandedKeys);
    if (newExpanded.has(key)) {
      newExpanded.delete(key);
    } else {
      newExpanded.add(key);
    }
    setExpandedKeys(newExpanded);
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

  const selectAllByGroup = (groupIssues: CheckIssue[]) => {
    const allSelected = groupIssues.every((i) => selectedIssues.has(i.id));
    const newSelected = new Set(selectedIssues);

    if (allSelected) {
      groupIssues.forEach((i) => newSelected.delete(i.id));
    } else {
      groupIssues.forEach((i) => newSelected.add(i.id));
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

  const getSeverityForGroup = (groupIssues: CheckIssue[]): IssueSeverity => {
    if (groupIssues.some((i) => i.severity === 'critical')) return 'critical';
    if (groupIssues.some((i) => i.severity === 'warning')) return 'warning';
    return 'info';
  };

  const filteredIssues = getFilteredIssues();

  const stats = {
    pending: filteredIssues.filter((i) => i.status === 'pending').length,
    processing: filteredIssues.filter((i) => i.status === 'processing').length,
    resolved: filteredIssues.filter((i) => i.status === 'resolved').length,
  };

  const statusFilteredIssues = filteredIssues.filter((issue) => {
    if (filterStatus !== 'all' && issue.status !== filterStatus) return false;
    return true;
  });

  const issuesByType = new Map<string, CheckIssue[]>();
  statusFilteredIssues.forEach((issue) => {
    const list = issuesByType.get(issue.type) || [];
    list.push(issue);
    issuesByType.set(issue.type, list);
  });
  const typeEntries = Array.from(issuesByType.entries()).sort(
    (a, b) => b[1].length - a[1].length
  );

  const issuesByAssignee = new Map<string, CheckIssue[]>();
  const unassignedKey = '__unassigned__';
  statusFilteredIssues.forEach((issue) => {
    const key = issue.assignee || unassignedKey;
    const list = issuesByAssignee.get(key) || [];
    list.push(issue);
    issuesByAssignee.set(key, list);
  });
  const assigneeEntries = Array.from(issuesByAssignee.entries()).sort(
    (a, b) => b[1].length - a[1].length
  );

  const issuesByStatus: Record<IssueStatus, CheckIssue[]> = {
    pending: filteredIssues.filter((i) => i.status === 'pending'),
    processing: filteredIssues.filter((i) => i.status === 'processing'),
    resolved: filteredIssues.filter((i) => i.status === 'resolved'),
  };

  const getAssigneeName = (assigneeId: string) => {
    if (assigneeId === unassignedKey) return '未分配';
    const assignee = assignees.find((a) => a.id === assigneeId);
    return assignee?.name || '未知';
  };

  const getAssigneeInfo = (assigneeId: string) => {
    if (assigneeId === unassignedKey) return null;
    return assignees.find((a) => a.id === assigneeId) || null;
  };

  const renderKanbanCard = (issue: CheckIssue) => {
    const SeverityIcon = severityIcons[issue.severity];
    const isSuggestionExpanded = expandedSuggestions.has(issue.id);
    const isDragging = draggingIssueId === issue.id;

    return (
      <Card
        key={issue.id}
        draggable={true}
        onDragStart={(e) => {
          e.dataTransfer.setData('issueId', issue.id);
          setDraggingIssueId(issue.id);
        }}
        onDragEnd={() => setDraggingIssueId(null)}
        className={cn(
          'hover:shadow-card transition-shadow cursor-grab active:cursor-grabbing',
          isDragging && 'opacity-50'
        )}
      >
        <CardContent className="p-4 space-y-3">
          <div className="flex items-start justify-between gap-2">
            <p className="text-sm font-medium text-gray-900 line-clamp-1 flex-1 min-w-0">
              {issue.productTitle}
            </p>
            <Badge
              variant={
                issue.severity === 'critical'
                  ? 'danger'
                  : issue.severity === 'warning'
                  ? 'warning'
                  : 'info'
              }
              size="sm"
            >
              <SeverityIcon className="w-3 h-3 mr-0.5" />
              {SEVERITY_LABELS[issue.severity]}
            </Badge>
          </div>

          <p className="text-sm text-gray-600 line-clamp-2">{issue.description}</p>

          <div>
            <button
              onClick={() => toggleSuggestion(issue.id)}
              className="flex items-center gap-1 text-xs text-amber-600 hover:text-amber-700 font-medium"
            >
              <Lightbulb className="w-3.5 h-3.5" />
              修改建议
              {isSuggestionExpanded ? (
                <ChevronDown className="w-3.5 h-3.5" />
              ) : (
                <ChevronRight className="w-3.5 h-3.5" />
              )}
            </button>
            {isSuggestionExpanded && (
              <p className="mt-2 text-xs text-amber-700 bg-amber-50 p-2 rounded-lg border border-amber-100">
                {issue.suggestion}
              </p>
            )}
          </div>

          {issue.assigneeName && (
            <div className="flex items-center gap-1.5 text-xs text-gray-500">
              <div className="w-5 h-5 rounded-full bg-primary-100 flex items-center justify-center">
                <User className="w-3 h-3 text-primary-600" />
              </div>
              {issue.assigneeName}
            </div>
          )}

          <div className="flex items-center gap-1 p-1 bg-gray-100 rounded-lg">
            {(['pending', 'processing', 'resolved'] as const).map((status) => (
              <button
                key={status}
                onClick={() => updateIssueStatus(issue.id, status)}
                className={cn(
                  'flex-1 px-2 py-1 rounded-md text-xs font-medium transition-all',
                  issue.status === status
                    ? status === 'pending'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : status === 'processing'
                      ? 'bg-white text-blue-700 shadow-sm'
                      : 'bg-white text-green-700 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                )}
              >
                {STATUS_LABELS[status]}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderKanbanColumn = (
    status: IssueStatus,
    title: string,
    icon: React.ReactNode,
    colorClass: string
  ) => {
    const isDropTarget = dropTargetStatus === status;

    return (
      <Card
        key={status}
        className={cn(
          'transition-all',
          isDropTarget && 'ring-2 ring-primary-500 bg-primary-50/30'
        )}
      >
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className={cn('w-7 h-7 rounded-lg flex items-center justify-center', colorClass)}>
                {icon}
              </div>
              <CardTitle className="text-base">{title}</CardTitle>
            </div>
            <Badge variant="default" size="sm">
              {issuesByStatus[status].length}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div
            className={cn(
              'space-y-3 max-h-[600px] overflow-auto pr-1 min-h-[200px] rounded-lg transition-colors',
              isDropTarget && 'bg-primary-50/50'
            )}
            onDragOver={(e) => {
              e.preventDefault();
              setDropTargetStatus(status);
            }}
            onDragLeave={() => setDropTargetStatus(null)}
            onDrop={(e) => {
              e.preventDefault();
              const issueId = e.dataTransfer.getData('issueId');
              if (issueId) {
                updateIssueStatus(issueId, status);
              }
              setDropTargetStatus(null);
              setDraggingIssueId(null);
            }}
          >
            {issuesByStatus[status].length > 0 ? (
              issuesByStatus[status].map((issue) => renderKanbanCard(issue))
            ) : (
              <div className="py-8 text-center">
                <div className="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center mx-auto mb-2">
                  <ListChecks className="w-6 h-6 text-gray-300" />
                </div>
                <p className="text-sm text-gray-400">暂无问题</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderKanbanView = () => {
    return (
      <div className="grid grid-cols-3 gap-4">
        {renderKanbanColumn('pending', '待处理', <Clock className="w-4 h-4" />, 'bg-gray-100 text-gray-700')}
        {renderKanbanColumn('processing', '处理中', <Wrench className="w-4 h-4" />, 'bg-blue-100 text-blue-700')}
        {renderKanbanColumn('resolved', '已完成', <CheckCircle2 className="w-4 h-4" />, 'bg-green-100 text-green-700')}
      </div>
    );
  };

  const renderIssueItem = (issue: CheckIssue, index: number) => {
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
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-xs text-gray-500">{issue.description}</span>
          </div>
          <div className="flex items-start gap-2 mt-1.5">
            <div className="w-4 h-4 rounded bg-amber-100 flex items-center justify-center flex-shrink-0 mt-0.5">
              <Lightbulb className="w-3 h-3 text-amber-600" />
            </div>
            <p className="text-xs text-amber-700 line-clamp-2">{issue.suggestion}</p>
          </div>
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
  };

  const renderGroupCard = (
    groupKey: string,
    groupTitle: string,
    groupSubtitle: string,
    groupIssues: CheckIssue[],
    headerIcon?: React.ReactNode
  ) => {
    const isExpanded = expandedKeys.has(groupKey);
    const severity = getSeverityForGroup(groupIssues);
    const SeverityIcon = severityIcons[severity];
    const allSelected = groupIssues.every((i) => selectedIssues.has(i.id));
    const someSelected = groupIssues.some((i) => selectedIssues.has(i.id));

    const groupStats = {
      pending: groupIssues.filter((i) => i.status === 'pending').length,
      processing: groupIssues.filter((i) => i.status === 'processing').length,
      resolved: groupIssues.filter((i) => i.status === 'resolved').length,
    };

    const progressPercent = groupIssues.length > 0
      ? Math.round((groupStats.resolved / groupIssues.length) * 100)
      : 0;

    return (
      <Card key={groupKey}>
        <button
          onClick={() => toggleExpand(groupKey)}
          className="w-full p-4 flex items-center gap-4 text-left"
        >
          {headerIcon || (
            <div
              className={cn(
                'w-10 h-10 rounded-lg flex items-center justify-center',
                severityColors[severity]
              )}
            >
              <SeverityIcon className="w-5 h-5" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3">
              <p className="font-semibold text-gray-900 line-clamp-1">{groupTitle}</p>
              <Badge
                variant={
                  severity === 'critical'
                    ? 'danger'
                    : severity === 'warning'
                    ? 'warning'
                    : 'info'
                }
              >
                {SEVERITY_LABELS[severity]}
              </Badge>
            </div>
            <p className="text-sm text-gray-500 mt-0.5">{groupSubtitle}</p>
            <div className="flex items-center gap-4 mt-2">
              <div className="flex items-center gap-1.5 text-xs text-gray-500">
                <Clock className="w-3.5 h-3.5" />
                待处理 <span className="font-medium text-gray-700">{groupStats.pending}</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-gray-500">
                <Wrench className="w-3.5 h-3.5" />
                处理中 <span className="font-medium text-warning-600">{groupStats.processing}</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-gray-500">
                <CheckCircle2 className="w-3.5 h-3.5" />
                已完成 <span className="font-medium text-success-600">{groupStats.resolved}</span>
              </div>
            </div>
            {groupIssues.length > 0 && (
              <div className="mt-2">
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-gray-500">完成进度</span>
                  <span className="font-medium text-gray-700">{progressPercent}%</span>
                </div>
                <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-success-400 to-success-600 rounded-full transition-all duration-500"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>
            )}
          </div>
          <div className="flex items-center gap-3">
            <div
              onClick={(e) => {
                e.stopPropagation();
                selectAllByGroup(groupIssues);
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
              {groupIssues.length} 项
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
              <div className="max-h-96 overflow-auto">
                {groupIssues.map((issue, index) => renderIssueItem(issue, index))}
              </div>
            </div>
          </div>
        )}
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">批量修正建议</h1>
          <p className="text-sm text-gray-500 mt-1">
            按问题类型、负责人分组或看板视图查看，批量分配处理任务
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">批次：</span>
            <select
              value={selectedBatchId}
              onChange={(e) => handleBatchChange(e.target.value as string | 'all')}
              className="h-9 px-3 rounded-lg border border-gray-300 text-sm bg-white focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 focus:outline-none"
            >
              <option value="all">全部批次</option>
              {batches.map((batch) => (
                <option key={batch.id} value={batch.id}>
                  {batch.name} ({batch.productCount}个商品)
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-1 p-1 bg-gray-100 rounded-lg">
            <button
              onClick={() => setViewMode('by_type')}
              className={cn(
                'px-3 py-1.5 rounded-md text-sm font-medium transition-all flex items-center gap-1.5',
                viewMode === 'by_type'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              )}
            >
              <LayoutGrid className="w-4 h-4" />
              按问题类型
            </button>
            <button
              onClick={() => setViewMode('by_assignee')}
              className={cn(
                'px-3 py-1.5 rounded-md text-sm font-medium transition-all flex items-center gap-1.5',
                viewMode === 'by_assignee'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              )}
            >
              <Users className="w-4 h-4" />
              按负责人
            </button>
            <button
              onClick={() => setViewMode('kanban')}
              className={cn(
                'px-3 py-1.5 rounded-md text-sm font-medium transition-all flex items-center gap-1.5',
                viewMode === 'kanban'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              )}
            >
              <KanbanSquare className="w-4 h-4" />
              看板视图
            </button>
          </div>
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
                <p className="text-2xl font-bold text-gray-900 mt-1">{filteredIssues.length}</p>
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

      {viewMode === 'kanban' ? (
        renderKanbanView()
      ) : (
        <div className="grid grid-cols-4 gap-5">
          <div className="col-span-3 space-y-4">
            {viewMode === 'by_type' ? (
              typeEntries.length > 0 ? (
                typeEntries.map(([type, typeIssues]) =>
                  renderGroupCard(
                    `type_${type}`,
                    ISSUE_TYPE_LABELS[type as keyof typeof ISSUE_TYPE_LABELS] || type,
                    `共 ${typeIssues.length} 个问题需要处理`,
                    typeIssues
                  )
                )
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
              )
            ) : assigneeEntries.length > 0 ? (
              assigneeEntries.map(([assigneeId, assigneeIssues]) => {
                const assigneeInfo = getAssigneeInfo(assigneeId);
                const headerIcon = assigneeInfo ? (
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white font-medium">
                    {assigneeInfo.name.charAt(0)}
                  </div>
                ) : (
                  <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                    <User className="w-5 h-5 text-gray-500" />
                  </div>
                );

                return renderGroupCard(
                  `assignee_${assigneeId}`,
                  getAssigneeName(assigneeId),
                  assigneeInfo
                    ? `${assigneeInfo.role} · 共 ${assigneeIssues.length} 个问题`
                    : `共 ${assigneeIssues.length} 个问题待分配`,
                  assigneeIssues,
                  headerIcon
                );
              })
            ) : (
              <Card>
                <CardContent className="py-16 text-center">
                  <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                    <Users className="w-8 h-8 text-gray-400" />
                  </div>
                  <p className="text-lg font-medium text-gray-900 mb-1">暂无负责人数据</p>
                  <p className="text-sm text-gray-500">
                    分配问题后，可在此处按负责人查看待办
                  </p>
                </CardContent>
              </Card>
            )}
          </div>

          <div className="space-y-5">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">负责人工作量</CardTitle>
                <CardDescription>按未完成任务排序</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-gray-50">
                  {assignees
                    .slice()
                    .sort((a, b) => b.taskCount - a.taskCount)
                    .map((assignee) => {
                      const personalIssues = filteredIssues.filter(
                        (i) => i.assignee === assignee.id
                      );
                      const completed = personalIssues.filter(
                        (i) => i.status === 'resolved'
                      ).length;
                      const total = personalIssues.length;
                      const percent = total > 0 ? Math.round((completed / total) * 100) : 0;

                      return (
                        <div
                          key={assignee.id}
                          className={cn(
                            'px-4 py-3 transition-colors cursor-pointer',
                            viewMode === 'by_assignee' &&
                              expandedKeys.has(`assignee_${assignee.id}`) &&
                              'bg-primary-50/50'
                          )}
                          onClick={() => {
                            setViewMode('by_assignee');
                            const newExpanded = new Set(expandedKeys);
                            if (newExpanded.has(`assignee_${assignee.id}`)) {
                              newExpanded.delete(`assignee_${assignee.id}`);
                            } else {
                              newExpanded.add(`assignee_${assignee.id}`);
                            }
                            setExpandedKeys(newExpanded);
                          }}
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white text-sm font-medium">
                              {assignee.name.charAt(0)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between">
                                <p className="text-sm font-medium text-gray-900">
                                  {assignee.name}
                                </p>
                                <Badge
                                  variant={
                                    assignee.taskCount > 5
                                      ? 'danger'
                                      : assignee.taskCount > 2
                                      ? 'warning'
                                      : 'primary'
                                  }
                                  size="sm"
                                >
                                  {assignee.taskCount} 待办
                                </Badge>
                              </div>
                              <p className="text-xs text-gray-500 mt-0.5">{assignee.role}</p>
                              {total > 0 && (
                                <div className="mt-2">
                                  <div className="flex items-center justify-between text-xs mb-1">
                                    <span className="text-gray-500">完成率</span>
                                    <span className="font-medium text-gray-700">{percent}%</span>
                                  </div>
                                  <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                    <div
                                      className="h-full bg-gradient-to-r from-success-400 to-success-600 rounded-full"
                                      style={{ width: `${percent}%` }}
                                    />
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">总体处理进度</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between text-sm mb-1.5">
                      <span className="text-gray-600">总体进度</span>
                      <span className="font-medium text-gray-900">
                        {filteredIssues.length > 0
                          ? Math.round((stats.resolved / filteredIssues.length) * 100)
                          : 0}
                        %
                      </span>
                    </div>
                    <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-primary-500 to-primary-600 rounded-full transition-all duration-500"
                        style={{
                          width: `${
                            filteredIssues.length > 0
                              ? (stats.resolved / filteredIssues.length) * 100
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
                <Button
                  variant="primary"
                  size="sm"
                  fullWidth
                  onClick={() => setShowAssignModal(true)}
                  disabled={selectedIssues.size === 0}
                >
                  <Send className="w-4 h-4" />
                  批量分配任务
                  {selectedIssues.size > 0 && ` (${selectedIssues.size})`}
                </Button>
                <Button
                  variant="success"
                  size="sm"
                  fullWidth
                  onClick={handleMarkResolved}
                  disabled={selectedIssues.size === 0}
                >
                  <CheckCircle2 className="w-4 h-4" />
                  批量标记完成
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  fullWidth
                  onClick={() => setSelectedIssues(new Set())}
                  disabled={selectedIssues.size === 0}
                >
                  清除选择
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      <Modal
        isOpen={showAssignModal}
        onClose={() => setShowAssignModal(false)}
        title="批量分配负责人"
        size="sm"
        footer={
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setShowAssignModal(false)}>
              取消
            </Button>
            <Button
              variant="primary"
              onClick={handleBulkAssign}
              disabled={!selectedAssignee}
            >
              确认分配
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            将为{' '}
            <span className="font-medium text-gray-900">{selectedIssues.size}</span>{' '}
            个问题分配负责人，分配后状态自动变为「处理中」
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
                  <div className="flex items-center justify-between">
                    <p className="font-medium text-gray-900">{assignee.name}</p>
                    <Badge
                      variant={
                        assignee.taskCount > 5
                          ? 'danger'
                          : assignee.taskCount > 2
                          ? 'warning'
                          : 'primary'
                      }
                      size="sm"
                    >
                      {assignee.taskCount} 待办
                    </Badge>
                  </div>
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
