import { useState, useCallback, useRef, useEffect } from 'react';
import {
  Upload,
  FileSpreadsheet,
  CheckCircle,
  XCircle,
  AlertCircle,
  FileJson,
  ChevronRight,
  Trash2,
  Play,
  Plus,
} from 'lucide-react';
import Papa from 'papaparse';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Modal from '@/components/ui/Modal';
import { useProductStore } from '@/store/productStore';
import { useIssueStore } from '@/store/issueStore';
import { useRuleStore } from '@/store/ruleStore';
import { useNavigate } from 'react-router-dom';
import type { Product, ProductImage, ProductSpec, LogisticsInfo } from '@/types/product';
import { runCheck } from '@/services/checkEngine';
import { generateId } from '@/utils/format';
import { cn } from '@/lib/utils';

type ImportStatus = 'idle' | 'dragging' | 'parsing' | 'preview' | 'importing' | 'success';

interface ImportStats {
  total: number;
  success: number;
  failed: number;
  skipped: number;
}

export default function ImportPage() {
  const navigate = useNavigate();
  const { products, importProducts, setProducts, clearProducts, lastImportedAt } = useProductStore();
  const { setIssues, setHasChecked, issues } = useIssueStore();
  const { rules } = useRuleStore();
  const [status, setStatus] = useState<ImportStatus>('idle');
  const [previewData, setPreviewData] = useState<Product[]>([]);
  const [stats, setStats] = useState<ImportStats>({ total: 0, success: 0, failed: 0, skipped: 0 });
  const [selectedPlatform, setSelectedPlatform] = useState('taobao');
  const [showCheckPrompt, setShowCheckPrompt] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    useIssueStore.getState().refreshAssigneeTaskCounts();
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setStatus('dragging');
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setStatus('idle');
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setStatus('idle');
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFile(files[0]);
    }
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFile(files[0]);
    }
  };

  const handleFile = (file: File) => {
    setStatus('parsing');
    const fileName = file.name.toLowerCase();

    if (fileName.endsWith('.csv')) {
      parseCSV(file);
    } else if (fileName.endsWith('.json')) {
      parseJSON(file);
    } else {
      alert('请上传CSV或JSON格式的文件');
      setStatus('idle');
    }
  };

  const parseCSV = (file: File) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const parsedProducts = results.data.map((row: any) =>
          rowToProduct(row as Record<string, string>)
        );
        setPreviewData(parsedProducts);
        setStats({
          total: parsedProducts.length,
          success: parsedProducts.length,
          failed: 0,
          skipped: 0,
        });
        setStatus('preview');
      },
      error: () => {
        alert('CSV文件解析失败，请检查文件格式');
        setStatus('idle');
      },
    });
  };

  const parseJSON = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        const parsedProducts = Array.isArray(data)
          ? data.map(rowToProduct)
          : [rowToProduct(data)];
        setPreviewData(parsedProducts);
        setStats({
          total: parsedProducts.length,
          success: parsedProducts.length,
          failed: 0,
          skipped: 0,
        });
        setStatus('preview');
      } catch {
        alert('JSON文件解析失败，请检查文件格式');
        setStatus('idle');
      }
    };
    reader.readAsText(file);
  };

  const rowToProduct = (row: Record<string, any>): Product => {
    const now = new Date().toISOString();
    const sellingPoints = row.sellingPoints
      ? (typeof row.sellingPoints === 'string'
          ? row.sellingPoints.split(/[,;，；]/).filter(Boolean)
          : row.sellingPoints)
      : [];

    const images: ProductImage[] = row.images
      ? (typeof row.images === 'string'
          ? row.images.split(/[,;，；]/).filter(Boolean).map((url, i) => ({
              id: generateId(),
              url,
              type: i < 5 ? ('main' as const) : ('detail' as const),
              sort: i + 1,
            }))
          : row.images)
      : [];

    const specs: ProductSpec[] = row.specs
      ? (typeof row.specs === 'string'
          ? row.specs.split(/[,;，；]/).filter(Boolean).map((spec, i) => {
              const [name, value] = spec.split(':');
              return {
                id: generateId(),
                name: name?.trim() || '规格',
                value: value?.trim() || spec.trim(),
              };
            })
          : row.specs)
      : [];

    const logistics: LogisticsInfo = {
      weight: row.weight ? parseFloat(row.weight) : undefined,
      size: row.size,
      shippingMethod: row.shippingMethod,
      shippingFee: row.shippingFee ? parseFloat(row.shippingFee) : undefined,
    };

    return {
      id: generateId(),
      title: row.title || row.name || '未命名商品',
      sellingPoints,
      price: parseFloat(row.price) || 0,
      originalPrice: row.originalPrice ? parseFloat(row.originalPrice) : undefined,
      stock: parseInt(row.stock) || 0,
      images,
      specs,
      description: row.description || row.detail || '',
      logistics,
      platform: row.platform || selectedPlatform,
      category: row.category,
      createdAt: now,
      updatedAt: now,
    };
  };

  const handleImport = () => {
    setStatus('importing');
    setTimeout(() => {
      importProducts(previewData);
      setStatus('success');
      setShowCheckPrompt(true);
    }, 800);
  };

  const handleRunCheckNow = () => {
    setIsChecking(true);
    setShowCheckPrompt(false);
    setTimeout(() => {
      const currentProducts = useProductStore.getState().products;
      const currentRules = useRuleStore.getState().rules;
      const result = runCheck(currentProducts, currentRules);
      setIssues(result.issues);
      setHasChecked(true);
      setIsChecking(false);
      navigate('/results');
    }, 800);
  };

  const handleSkipCheck = () => {
    setShowCheckPrompt(false);
  };

  const handleReset = () => {
    setStatus('idle');
    setPreviewData([]);
    setStats({ total: 0, success: 0, failed: 0, skipped: 0 });
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleClearAll = () => {
    if (confirm('确定要清空所有商品数据吗？')) {
      clearProducts();
    }
  };

  const fileFormats = [
    { icon: FileSpreadsheet, label: 'CSV 表格', desc: '逗号分隔格式' },
    { icon: FileJson, label: 'JSON 文件', desc: '标准JSON格式' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">资料导入</h1>
          <p className="text-sm text-gray-500 mt-1">
            批量导入商品资料，支持CSV、JSON格式
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="md" onClick={handleClearAll}>
            <Trash2 className="w-4 h-4" />
            清空数据
          </Button>
          <Button variant="primary" size="md" onClick={() => navigate('/results')}>
            <Play className="w-4 h-4" />
            开始检查
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-5">
        <div className="col-span-3 space-y-5">
          <Card>
            <CardHeader>
              <CardTitle>上传文件</CardTitle>
              <CardDescription>
                支持拖拽上传或点击选择文件
              </CardDescription>
            </CardHeader>
            <CardContent>
              {status !== 'preview' && status !== 'success' ? (
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={cn(
                    'border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all duration-200',
                    status === 'dragging'
                      ? 'border-primary-500 bg-primary-50'
                      : 'border-gray-200 hover:border-primary-300 hover:bg-gray-50/50'
                  )}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv,.json"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  <div className="flex flex-col items-center">
                    <div
                      className={cn(
                        'w-16 h-16 rounded-2xl flex items-center justify-center mb-4 transition-colors',
                        status === 'dragging'
                          ? 'bg-primary-100 text-primary-600'
                          : 'bg-gray-100 text-gray-400'
                      )}
                    >
                      <Upload className="w-8 h-8" />
                    </div>
                    <p className="text-base font-medium text-gray-900 mb-1">
                      拖拽文件到此处，或点击上传
                    </p>
                    <p className="text-sm text-gray-500 mb-4">
                      支持 CSV、JSON 格式文件
                    </p>
                    <Button variant="primary" size="sm">
                      选择文件
                    </Button>
                  </div>
                </div>
              ) : status === 'success' ? (
                <div className="py-8 text-center">
                  <div className="w-16 h-16 rounded-full bg-success-100 flex items-center justify-center mx-auto mb-4">
                    <CheckCircle className="w-8 h-8 text-success-600" />
                  </div>
                  <p className="text-xl font-bold text-gray-900 mb-1">导入成功！</p>
                  <p className="text-sm text-gray-500 mb-6">
                    成功导入 {stats.success} 条商品数据
                  </p>
                  <div className="flex items-center justify-center gap-3">
                    <Button variant="outline" size="md" onClick={handleReset}>
                      继续导入
                    </Button>
                    <Button variant="primary" size="md" onClick={() => navigate('/results')}>
                      查看检查结果
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-primary-100 flex items-center justify-center">
                        <FileSpreadsheet className="w-5 h-5 text-primary-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">数据预览</p>
                        <p className="text-sm text-gray-500">
                          共 {stats.total} 条数据待导入
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant="success">{stats.success} 条有效</Badge>
                      {stats.failed > 0 && (
                        <Badge variant="danger">{stats.failed} 条无效</Badge>
                      )}
                      <Button variant="ghost" size="sm" onClick={handleReset}>
                        重新上传
                      </Button>
                    </div>
                  </div>

                  <div className="border border-gray-200 rounded-xl overflow-hidden">
                    <div className="max-h-80 overflow-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-gray-50 sticky top-0">
                          <tr>
                            <th className="px-4 py-3 text-left font-medium text-gray-600">
                              商品标题
                            </th>
                            <th className="px-4 py-3 text-left font-medium text-gray-600">
                              价格
                            </th>
                            <th className="px-4 py-3 text-left font-medium text-gray-600">
                              库存
                            </th>
                            <th className="px-4 py-3 text-left font-medium text-gray-600">
                              图片数
                            </th>
                            <th className="px-4 py-3 text-left font-medium text-gray-600">
                              平台
                            </th>
                            <th className="px-4 py-3 text-left font-medium text-gray-600">
                              状态
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {previewData.slice(0, 10).map((product) => (
                            <tr key={product.id} className="hover:bg-gray-50">
                              <td className="px-4 py-3">
                                <p className="text-gray-900 line-clamp-1 max-w-xs">
                                  {product.title}
                                </p>
                              </td>
                              <td className="px-4 py-3 text-gray-600">
                                ¥{product.price.toFixed(2)}
                              </td>
                              <td className="px-4 py-3 text-gray-600">
                                {product.stock}
                              </td>
                              <td className="px-4 py-3 text-gray-600">
                                {product.images.length} 张
                              </td>
                              <td className="px-4 py-3">
                                <Badge variant="primary">
                                  {product.platform.toUpperCase()}
                                </Badge>
                              </td>
                              <td className="px-4 py-3">
                                <Badge variant="success">有效</Badge>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    {previewData.length > 10 && (
                      <div className="px-4 py-2 bg-gray-50 text-center text-sm text-gray-500 border-t border-gray-200">
                        仅显示前 10 条，共 {previewData.length} 条数据
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-gray-500">导入平台：</span>
                      <select
                        value={selectedPlatform}
                        onChange={(e) => setSelectedPlatform(e.target.value)}
                        className="h-9 px-3 rounded-lg border border-gray-300 text-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 focus:outline-none"
                      >
                        <option value="taobao">淘宝</option>
                        <option value="jd">京东</option>
                        <option value="pdd">拼多多</option>
                        <option value="douyin">抖音</option>
                      </select>
                    </div>
                    <Button
                      variant="primary"
                      size="md"
                      onClick={handleImport}
                      loading={(status as string) === 'importing'}
                    >
                      <Plus className="w-4 h-4" />
                      确认导入
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>支持的文件格式</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                {fileFormats.map((format) => {
                  const Icon = format.icon;
                  return (
                    <div
                      key={format.label}
                      className="p-4 rounded-xl border border-gray-200 hover:border-primary-200 hover:bg-primary-50/30 transition-colors"
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
                          <Icon className="w-5 h-5 text-gray-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{format.label}</p>
                          <p className="text-sm text-gray-500">{format.desc}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-5">
          <Card>
            <CardHeader>
              <CardTitle>导入统计</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-gray-500" />
                    <span className="text-sm text-gray-600">商品总数</span>
                  </div>
                  <span className="font-bold text-gray-900">{products.length}</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-success-50">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-success-600" />
                    <span className="text-sm text-success-700">通过检查</span>
                  </div>
                  <span className="font-bold text-success-700">
                    {products.length -
                      new Set(
                        previewData.length > 0
                          ? []
                          : []
                      ).size}
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-danger-50">
                  <div className="flex items-center gap-2">
                    <XCircle className="w-4 h-4 text-danger-600" />
                    <span className="text-sm text-danger-700">存在问题</span>
                  </div>
                  <span className="font-bold text-danger-700">-</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>导入说明</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm text-gray-600">
                <p>1. CSV文件需包含表头，字段名需与系统匹配</p>
                <p>2. 图片字段支持多个URL，用逗号分隔</p>
                <p>3. 规格字段格式：规格名:规格值，多个用逗号分隔</p>
                <p>4. 建议每次导入不超过1000条数据</p>
                <p>5. 导入数据会自动保存到本地</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>快速操作</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <button
                  onClick={() => navigate('/rules')}
                  className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors text-left"
                >
                  <span className="text-sm text-gray-700">配置检查规则</span>
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                </button>
                <button
                  onClick={() => navigate('/results')}
                  className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors text-left"
                >
                  <span className="text-sm text-gray-700">查看检查结果</span>
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                </button>
                <button
                  onClick={() => navigate('/fixes')}
                  className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors text-left"
                >
                  <span className="text-sm text-gray-700">批量修正建议</span>
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                </button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Modal
        isOpen={showCheckPrompt}
        onClose={handleSkipCheck}
        title="立即检查新导入商品？"
        size="sm"
        footer={
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={handleSkipCheck}>
              稍后检查
            </Button>
            <Button variant="primary" onClick={handleRunCheckNow} loading={isChecking}>
              <Play className="w-4 h-4" />
              立即检查
            </Button>
          </div>
        }
      >
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary-100 flex items-center justify-center flex-shrink-0">
              <Play className="w-5 h-5 text-primary-600" />
            </div>
            <div>
              <p className="font-medium text-gray-900 mb-1">发现 {stats.success} 条新导入的商品</p>
              <p className="text-sm text-gray-500">
                是否立即对所有商品执行规则检查？检查完成后可在结果页面查看问题详情。
              </p>
            </div>
          </div>
          {issues.length > 0 && (
            <div className="p-3 bg-amber-50 rounded-lg border border-amber-100">
              <p className="text-sm text-amber-700">
                提示：执行检查会覆盖现有的 {issues.length} 条检查结果
              </p>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}
