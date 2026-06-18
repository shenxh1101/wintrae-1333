import { useState, useMemo } from 'react';
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
  X,
  ShoppingBag,
  Save,
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Modal from '@/components/ui/Modal';
import { useIssueStore } from '@/store/issueStore';
import { useProductStore } from '@/store/productStore';
import { useTaskStore } from '@/store/taskStore';
import {
  ISSUE_TYPE_LABELS,
  SEVERITY_LABELS,
  STATUS_LABELS,
} from '@/types/issue';
import type { ExportTask, ExportFormat, ExportScope, ExportIssueSnapshot, FilterPreset } from '@/types/task';
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

const PLATFORM_OPTIONS = [
  { value: 'all', label: '全部平台' },
  { value: 'taobao', label: '淘宝' },
  { value: 'jd', label: '京东' },
  { value: 'pdd', label: '拼多多' },
  { value: 'douyin', label: '抖音' },
];

const STATUS_OPTIONS = [
  { value: 'all', label: '全部状态' },
  { value: 'pending', label: '待处理' },
  { value: 'processing', label: '处理中' },
  { value: 'resolved', label: '已完成' },
];

export default function ExportPage() {
  const { issues } = useIssueStore();
  const { products, batches, selectedBatchId, setSelectedBatchId } = useProductStore();
  const {
    tasks,
    addTask,
    assignees,
    selectedFormat,
    setSelectedFormat,
    selectedScope,
    setSelectedScope,
    filterPresets,
    addFilterPreset,
    deleteFilterPreset,
    applyFilterPreset,
  } = useTaskStore();
  const [taskName, setTaskName] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedSeverity, setSelectedSeverity] = useState<string[]>([]);
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [selectedAssignee, setSelectedAssignee] = useState('all');
  const [selectedPlatform, setSelectedPlatform] = useState('all');
  const [selectedIssueStatus, setSelectedIssueStatus] = useState('all');
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewTask, setPreviewTask] = useState<ExportTask | null>(null);
  const [showSavePresetModal, setShowSavePresetModal] = useState(false);
  const [presetName, setPresetName] = useState('');
  const [selectedPresetId, setSelectedPresetId] = useState('');
  const [showPresetDropdown, setShowPresetDropdown] = useState(false);

  const issueTypes = [...new Set(issues.map((i) => i.type))];

  const getFilteredIssues = () => {
    let filtered = issues;

    if (selectedBatchId !== 'all') {
      filtered = filtered.filter((i) => {
        const product = products.find((p) => p.id === i.productId);
        return product?.batchId === selectedBatchId;
      });
    }

    if (selectedScope === 'by_severity' || selectedScope === 'custom') {
      if (selectedSeverity.length > 0) {
        filtered = filtered.filter((i) => selectedSeverity.includes(i.severity));
      }
    }
    if (selectedScope === 'by_type' || selectedScope === 'custom') {
      if (selectedTypes.length > 0) {
        filtered = filtered.filter((i) => selectedTypes.includes(i.type));
      }
    }
    if (selectedScope === 'by_assignee' || selectedScope === 'custom') {
      if (selectedAssignee !== 'all') {
        if (selectedAssignee === 'unassigned') {
          filtered = filtered.filter((i) => !i.assignee);
        } else {
          filtered = filtered.filter((i) => i.assignee === selectedAssignee);
        }
      }
    }
    if (selectedScope === 'custom') {
      if (selectedPlatform !== 'all') {
        filtered = filtered.filter((i) => {
          const product = products.find((p) => p.id === i.productId);
          return product?.platform === selectedPlatform;
        });
      }
      if (selectedIssueStatus !== 'all') {
        filtered = filtered.filter((i) => i.status === selectedIssueStatus);
      }
    }

    return filtered;
  };

  const filteredIssues = useMemo(() => getFilteredIssues(), [
    issues, selectedBatchId, selectedScope, selectedSeverity, selectedTypes,
    selectedAssignee, selectedPlatform, selectedIssueStatus, products
  ]);

  const exportCount = useMemo(() => {
    const productCount = new Set(filteredIssues.map((i) => i.productId)).size;
    return { issueCount: filteredIssues.length, productCount };
  }, [filteredIssues]);

  const severityStats = useMemo(() => ({
    critical: filteredIssues.filter((i) => i.severity === 'critical').length,
    warning: filteredIssues.filter((i) => i.severity === 'warning').length,
    info: filteredIssues.filter((i) => i.severity === 'info').length,
  }), [filteredIssues]);

  const progressStats = useMemo(() => {
    const total = filteredIssues.length;
    const pending = filteredIssues.filter((i) => i.status === 'pending').length;
    const processing = filteredIssues.filter((i) => i.status === 'processing').length;
    const resolved = filteredIssues.filter((i) => i.status === 'resolved').length;
    const rate = total > 0 ? Math.round((resolved / total) * 100) : 0;
    return { total, pending, processing, resolved, rate };
  }, [filteredIssues]);

  const buildExportData = (issuesToExport: typeof filteredIssues) => {
    return issuesToExport.map((issue) => {
      const product = products.find((p) => p.id === issue.productId);
      return {
        商品ID: issue.productId,
        商品标题: issue.productTitle,
        平台: product?.platform?.toUpperCase() || '-',
        价格: product ? `¥${product.price.toFixed(2)}` : '-',
        库存: product?.stock ?? '-',
        问题类型: ISSUE_TYPE_LABELS[issue.type as keyof typeof ISSUE_TYPE_LABELS] || issue.type,
        严重程度: SEVERITY_LABELS[issue.severity as keyof typeof SEVERITY_LABELS] || issue.severity,
        问题字段: issue.field,
        问题描述: issue.description,
        修改建议: issue.suggestion,
        处理状态: STATUS_LABELS[issue.status as keyof typeof STATUS_LABELS] || issue.status,
        负责人: issue.assigneeName || '未分配',
        发现时间: formatDate(issue.createdAt),
      };
    });
  };

  const buildSnapshots = (issuesToExport: typeof filteredIssues): ExportIssueSnapshot[] => {
    return issuesToExport.map((issue) => ({
      productId: issue.productId,
      productTitle: issue.productTitle,
      issueType: issue.type,
      severity: issue.severity,
      description: issue.description,
      suggestion: issue.suggestion,
      status: issue.status,
      assigneeName: issue.assigneeName,
    }));
  };

  const handleExport = () => {
    if (exportCount.issueCount === 0) return;

    setIsGenerating(true);

    setTimeout(() => {
      const exportData = buildExportData(filteredIssues);
      const snapshots = buildSnapshots(filteredIssues);

      const ws = XLSX.utils.json_to_sheet(exportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, '问题清单');

      ws['!cols'] = [
        { wch: 20 },
        { wch: 40 },
        { wch: 10 },
        { wch: 10 },
        { wch: 8 },
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
        severityFilter: selectedScope === 'by_severity' || selectedScope === 'custom' ? selectedSeverity : undefined,
        typeFilter: selectedScope === 'by_type' || selectedScope === 'custom' ? selectedTypes : undefined,
        assigneeFilter: (selectedScope === 'by_assignee' || selectedScope === 'custom') && selectedAssignee !== 'all' ? selectedAssignee : undefined,
        platformFilter: selectedScope === 'custom' && selectedPlatform !== 'all' ? selectedPlatform : undefined,
        issueCount: filteredIssues.length,
        productCount: new Set(filteredIssues.map((i) => i.productId)).size,
        status: 'completed',
        createdAt: new Date().toISOString(),
        createdBy: '当前用户',
        issueSnapshots: snapshots,
      };
      addTask(newTask);

      setIsGenerating(false);
    }, 1000);
  };

  const handleRedownload = (task: ExportTask) => {
    let exportData: Record<string, any>[] = [];

    if (task.issueSnapshots && task.issueSnapshots.length > 0) {
      exportData = task.issueSnapshots.map((snap) => ({
        商品ID: snap.productId,
        商品标题: snap.productTitle,
        问题类型: ISSUE_TYPE_LABELS[snap.issueType as keyof typeof ISSUE_TYPE_LABELS] || snap.issueType,
        严重程度: SEVERITY_LABELS[snap.severity as keyof typeof SEVERITY_LABELS] || snap.severity,
        问题描述: snap.description,
        修改建议: snap.suggestion,
        处理状态: STATUS_LABELS[snap.status as keyof typeof STATUS_LABELS] || snap.status,
        负责人: snap.assigneeName || '未分配',
      }));
    } else {
      exportData = [
        {
          任务名称: task.name,
          导出格式: task.format.toUpperCase(),
          导出时间: formatDate(task.createdAt),
          导出人: task.createdBy,
          问题数量: task.issueCount,
          商品数量: task.productCount,
          备注: '快照数据已丢失，以上为任务元数据',
        },
      ];
    }

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, task.issueSnapshots && task.issueSnapshots.length > 0 ? '问题清单' : '导出任务信息');

    if (task.issueSnapshots && task.issueSnapshots.length > 0) {
      ws['!cols'] = [
        { wch: 20 },
        { wch: 40 },
        { wch: 18 },
        { wch: 10 },
        { wch: 40 },
        { wch: 40 },
        { wch: 10 },
        { wch: 12 },
      ];
    } else {
      ws['!cols'] = [
        { wch: 20 },
        { wch: 15 },
        { wch: 25 },
        { wch: 15 },
        { wch: 12 },
        { wch: 12 },
        { wch: 35 },
      ];
    }

    XLSX.writeFile(wb, `${task.name}.${task.format}`);
  };

  const handlePreviewTask = (task: ExportTask) => {
    setPreviewTask(task);
    setPreviewOpen(true);
  };

  const handleSavePreset = () => {
    if (!presetName.trim()) return;

    addFilterPreset({
      name: presetName.trim(),
      scope: selectedScope as ExportScope,
      severityFilter: selectedScope === 'by_severity' || selectedScope === 'custom' ? selectedSeverity : undefined,
      typeFilter: selectedScope === 'by_type' || selectedScope === 'custom' ? selectedTypes : undefined,
      assigneeFilter: (selectedScope === 'by_assignee' || selectedScope === 'custom') && selectedAssignee !== 'all' ? selectedAssignee : undefined,
      platformFilter: selectedScope === 'custom' && selectedPlatform !== 'all' ? selectedPlatform : undefined,
      statusFilter: selectedScope === 'custom' && selectedIssueStatus !== 'all' ? selectedIssueStatus : undefined,
    });

    setPresetName('');
    setShowSavePresetModal(false);
  };

  const handleSelectPreset = (presetId: string) => {
    if (!presetId) {
      setSelectedPresetId('');
      return;
    }

    const preset = applyFilterPreset(presetId);
    if (preset) {
      setSelectedPresetId(presetId);
      setSelectedSeverity(preset.severityFilter || []);
      setSelectedTypes(preset.typeFilter || []);
      setSelectedAssignee(preset.assigneeFilter || 'all');
      setSelectedPlatform(preset.platformFilter || 'all');
      setSelectedIssueStatus(preset.statusFilter || 'all');
    }
  };

  const scopeOptions = [
    { value: 'all', label: '全部问题', desc: '导出所有检查出的问题' },
    { value: 'custom', label: '自定义组合筛选', desc: '按平台、严重程度、负责人、状态组合筛选' },
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
            按平台、负责人、严重程度组合筛选，导出问题清单分配处理
          </p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-5">
        <div className="col-span-2 space-y-5">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>导出设置</CardTitle>
                  <CardDescription>
                    配置导出参数，生成可下载的问题清单
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <button
                      onClick={() => setShowPresetDropdown(!showPresetDropdown)}
                      className="h-9 px-3 pr-8 rounded-lg border border-gray-300 text-sm bg-white hover:border-gray-400 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 focus:outline-none transition-colors text-left min-w-[140px] flex items-center justify-between"
                    >
                      <span className={cn('truncate', !selectedPresetId && 'text-gray-400')}>
                        {selectedPresetId
                          ? filterPresets.find((p) => p.id === selectedPresetId)?.name || '选择筛选方案'
                          : '选择筛选方案'}
                      </span>
                      <ChevronRight className={cn(
                        'absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none transition-transform',
                        showPresetDropdown && 'rotate-[-90deg]'
                      )} />
                    </button>
                    {showPresetDropdown && (
                      <>
                        <div
                          className="fixed inset-0 z-10"
                          onClick={() => setShowPresetDropdown(false)}
                        />
                        <div className="absolute right-0 top-full mt-1 w-56 max-h-64 overflow-auto bg-white border border-gray-200 rounded-lg shadow-lg z-20">
                          {filterPresets.length === 0 ? (
                            <div className="px-3 py-4 text-sm text-gray-400 text-center">
                              暂无保存的筛选方案
                            </div>
                          ) : (
                            filterPresets.map((preset) => (
                              <div
                                key={preset.id}
                                className={cn(
                                  'flex items-center justify-between gap-2 px-3 py-2 hover:bg-gray-50 text-sm cursor-pointer transition-colors',
                                  selectedPresetId === preset.id && 'bg-primary-50'
                                )}
                              >
                                <span
                                  className="flex-1 truncate text-gray-700"
                                  onClick={() => {
                                    handleSelectPreset(preset.id);
                                    setShowPresetDropdown(false);
                                  }}
                                >
                                  {preset.name}
                                </span>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    deleteFilterPreset(preset.id);
                                    if (selectedPresetId === preset.id) {
                                      setSelectedPresetId('');
                                    }
                                  }}
                                  className="p-1 rounded hover:bg-gray-200 text-gray-400 hover:text-danger-600 transition-colors"
                                  title="删除方案"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ))
                          )}
                        </div>
                      </>
                    )}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowSavePresetModal(true)}
                  >
                    <Save className="w-4 h-4" />
                    保存筛选方案
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  批次筛选
                </label>
                <select
                  value={selectedBatchId}
                  onChange={(e) => setSelectedBatchId(e.target.value)}
                  className="w-full h-10 px-4 rounded-lg border border-gray-300 text-sm bg-white focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 focus:outline-none"
                >
                  <option value="all">全部商品</option>
                  {batches.map((batch) => (
                    <option key={batch.id} value={batch.id}>
                      {batch.name} ({batch.productCount}个商品)
                    </option>
                  ))}
                </select>
              </div>

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

              {selectedScope === 'custom' && (
                <div className="space-y-4 p-4 bg-gray-50 rounded-xl">
                  <p className="text-sm font-medium text-gray-700">组合筛选条件</p>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-gray-500 mb-1.5">所属平台</label>
                      <select
                        value={selectedPlatform}
                        onChange={(e) => setSelectedPlatform(e.target.value)}
                        className="w-full h-9 px-3 rounded-lg border border-gray-300 text-sm bg-white focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 focus:outline-none"
                      >
                        {PLATFORM_OPTIONS.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1.5">处理状态</label>
                      <select
                        value={selectedIssueStatus}
                        onChange={(e) => setSelectedIssueStatus(e.target.value)}
                        className="w-full h-9 px-3 rounded-lg border border-gray-300 text-sm bg-white focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 focus:outline-none"
                      >
                        {STATUS_OPTIONS.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs text-gray-500 mb-1.5">严重程度</label>
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
                              'px-3 py-1.5 rounded-lg text-sm font-medium transition-all',
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

                  <div>
                    <label className="block text-xs text-gray-500 mb-1.5">负责人</label>
                    <select
                      value={selectedAssignee}
                      onChange={(e) => setSelectedAssignee(e.target.value)}
                      className="w-full h-9 px-3 rounded-lg border border-gray-300 text-sm bg-white focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 focus:outline-none"
                    >
                      <option value="all">全部负责人</option>
                      <option value="unassigned">未分配</option>
                      {assignees.map((a) => (
                        <option key={a.id} value={a.id}>
                          {a.name} ({a.role}) - {a.taskCount}待办
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

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
                    {issueTypes.length === 0 ? (
                      <p className="text-sm text-gray-400">暂无数据</p>
                    ) : (
                      issueTypes.map((type) => {
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
                      })
                    )}
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
                    <option value="all">全部负责人</option>
                    <option value="unassigned">未分配</option>
                    {assignees.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.name} ({a.role})
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
                        {exportCount.issueCount}
                      </span>
                      <span className="text-sm text-gray-500">个问题</span>
                      <span className="text-2xl font-bold text-primary-700">
                        {exportCount.productCount}
                      </span>
                      <span className="text-sm text-gray-500">个商品</span>
                    </div>
                    {filteredIssues.length > 0 && (
                      <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                        <span>包含字段：平台、价格、库存、问题类型、严重程度、描述、建议、状态、负责人</span>
                      </div>
                    )}
                  </div>
                  <Button
                    variant="primary"
                    size="lg"
                    onClick={handleExport}
                    loading={isGenerating}
                    disabled={exportCount.issueCount === 0}
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
                  <CardDescription>查看历史导出记录，可重新下载</CardDescription>
                </div>
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
                            {task.platformFilter && (
                              <Badge variant="default" size="sm">
                                {PLATFORM_OPTIONS.find((p) => p.value === task.platformFilter)?.label || task.platformFilter}
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-4 mt-1 text-xs text-gray-500">
                            <span className="flex items-center gap-1">
                              <AlertTriangle className="w-3.5 h-3.5" />
                              {task.issueCount} 个问题
                            </span>
                            <span className="flex items-center gap-1">
                              <ShoppingBag className="w-3.5 h-3.5" />
                              {task.productCount} 个商品
                            </span>
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3.5 h-3.5" />
                              {formatDate(task.createdAt)}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
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
                            <>
                              <button
                                onClick={() => handlePreviewTask(task)}
                                className="p-2 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors"
                                title="查看详情"
                              >
                                <Info className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleRedownload(task)}
                                className="p-2 rounded-lg text-primary-600 hover:bg-primary-50 transition-colors"
                                title="重新下载"
                              >
                                <Download className="w-4 h-4" />
                              </button>
                            </>
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
                <p>1. 导出文件包含完整问题清单和修改建议</p>
                <p>2. 支持按平台、严重程度、负责人、状态组合筛选</p>
                <p>3. 每条记录包含负责人和处理状态</p>
                <p>4. 历史任务可随时重新下载</p>
                <p>5. Excel格式支持多工作表和格式美化</p>
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
                    {severityStats.critical}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-warning-500" />
                    <span className="text-sm text-gray-600">警告问题</span>
                  </div>
                  <span className="font-bold text-warning-600">
                    {severityStats.warning}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-blue-500" />
                    <span className="text-sm text-gray-600">提示信息</span>
                  </div>
                  <span className="font-bold text-blue-600">
                    {severityStats.info}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">处理进度</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div>
                  <div className="flex items-center justify-between text-sm mb-1.5">
                    <span className="text-gray-600">总体处理率</span>
                    <span className="font-medium text-gray-900">
                      {progressStats.rate}%
                    </span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-success-400 to-success-600 rounded-full"
                      style={{
                        width: `${progressStats.rate}%`,
                      }}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="p-2 bg-gray-50 rounded-lg">
                    <p className="text-lg font-bold text-gray-900">
                      {progressStats.pending}
                    </p>
                    <p className="text-xs text-gray-500">待处理</p>
                  </div>
                  <div className="p-2 bg-gray-50 rounded-lg">
                    <p className="text-lg font-bold text-warning-600">
                      {progressStats.processing}
                    </p>
                    <p className="text-xs text-gray-500">处理中</p>
                  </div>
                  <div className="p-2 bg-gray-50 rounded-lg">
                    <p className="text-lg font-bold text-success-600">
                      {progressStats.resolved}
                    </p>
                    <p className="text-xs text-gray-500">已完成</p>
                  </div>
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
            </CardContent>
          </Card>
        </div>
      </div>

      <Modal
        isOpen={previewOpen}
        onClose={() => setPreviewOpen(false)}
        title="导出任务详情"
        size="lg"
        footer={
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setPreviewOpen(false)}>
              关闭
            </Button>
            {previewTask && (
              <Button variant="primary" onClick={() => handleRedownload(previewTask)}>
                <Download className="w-4 h-4" />
                重新下载
              </Button>
            )}
          </div>
        }
      >
        {previewTask && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-500">任务名称</p>
                <p className="text-sm font-medium text-gray-900 mt-1">{previewTask.name}</p>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-500">导出格式</p>
                <p className="text-sm font-medium text-gray-900 mt-1">
                  {previewTask.format.toUpperCase()}
                </p>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-500">问题数量</p>
                <p className="text-sm font-medium text-gray-900 mt-1">{previewTask.issueCount}</p>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-500">商品数量</p>
                <p className="text-sm font-medium text-gray-900 mt-1">{previewTask.productCount}</p>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-500">导出时间</p>
                <p className="text-sm font-medium text-gray-900 mt-1">
                  {formatDate(previewTask.createdAt)}
                </p>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-500">导出人</p>
                <p className="text-sm font-medium text-gray-900 mt-1">{previewTask.createdBy}</p>
              </div>
            </div>

            {previewTask.issueSnapshots && previewTask.issueSnapshots.length > 0 && (
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">问题清单预览（前10条）</p>
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <div className="max-h-64 overflow-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50 sticky top-0">
                        <tr>
                          <th className="px-3 py-2 text-left font-medium text-gray-600">商品标题</th>
                          <th className="px-3 py-2 text-left font-medium text-gray-600">问题类型</th>
                          <th className="px-3 py-2 text-left font-medium text-gray-600">严重程度</th>
                          <th className="px-3 py-2 text-left font-medium text-gray-600">状态</th>
                          <th className="px-3 py-2 text-left font-medium text-gray-600">负责人</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {previewTask.issueSnapshots.slice(0, 10).map((snap, idx) => (
                          <tr key={idx}>
                            <td className="px-3 py-2 text-gray-900 line-clamp-1 max-w-xs">{snap.productTitle}</td>
                            <td className="px-3 py-2 text-gray-700">
                              {ISSUE_TYPE_LABELS[snap.issueType as keyof typeof ISSUE_TYPE_LABELS] || snap.issueType}
                            </td>
                            <td className="px-3 py-2 text-gray-700">
                              {SEVERITY_LABELS[snap.severity as keyof typeof SEVERITY_LABELS] || snap.severity}
                            </td>
                            <td className="px-3 py-2 text-gray-700">
                              {STATUS_LABELS[snap.status as keyof typeof STATUS_LABELS] || snap.status}
                            </td>
                            <td className="px-3 py-2 text-gray-700">{snap.assigneeName || '未分配'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>

      <Modal
        isOpen={showSavePresetModal}
        onClose={() => setShowSavePresetModal(false)}
        title="保存筛选方案"
        size="sm"
        footer={
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setShowSavePresetModal(false)}>
              取消
            </Button>
            <Button variant="primary" onClick={handleSavePreset} disabled={!presetName.trim()}>
              保存
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              方案名称
            </label>
            <input
              type="text"
              placeholder="如：618大促严重问题"
              value={presetName}
              onChange={(e) => setPresetName(e.target.value)}
              className="w-full h-10 px-4 rounded-lg border border-gray-300 text-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 focus:outline-none transition-colors"
              autoFocus
            />
          </div>
          <p className="text-xs text-gray-500">
            将保存当前所有筛选条件（导出范围、严重程度、问题类型、负责人、平台、状态）
          </p>
        </div>
      </Modal>
    </div>
  );
}
