import { useState } from 'react';
import {
  Download,
  FileSpreadsheet,
  FileText,
  Clock,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  ChevronRight,
  Filter,
  User,
  Calendar,
  AlertTriangle,
  Info,
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import { useIssueStore } from '@/store/issueStore';
import { useProductStore } from '@/store/productStore';
import { useTaskStore } from '@/store/taskStore';
import { ISSUE_TYPE_LABELS, SEVERITY_LABELS } from '@/types/issue';
import type { ExportTask, ExportFormat, ExportScope } from '@/types/task';
import { cn } from '@/lib/utils';
import { generateId, formatDate } from '@/utils/format';

const formatIcons = {
  xlsx: FileSpreadsheet,
  csv: FileText,
};

const statusIcons = {
  pending: Clock,
  generating: RefreshCw,
  completed: CheckCircle2,
  failed: AlertCircle,
};

const statusColors: Record<string, string> = {
  pending: 'bg-gray-100 text-gray-600',
  generating: 'bg-blue-100 text-blue-600',
  completed: 'bg-success-100 text-success-700',
  failed: 'bg-danger-100 text-danger-700',
};

export default function ExportPage() {
  const { issues, getFilteredIssues } = useIssueStore();
  const { products } = useProductStore();
  const { tasks, addTask, selectedFormat, setSelectedFormat, selectedScope, setSelectedScope } =
    useTaskStore();
  const [taskName, setTaskName] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedSeverity, setSelectedSeverity] = useState<string[]>([]);
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [selectedAssignee, setSelectedAssignee] = useState('');

  const issueTypes = [...new Set(issues.map((i) => i.type))];
  const assignees = [...new Set(issues.filter((i) => i.assigneeName).map((i) => i.assigneeName!))];

  const getExportCount = () => {
    let filtered = issues;

    if (selectedScope === 'by_severity' && selectedSeverity.length > 0) {
      filtered = filtered.filter((i) => selectedSeverity.includes(i.severity));
    }
    if (selectedScope === 'by_type' && selectedTypes.length > 0) {
      filtered = filtered.filter((i) => selectedTypes.includes(i.type));
    }
    if (selectedScope === 'by_assignee' && selectedAssignee) {
      filtered = filtered.filter((i) => i.assigneeName === selectedAssignee);
    }

    const productCount = new Set(filtered.map((i) => i.productId)).size;
    return { issueCount: filtered.length, productCount };
  };

  const { issueCount, productCount } = getExportCount();

  const handleExport = () => {
    if (issueCount === 0) return;

    setIsGenerating(true);

    setTimeout(() => {
      let filtered = issues;

      if (selectedScope === 'by_severity' && selectedSeverity.length > 0) {
        filtered = filtered.filter((i) => selectedSeverity.includes(i.severity));
      }
      if (selectedScope === 'by_type' && selectedTypes.length > 0) {
        filtered = filtered.filter((i) => selectedTypes.includes(i.type));
      }
      if (selectedScope === 'by_assignee' && selectedAssignee) {
        filtered = filtered.filter((i) => i.assigneeName === selectedAssignee);
      }

      const exportData = filtered.map((issue) => ({
        商品ID: issue.productId,
        商品标题: issue.productTitle,
        问题类型: ISSUE_TYPE_LABELS[issue.type as keyof typeof ISSUE_TYPE_LABELS] || issue.type,
        严重程度: SEVERITY_LABELS[issue.severity as keyof typeof SEVERITY_LABELS] || issue.severity,
        问题字段: issue.field,
        问题描述: issue.description,
        修改建议: issue.suggestion,
        状态: issue.status === 'pending' ? '待处理' : issue.status === 'processing' ? '处理中' : '已完成',
        负责人: issue.assigneeName || '未分配',
        发现时间: formatDate(issue.createdAt),
      }));

      const ws = XLSX.utils.json_to_sheet(exportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, '问题清单');

      ws['!cols'] = [
        { wch: 20 },
        { wch: 40 },
        { wch: 18 },
        { wch: 10 },
        { wch: 12 },
        { wch: 40 },
        { wch: 40 },
        { wch: 10 },
        { wch: 12 },
        { wch: 18 },
      ];

      const fileName = taskName || `商品检查报告_${new Date().toLocaleDateString()}`;
      XLSX.writeFile(wb, `${fileName}.${selectedFormat}`);

      const newTask: ExportTask = {
        id: generateId(),
        name: fileName,
        format: selectedFormat as ExportFormat,
        scope: selectedScope as ExportScope,
        issueCount: filtered.length,
        productCount: new Set(filtered.map((i) => i.productId)).size,
        status: 'completed',
        createdAt: new Date().toISOString(),
        createdBy: '当前用户',
      };
      addTask(newTask);

      setIsGenerating(false);
    }, 1000);
  };

  const scopeOptions = [
    { value: 'all', label: '全部问题', desc: '导出所有检查出的问题' },
    { value: 'by_severity', label: '按严重程度', desc: '只导出指定严重程度的问题' },
    { value: 'by_type', label: '按问题类型', desc: '只导出指定类型的问题' },
    { value: 'by_assignee', label: '按负责人', desc: '按负责人分组导出' },
  ];

  const severityOptions = [
    { value: 'critical', label: '严重', color: 'danger' },
    { value: 'warning', label: '警告', color: 'warning' },
    { value: 'info', label: '提示', color: 'info' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">导出任务</h1>
          <p className="text-sm text-gray-500 mt-1">
            导出问题清单，分配给负责人处理
          </p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-5">
        <div className="col-span-2 space-y-5">
          <Card>
            <CardHeader>
              <CardTitle>导出设置</CardTitle>
              <CardDescription>
                配置导出参数，生成可下载的问题清单
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  任务名称
                </label>
                <input
                  type="text"
                  placeholder="输入任务名称，如：6月新品检查报告"
                  value={taskName}
                  onChange={(e) => setTaskName(e.target.value)}
                  className="w-full h-10 px-4 rounded-lg border border-gray-300 text-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 focus:outline-none transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  导出格式
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {(['xlsx', 'csv'] as const).map((format) => {
                    const Icon = formatIcons[format];
                    return (
                      <button
                        key={format}
                        onClick={() => setSelectedFormat(format)}
                        className={cn(
                          'p-4 rounded-xl border text-left transition-all',
                          selectedFormat === format
                            ? 'border-primary-500 bg-primary-50'
                            : 'border-gray-200 hover:border-gray-300'
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={cn(
                              'w-10 h-10 rounded-lg flex items-center justify-center',
                              selectedFormat === format
                                ? 'bg-primary-100 text-primary-600'
                                : 'bg-gray-100 text-gray-500'
                            )}
                          >
                            <Icon className="w-5 h-5" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">
                              {format.toUpperCase()} 格式
                            </p>
                            <p className="text-xs text-gray-500">
                              {format === 'xlsx' ? 'Excel 表格，支持多工作表' : '纯文本格式，通用性强'}
                            </p>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  导出范围
                </label>
                <div className="space-y-2">
                  {scopeOptions.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => setSelectedScope(option.value as ExportScope)}
                      className={cn(
                        'w-full p-4 rounded-xl border text-left transition-all',
                        selectedScope === option.value
                          ? 'border-primary-500 bg-primary-50'
                          : 'border-gray-200 hover:border-gray-300'
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-gray-900">{option.label}</p>
                          <p className="text-sm text-gray-500 mt-0.5">{option.desc}</p>
                        </div>
                        <div
                          className={cn(
                            'w-5 h-5 rounded-full border-2 flex items-center justify-center',
                            selectedScope === option.value
                              ? 'border-primary-500 bg-primary-500'
                              : 'border-gray-300'
                          )}
                        >
                          {selectedScope === option.value && (
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
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {selectedScope === 'by_severity' && (
                <div className="p-4 bg-gray-50 rounded-xl">
                  <p className="text-sm font-medium text-gray-700 mb-3">选择严重程度</p>
                  <div className="flex flex-wrap gap-2">
                    {severityOptions.map((option) => {
                      const isSelected = selectedSeverity.includes(option.value);
                      return (
                        <button
                          key={option.value}
                          onClick={() => {
                            if (isSelected) {
                              setSelectedSeverity(
                                selectedSeverity.filter((s) => s !== option.value)
                              );
                            } else {
                              setSelectedSeverity([...selectedSeverity, option.value]);
                            }
                          }}
                          className={cn(
                            'px-4 py-2 rounded-lg text-sm font-medium transition-all',
                            isSelected
                              ? option.color === 'danger'
                                ? 'bg-danger-100 text-danger-700 ring-2 ring-danger-500/30'
                                : option.color === 'warning'
                                ? 'bg-warning-100 text-warning-700 ring-2 ring-warning-500/30'
                                : 'bg-blue-100 text-blue-700 ring-2 ring-blue-500/30'
                              : 'bg-white border border-gray-200 text-gray-600 hover:border-gray-300'
                          )}
                        >
                          {option.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {selectedScope === 'by_type' && (
                <div className="p-4 bg-gray-50 rounded-xl">
                  <p className="text-sm font-medium text-gray-700 mb-3">选择问题类型</p>
                  <div className="flex flex-wrap gap-2">
                    {issueTypes.map((type) => {
                      const isSelected = selectedTypes.includes(type);
                      return (
                        <button
                          key={type}
                          onClick={() => {
                            if (isSelected) {
                              setSelectedTypes(selectedTypes.filter((t) => t !== type));
                            } else {
                              setSelectedTypes([...selectedTypes, type]);
                            }
                          }}
                          className={cn(
                            'px-3 py-1.5 rounded-lg text-sm transition-all',
                            isSelected
                              ? 'bg-primary-100 text-primary-700 font-medium'
                              : 'bg-white border border-gray-200 text-gray-600 hover:border-gray-300'
                          )}
                        >
                          {ISSUE_TYPE_LABELS[type as keyof typeof ISSUE_TYPE_LABELS] || type}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {selectedScope === 'by_assignee' && (
                <div className="p-4 bg-gray-50 rounded-xl">
                  <p className="text-sm font-medium text-gray-700 mb-3">选择负责人</p>
                  <select
                    value={selectedAssignee}
                    onChange={(e) => setSelectedAssignee(e.target.value)}
                    className="w-full h-10 px-4 rounded-lg border border-gray-300 text-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 focus:outline-none bg-white"
                  >
                    <option value="">请选择负责人</option>
                    {assignees.map((name) => (
                      <option key={name} value={name}>
                        {name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="p-4 bg-primary-50/50 rounded-xl border border-primary-100">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">预计导出</p>
                    <div className="flex items-center gap-4 mt-1">
                      <span className="text-2xl font-bold text-primary-700">
                        {issueCount}
                      </span>
                      <span className="text-sm text-gray-500">个问题</span>
                      <span className="text-2xl font-bold text-primary-700">
                        {productCount}
                      </span>
                      <span className="text-sm text-gray-500">个商品</span>
                    </div>
                  </div>
                  <Button
                    variant="primary"
                    size="lg"
                    onClick={handleExport}
                    loading={isGenerating}
                    disabled={issueCount === 0}
                  >
                    <Download className="w-5 h-5" />
                    生成导出文件
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>导出历史</CardTitle>
                  <CardDescription>查看历史导出记录</CardDescription>
                </div>
                <Button variant="outline" size="sm">
                  <RefreshCw className="w-4 h-4" />
                  刷新
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-gray-50">
                {tasks.length > 0 ? (
                  tasks.map((task) => {
                    const StatusIcon = statusIcons[task.status];
                    return (
                      <div
                        key={task.id}
                        className="p-4 flex items-center gap-4 hover:bg-gray-50 transition-colors"
                      >
                        <div
                          className={cn(
                            'w-10 h-10 rounded-lg flex items-center justify-center',
                            task.format === 'xlsx'
                              ? 'bg-green-100 text-green-600'
                              : 'bg-blue-100 text-blue-600'
                          )}
                        >
                          <FileSpreadsheet className="w-5 h-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-gray-900 line-clamp-1">
                              {task.name}
                            </p>
                            <Badge
                              variant={
                                task.format === 'xlsx' ? 'success' : 'info'
                              }
                              size="sm"
                            >
                              {task.format.toUpperCase()}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-4 mt-1 text-xs text-gray-500">
                            <span className="flex items-center gap-1">
                              <AlertTriangle className="w-3.5 h-3.5" />
                              {task.issueCount} 个问题
                            </span>
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3.5 h-3.5" />
                              {formatDate(task.createdAt)}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <Badge
                            variant={
                              task.status === 'completed'
                                ? 'success'
                                : task.status === 'failed'
                                ? 'danger'
                                : 'default'
                            }
                            size="sm"
                          >
                            {task.status === 'pending'
                              ? '待导出'
                              : task.status === 'generating'
                              ? '生成中'
                              : task.status === 'completed'
                              ? '已完成'
                              : '失败'}
                          </Badge>
                          {task.status === 'completed' && (
                            <button
                              onClick={() => {}}
                              className="p-2 rounded-lg text-primary-600 hover:bg-primary-50 transition-colors"
                            >
                              <Download className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="py-12 text-center">
                    <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
                      <Clock className="w-6 h-6 text-gray-400" />
                    </div>
                    <p className="text-sm text-gray-500">暂无导出记录</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-5">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">导出说明</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm text-gray-600">
                <p>1. 导出文件包含问题清单和修改建议</p>
                <p>2. 可按严重程度、问题类型、负责人筛选</p>
                <p>3. Excel格式支持多工作表和格式美化</p>
                <p>4. CSV格式体积小，兼容性更好</p>
                <p>5. 导出记录会保存在历史记录中</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">问题统计</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-danger-500" />
                    <span className="text-sm text-gray-600">严重问题</span>
                  </div>
                  <span className="font-bold text-danger-600">
                    {issues.filter((i) => i.severity === 'critical').length}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-warning-500" />
                    <span className="text-sm text-gray-600">警告问题</span>
                  </div>
                  <span className="font-bold text-warning-600">
                    {issues.filter((i) => i.severity === 'warning').length}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-blue-500" />
                    <span className="text-sm text-gray-600">提示信息</span>
                  </div>
                  <span className="font-bold text-blue-600">
                    {issues.filter((i) => i.severity === 'info').length}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">快捷入口</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <button className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors text-left">
                <div className="flex items-center gap-3">
                  <Filter className="w-5 h-5 text-gray-400" />
                  <span className="text-sm text-gray-700">高级筛选</span>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-400" />
              </button>
              <button className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors text-left">
                <div className="flex items-center gap-3">
                  <User className="w-5 h-5 text-gray-400" />
                  <span className="text-sm text-gray-700">管理负责人</span>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-400" />
              </button>
              <button className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors text-left">
                <div className="flex items-center gap-3">
                  <Info className="w-5 h-5 text-gray-400" />
                  <span className="text-sm text-gray-700">导出模板</span>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-400" />
              </button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
