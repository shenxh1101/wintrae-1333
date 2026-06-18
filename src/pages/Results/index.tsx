import React, { useState, useEffect } from 'react';
import {
  ListChecks,
  Search,
  Filter,
  ChevronDown,
  ChevronRight,
  X,
  AlertTriangle,
  Info,
  AlertCircle,
  Play,
  Download,
  User,
  Clock,
  Lightbulb,
  CheckCircle2,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Modal from '@/components/ui/Modal';
import { useIssueStore } from '@/store/issueStore';
import { useProductStore } from '@/store/productStore';
import { useRuleStore } from '@/store/ruleStore';
import { useTaskStore } from '@/store/taskStore';
import { runCheck } from '@/services/checkEngine';
import {
  ISSUE_TYPE_LABELS,
  SEVERITY_LABELS,
  STATUS_LABELS,
  type IssueSeverity,
  type CheckIssue,
  type IssueStatus,
} from '@/types/issue';
import { cn } from '@/lib/utils';
import { formatDate } from '@/utils/format';

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

export default function ResultsPage() {
  const {
    issues,
    selectedSeverity,
    setSelectedSeverity,
    selectedTypes,
    setSelectedTypes,
    searchKeyword,
    setSearchKeyword,
    selectedIssueId,
    setSelectedIssueId,
    hasChecked,
    setIssues,
    setHasChecked,
    getFilteredIssues,
    updateIssueStatus,
    assignIssue,
    getIssuesByProduct,
    bulkUpdateStatus,
  } = useIssueStore();
  const { products, lastImportedAt } = useProductStore();
  const { rules } = useRuleStore();
  const { assignees } = useTaskStore();
  const [isChecking, setIsChecking] = useState(false);
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedAssigneeId, setSelectedAssigneeId] = useState('');
  const [assigningIssueId, setAssigningIssueId] = useState<string | null>(null);

  useEffect(() => {
    if (!hasChecked && products.length > 0) {
      handleRunCheck();
    }
  }, []);

  useEffect(() => {
    if (hasChecked && lastImportedAt) {
      const issuesLatest = issues.length > 0 ? issues[0]?.createdAt : null;
      if (!issuesLatest || new Date(lastImportedAt) > new Date(issuesLatest)) {
      }
    }
  }, [lastImportedAt]);

  const filteredIssues = getFilteredIssues();

  const productIssueMap = new Map<string, CheckIssue[]>();
  filteredIssues.forEach((issue) => {
    const list = productIssueMap.get(issue.productId) || [];
    list.push(issue);
    productIssueMap.set(issue.productId, list);
  });

  const productEntries = Array.from(productIssueMap.entries());

  const handleRunCheck = () => {
    setIsChecking(true);
    setTimeout(() => {
      const result = runCheck(products, rules);
      setIssues(result.issues);
      setHasChecked(true);
      setIsChecking(false);
    }, 800);
  };

  const handleMarkResolved = (issueId: string) => {
    updateIssueStatus(issueId, 'resolved');
  };

  const handleOpenAssignModal = (issueId: string) => {
    setAssigningIssueId(issueId);
    setSelectedAssigneeId('');
    setShowAssignModal(true);
  };

  const handleConfirmAssign = () => {
    if (!assigningIssueId || !selectedAssigneeId) return;
    const assignee = assignees.find((a) => a.id === selectedAssigneeId);
    if (assignee) {
      assignIssue(assigningIssueId, assignee.id, assignee.name);
    }
    setShowAssignModal(false);
    setAssigningIssueId(null);
    setSelectedAssigneeId('');
  };

  const handleResolveAllForProduct = (productId: string) => {
    const productIssues = getIssuesByProduct(productId);
    const issueIds = productIssues.map((i) => i.id);
    if (issueIds.length > 0) {
      bulkUpdateStatus(issueIds, 'resolved');
    }
  };

  const selectedIssue = issues.find((i) => i.id === selectedIssueId);
  const selectedProduct = selectedProductId
    ? products.find((p) => p.id === selectedProductId)
    : null;
  const selectedProductIssues = selectedProductId
    ? productIssueMap.get(selectedProductId) || []
    : [];

  const issueTypes = [...new Set(issues.map((i) => i.type))];

  const getSeverityForProduct = (productIssues: CheckIssue[]): IssueSeverity => {
    if (productIssues.some((i) => i.severity === 'critical')) return 'critical';
    if (productIssues.some((i) => i.severity === 'warning')) return 'warning';
    return 'info';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">检查结果</h1>
          <p className="text-sm text-gray-500 mt-1">
            共发现 {issues.length} 个问题，涉及 {productIssueMap.size} 个商品
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="md" onClick={() => {}}>
            <Download className="w-4 h-4" />
            导出报告
          </Button>
          <Button
            variant="primary"
            size="md"
            onClick={handleRunCheck}
            loading={isChecking}
          >
            <Play className="w-4 h-4" />
            {hasChecked ? '重新检查' : '开始检查'}
          </Button>
        </div>
      </div>

      <div className="flex gap-5">
        <div className="flex-1 space-y-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="搜索商品、问题描述..."
                    value={searchKeyword}
                    onChange={(e) => setSearchKeyword(e.target.value)}
                    className="w-full h-10 pl-10 pr-4 rounded-lg border border-gray-200 bg-gray-50/50 text-sm focus:bg-white focus:border-primary-300 focus:ring-2 focus:ring-primary-500/20 focus:outline-none transition-all"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-500">严重程度：</span>
                  <div className="flex items-center gap-1">
                    {(['all', 'critical', 'warning', 'info'] as const).map((s) => (
                      <button
                        key={s}
                        onClick={() => setSelectedSeverity(s)}
                        className={cn(
                          'px-3 py-1.5 text-sm rounded-lg transition-colors',
                          selectedSeverity === s
                            ? 'bg-primary-100 text-primary-700 font-medium'
                            : 'text-gray-600 hover:bg-gray-100'
                        )}
                      >
                        {s === 'all' ? '全部' : SEVERITY_LABELS[s]}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="relative">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowFilterDropdown(!showFilterDropdown)}
                  >
                    <Filter className="w-4 h-4" />
                    问题类型
                    <ChevronDown className="w-4 h-4" />
                  </Button>
                  {showFilterDropdown && (
                    <div className="absolute top-full right-0 mt-2 w-64 bg-white rounded-xl shadow-card-lg border border-gray-100 z-10 overflow-hidden">
                      <div className="p-2 max-h-72 overflow-auto">
                        {issueTypes.length === 0 ? (
                          <p className="text-sm text-gray-400 text-center py-4">
                            暂无数据
                          </p>
                        ) : (
                          issueTypes.map((type) => {
                            const isSelected = selectedTypes.includes(type);
                            return (
                              <button
                                key={type}
                                onClick={() => {
                                  if (isSelected) {
                                    setSelectedTypes(
                                      selectedTypes.filter((t) => t !== type)
                                    );
                                  } else {
                                    setSelectedTypes([...selectedTypes, type]);
                                  }
                                }}
                                className={cn(
                                  'w-full flex items-center gap-2 px-3 py-2 text-left text-sm rounded-lg transition-colors',
                                  isSelected
                                    ? 'bg-primary-50 text-primary-700'
                                    : 'hover:bg-gray-50 text-gray-700'
                                )}
                              >
                                <div
                                  className={cn(
                                    'w-4 h-4 rounded border-2 flex items-center justify-center',
                                    isSelected
                                      ? 'border-primary-500 bg-primary-500'
                                      : 'border-gray-300'
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
                                {ISSUE_TYPE_LABELS[type as keyof typeof ISSUE_TYPE_LABELS] ||
                                  type}
                              </button>
                            );
                          })
                        )}
                      </div>
                      {selectedTypes.length > 0 && (
                        <div className="p-2 border-t border-gray-100">
                          <button
                            onClick={() => setSelectedTypes([])}
                            className="w-full py-1.5 text-sm text-gray-500 hover:text-gray-700"
                          >
                            清除筛选
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <div className="divide-y divide-gray-100">
              {productEntries.length > 0 ? (
                productEntries.map(([productId, productIssues]) => {
                  const product = products.find((p) => p.id === productId);
                  const severity = getSeverityForProduct(productIssues);
                  const SeverityIcon = severityIcons[severity];
                  const isSelected = selectedProductId === productId;

                  return (
                    <div key={productId}>
                      <button
                        onClick={() =>
                          setSelectedProductId(isSelected ? null : productId)
                        }
                        className={cn(
                          'w-full p-4 flex items-center gap-4 text-left transition-colors',
                          isSelected ? 'bg-primary-50/50' : 'hover:bg-gray-50'
                        )}
                      >
                        <div
                          className={cn(
                            'w-10 h-10 rounded-lg flex items-center justify-center',
                            severityColors[severity]
                          )}
                        >
                          <SeverityIcon className="w-5 h-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 line-clamp-1">
                            {product?.title || '未知商品'}
                          </p>
                          <div className="flex items-center gap-3 mt-1">
                            <span className="text-xs text-gray-500">
                              {product?.platform?.toUpperCase()}
                            </span>
                            <span className="text-xs text-gray-500">
                              ¥{product?.price.toFixed(2)}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <Badge variant={severity === 'critical' ? 'danger' : severity === 'warning' ? 'warning' : 'info'}>
                            {productIssues.length} 个问题
                          </Badge>
                          {isSelected ? (
                            <ChevronDown className="w-5 h-5 text-gray-400" />
                          ) : (
                            <ChevronRight className="w-5 h-5 text-gray-400" />
                          )}
                        </div>
                      </button>

                      {isSelected && (
                        <div className="px-4 pb-4 pl-20">
                          <div className="space-y-2">
                            {productIssues.map((issue) => (
                              <div
                                key={issue.id}
                                onClick={() => setSelectedIssueId(issue.id)}
                                className={cn(
                                  'p-3 rounded-lg border cursor-pointer transition-all',
                                  selectedIssueId === issue.id
                                    ? 'border-primary-300 bg-primary-50'
                                    : 'border-gray-100 hover:border-gray-200 bg-white'
                                )}
                              >
                                <div className="flex items-start gap-3">
                                  <div
                                    className={cn(
                                      'w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0 mt-0.5',
                                      severityColors[issue.severity]
                                    )}
                                  >
                                    {React.createElement(
                                      severityIcons[issue.severity],
                                      { className: 'w-4 h-4' }
                                    )}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                      <p className="font-medium text-gray-900 text-sm">
                                        {ISSUE_TYPE_LABELS[
                                          issue.type as keyof typeof ISSUE_TYPE_LABELS
                                        ] || issue.type}
                                      </p>
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
                                    <p className="text-sm text-gray-600 mt-1">
                                      {issue.description}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              ) : (
                <div className="py-16 text-center">
                  <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                    <ListChecks className="w-8 h-8 text-gray-400" />
                  </div>
                  <p className="text-lg font-medium text-gray-900 mb-1">
                    {hasChecked ? '未发现问题' : '暂无检查结果'}
                  </p>
                  <p className="text-sm text-gray-500 mb-6">
                    {hasChecked
                      ? '所有商品资料均符合规范要求'
                      : '导入商品数据后点击开始检查'}
                  </p>
                  <Button variant="primary" onClick={handleRunCheck} loading={isChecking}>
                    <Play className="w-4 h-4" />
                    开始检查
                  </Button>
                </div>
              )}
            </div>
          </Card>
        </div>

        <div className="w-96 flex-shrink-0">
          <Card className="sticky top-20">
            {selectedIssue ? (
              <>
                <CardHeader className="border-b border-gray-100">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">问题详情</CardTitle>
                    <button
                      onClick={() => setSelectedIssueId(null)}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </CardHeader>
                <CardContent className="p-5 space-y-5">
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">
                      问题类型
                    </p>
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={
                          selectedIssue.severity === 'critical'
                            ? 'danger'
                            : selectedIssue.severity === 'warning'
                            ? 'warning'
                            : 'info'
                        }
                      >
                        {ISSUE_TYPE_LABELS[
                          selectedIssue.type as keyof typeof ISSUE_TYPE_LABELS
                        ] || selectedIssue.type}
                      </Badge>
                      <Badge
                        variant={
                          selectedIssue.status === 'resolved'
                            ? 'success'
                            : selectedIssue.status === 'processing'
                            ? 'warning'
                            : 'default'
                        }
                      >
                        {STATUS_LABELS[selectedIssue.status]}
                      </Badge>
                    </div>
                  </div>

                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">
                      所属商品
                    </p>
                    <p className="text-sm text-gray-900 font-medium">
                      {selectedIssue.productTitle}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">
                      问题描述
                    </p>
                    <p className="text-sm text-gray-700">{selectedIssue.description}</p>
                  </div>

                  <div className="p-4 bg-amber-50 rounded-xl border border-amber-100">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center flex-shrink-0">
                        <Lightbulb className="w-4 h-4 text-amber-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-amber-800 mb-1">
                          修改建议
                        </p>
                        <p className="text-sm text-amber-700">
                          {selectedIssue.suggestion}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">
                      当前负责人
                    </p>
                    <div className="flex items-center gap-2">
                      {selectedIssue.assigneeName ? (
                        <>
                          <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center">
                            <User className="w-4 h-4 text-primary-600" />
                          </div>
                          <span className="text-sm text-gray-700">
                            {selectedIssue.assigneeName}
                          </span>
                        </>
                      ) : (
                        <span className="text-sm text-gray-400">暂未分配</span>
                      )}
                    </div>
                  </div>

                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">
                      发现时间
                    </p>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Clock className="w-4 h-4" />
                      {formatDate(selectedIssue.createdAt)}
                    </div>
                  </div>

                  <div className="pt-3 border-t border-gray-100 space-y-2">
                    {selectedIssue.status !== 'resolved' && (
                      <Button
                        variant="success"
                        size="sm"
                        fullWidth
                        onClick={() => handleMarkResolved(selectedIssue.id)}
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        标记为已处理
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      fullWidth
                      onClick={() => handleOpenAssignModal(selectedIssue.id)}
                    >
                      <User className="w-4 h-4" />
                      {selectedIssue.assigneeName ? '重新分配负责人' : '分配负责人'}
                    </Button>
                  </div>
                </CardContent>
              </>
            ) : selectedProduct ? (
              <>
                <CardHeader className="border-b border-gray-100">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">商品概览</CardTitle>
                    <button
                      onClick={() => setSelectedProductId(null)}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </CardHeader>
                <CardContent className="p-5 space-y-5">
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {selectedProduct.title}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {selectedProduct.platform?.toUpperCase()} ·{' '}
                      {selectedProduct.category}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <p className="text-xs text-gray-500">价格</p>
                      <p className="text-lg font-bold text-gray-900">
                        ¥{selectedProduct.price.toFixed(2)}
                      </p>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <p className="text-xs text-gray-500">库存</p>
                      <p className="text-lg font-bold text-gray-900">
                        {selectedProduct.stock}
                      </p>
                    </div>
                  </div>

                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">
                      问题统计
                    </p>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">严重问题</span>
                        <span className="font-medium text-danger-600">
                          {
                            selectedProductIssues.filter((i) => i.severity === 'critical')
                              .length
                          }
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">警告问题</span>
                        <span className="font-medium text-warning-600">
                          {
                            selectedProductIssues.filter((i) => i.severity === 'warning')
                              .length
                          }
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">提示信息</span>
                        <span className="font-medium text-blue-600">
                          {
                            selectedProductIssues.filter((i) => i.severity === 'info')
                              .length
                          }
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-gray-100">
                    <Button
                      variant="primary"
                      size="sm"
                      fullWidth
                      onClick={() => selectedProductId && handleResolveAllForProduct(selectedProductId)}
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      一键全部处理
                    </Button>
                  </div>
                </CardContent>
              </>
            ) : (
              <CardContent className="p-10 text-center">
                <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                  <Info className="w-8 h-8 text-gray-400" />
                </div>
                <p className="text-base font-medium text-gray-900 mb-1">选择问题查看详情</p>
                <p className="text-sm text-gray-500">
                  点击左侧列表中的问题项查看详细信息
                </p>
              </CardContent>
            )}
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
            <Button variant="primary" onClick={handleConfirmAssign} disabled={!selectedAssigneeId}>
              确认分配
            </Button>
          </div>
        }
      >
        <div className="space-y-3">
          <p className="text-sm text-gray-600">选择负责处理此问题的人员</p>
          <div className="space-y-2">
            {assignees.map((assignee) => (
              <button
                key={assignee.id}
                onClick={() => setSelectedAssigneeId(assignee.id)}
                className={cn(
                  'w-full p-3 rounded-xl border flex items-center gap-3 text-left transition-all',
                  selectedAssigneeId === assignee.id
                    ? 'border-primary-500 bg-primary-50'
                    : 'border-gray-200 hover:border-gray-300'
                )}
              >
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white font-medium">
                  {assignee.name.charAt(0)}
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{assignee.name}</p>
                  <p className="text-sm text-gray-500">
                    {assignee.role} · 当前 {assignee.taskCount} 个待处理任务
                  </p>
                </div>
                <div
                  className={cn(
                    'w-5 h-5 rounded-full border-2 flex items-center justify-center',
                    selectedAssigneeId === assignee.id
                      ? 'border-primary-500 bg-primary-500'
                      : 'border-gray-300'
                  )}
                >
                  {selectedAssigneeId === assignee.id && (
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
