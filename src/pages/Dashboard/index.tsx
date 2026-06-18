import { useNavigate } from 'react-router-dom';
import {
  Package,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Upload,
  Settings,
  ListChecks,
  ArrowRight,
  Image as ImageIcon,
  Type,
  DollarSign,
  Boxes,
} from 'lucide-react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import StatCard from '@/components/common/StatCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { useProductStore } from '@/store/productStore';
import { useIssueStore } from '@/store/issueStore';
import { useRuleStore } from '@/store/ruleStore';
import { ISSUE_TYPE_LABELS } from '@/types/issue';
import { useEffect, useState } from 'react';
import { runCheck } from '@/services/checkEngine';

const COLORS = ['#E53E3E', '#ED8936', '#3182CE'];

export default function Dashboard() {
  const navigate = useNavigate();
  const { products } = useProductStore();
  const { issues, hasChecked, setIssues, setHasChecked } = useIssueStore();
  const { rules } = useRuleStore();
  const [isChecking, setIsChecking] = useState(false);

  useEffect(() => {
    if (!hasChecked && products.length > 0) {
      setIsChecking(true);
      setTimeout(() => {
        const result = runCheck(products, rules);
        setIssues(result.issues);
        setHasChecked(true);
        setIsChecking(false);
      }, 500);
    }
  }, [hasChecked, products, rules, setIssues, setHasChecked]);

  const criticalCount = issues.filter((i) => i.severity === 'critical').length;
  const warningCount = issues.filter((i) => i.severity === 'warning').length;
  const infoCount = issues.filter((i) => i.severity === 'info').length;

  const severityData = [
    { name: '严重', value: criticalCount, color: '#E53E3E' },
    { name: '警告', value: warningCount, color: '#ED8936' },
    { name: '提示', value: infoCount, color: '#3182CE' },
  ];

  const typeCounts: Record<string, number> = {};
  issues.forEach((issue) => {
    typeCounts[issue.type] = (typeCounts[issue.type] || 0) + 1;
  });

  const typeData = Object.entries(typeCounts)
    .map(([type, count]) => ({
      name: ISSUE_TYPE_LABELS[type as keyof typeof ISSUE_TYPE_LABELS] || type,
      count,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 6);

  const quickActions = [
    {
      title: '导入商品资料',
      description: '批量上传商品数据',
      icon: Upload,
      color: 'primary',
      path: '/import',
    },
    {
      title: '配置检查规则',
      description: '设置平台检查标准',
      icon: Settings,
      color: 'success',
      path: '/rules',
    },
    {
      title: '查看检查结果',
      description: '浏览问题清单',
      icon: ListChecks,
      color: 'warning',
      path: '/results',
    },
  ];

  const recentProducts = products.slice(0, 5);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">工作台</h1>
          <p className="text-sm text-gray-500 mt-1">欢迎回来，今天也要高效工作哦！</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="md">
            <Clock className="w-4 h-4" />
            历史记录
          </Button>
          <Button variant="primary" size="md" onClick={() => navigate('/import')}>
            <Upload className="w-4 h-4" />
            导入商品
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-5">
        <StatCard
          title="商品总数"
          value={products.length}
          icon={<Package className="w-6 h-6 text-white" />}
          color="primary"
          trend={{ value: 12, isUp: true }}
        />
        <StatCard
          title="问题总数"
          value={issues.length}
          icon={<AlertTriangle className="w-6 h-6 text-white" />}
          color="danger"
          trend={{ value: 8, isUp: false }}
        />
        <StatCard
          title="已通过检查"
          value={products.length - new Set(issues.map(i => i.productId)).size}
          icon={<CheckCircle2 className="w-6 h-6 text-white" />}
          color="success"
          trend={{ value: 15, isUp: true }}
        />
        <StatCard
          title="待处理任务"
          value={issues.filter(i => i.status === 'pending').length}
          icon={<Clock className="w-6 h-6 text-white" />}
          color="warning"
        />
      </div>

      <div className="grid grid-cols-3 gap-5">
        <Card className="col-span-2">
          <CardHeader>
            <CardTitle>问题类型分布</CardTitle>
          </CardHeader>
          <CardContent>
            {typeData.length > 0 ? (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={typeData} layout="vertical" margin={{ left: 10, right: 10 }}>
                    <XAxis type="number" axisLine={false} tickLine={false} />
                    <YAxis
                      type="category"
                      dataKey="name"
                      axisLine={false}
                      tickLine={false}
                      width={100}
                      tick={{ fontSize: 12, fill: '#6B7280' }}
                    />
                    <Tooltip
                      contentStyle={{
                        background: '#fff',
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                        boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                      }}
                    />
                    <Bar dataKey="count" fill="#0F52BA" radius={[0, 4, 4, 0]} barSize={20} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-64 flex items-center justify-center text-gray-400">
                {isChecking ? '检查中...' : '暂无检查数据'}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>严重程度占比</CardTitle>
          </CardHeader>
          <CardContent>
            {issues.length > 0 ? (
              <>
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={severityData}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={75}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {severityData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-4 space-y-2">
                  {severityData.map((item) => (
                    <div key={item.name} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <span
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: item.color }}
                        />
                        <span className="text-gray-600">{item.name}</span>
                      </div>
                      <span className="font-medium text-gray-900">{item.value} 个</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="h-64 flex items-center justify-center text-gray-400">
                {isChecking ? '检查中...' : '暂无检查数据'}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-3 gap-5">
        <div className="col-span-2 space-y-5">
          <Card>
            <CardHeader>
              <CardTitle>快捷操作</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4">
                {quickActions.map((action) => {
                  const Icon = action.icon;
                  return (
                    <button
                      key={action.path}
                      onClick={() => navigate(action.path)}
                      className="group p-5 rounded-xl border border-gray-100 bg-gray-50/50 hover:bg-white hover:border-primary-200 hover:shadow-card transition-all duration-200 text-left"
                    >
                      <div
                        className={`w-11 h-11 rounded-xl flex items-center justify-center mb-3 ${
                          action.color === 'primary'
                            ? 'bg-primary-100 text-primary-600'
                            : action.color === 'success'
                            ? 'bg-success-100 text-success-600'
                            : 'bg-warning-100 text-warning-600'
                        }`}
                      >
                        <Icon className="w-6 h-6" />
                      </div>
                      <p className="font-semibold text-gray-900 group-hover:text-primary-700 transition-colors">
                        {action.title}
                      </p>
                      <p className="text-sm text-gray-500 mt-1">{action.description}</p>
                      <div className="mt-3 flex items-center text-sm text-primary-600 font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                        立即前往 <ArrowRight className="w-4 h-4 ml-1" />
                      </div>
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>最近导入的商品</CardTitle>
                <button
                  onClick={() => navigate('/import')}
                  className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                >
                  查看全部
                </button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentProducts.map((product) => {
                  const productIssues = issues.filter((i) => i.productId === product.id);
                  const hasCritical = productIssues.some((i) => i.severity === 'critical');
                  return (
                    <div
                      key={product.id}
                      className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                          <ImageIcon className="w-6 h-6 text-gray-400" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900 line-clamp-1 max-w-xs">
                            {product.title}
                          </p>
                          <p className="text-xs text-gray-500 mt-0.5">
                            {product.platform.toUpperCase()} · ¥{product.price}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {productIssues.length > 0 ? (
                          <span
                            className={`text-xs px-2 py-1 rounded-md font-medium ${
                              hasCritical
                                ? 'bg-danger-100 text-danger-700'
                                : 'bg-warning-100 text-warning-700'
                            }`}
                          >
                            {productIssues.length} 个问题
                          </span>
                        ) : (
                          <span className="text-xs px-2 py-1 rounded-md font-medium bg-success-100 text-success-700">
                            已通过
                          </span>
                        )}
                        <button
                          onClick={() => navigate('/results')}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-primary-600 hover:bg-primary-50 transition-colors"
                        >
                          <ArrowRight className="w-4 h-4" />
                        </button>
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
              <CardTitle>平台规则概览</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {rules.map((rule) => (
                  <div
                    key={rule.id}
                    className="flex items-center justify-between p-3 rounded-lg border border-gray-100"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-9 h-9 rounded-lg flex items-center justify-center text-lg ${
                          rule.enabled ? 'bg-primary-100' : 'bg-gray-100'
                        }`}
                      >
                        {rule.platform === 'taobao' && '🛒'}
                        {rule.platform === 'jd' && '📦'}
                        {rule.platform === 'pdd' && '🎯'}
                        {rule.platform === 'douyin' && '🎵'}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {rule.platformName}
                        </p>
                        <p className="text-xs text-gray-500">
                          {rule.enabled ? '已启用' : '已禁用'}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => navigate('/rules')}
                      className="text-xs text-primary-600 font-medium hover:text-primary-700"
                    >
                      配置
                    </button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>今日概览</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-blue-100 flex items-center justify-center">
                      <Type className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">标题问题</p>
                      <p className="text-lg font-bold text-gray-900">
                        {issues.filter(i => i.field === 'title').length}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-amber-100 flex items-center justify-center">
                      <ImageIcon className="w-5 h-5 text-amber-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">图片问题</p>
                      <p className="text-lg font-bold text-gray-900">
                        {issues.filter(i => i.field === 'images').length}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-green-100 flex items-center justify-center">
                      <DollarSign className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">价格问题</p>
                      <p className="text-lg font-bold text-gray-900">
                        {issues.filter(i => i.field === 'price').length}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-red-100 flex items-center justify-center">
                      <Boxes className="w-5 h-5 text-red-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">库存问题</p>
                      <p className="text-lg font-bold text-gray-900">
                        {issues.filter(i => i.field === 'stock').length}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
