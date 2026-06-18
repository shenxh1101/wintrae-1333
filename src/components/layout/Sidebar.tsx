import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Upload,
  Settings,
  ListChecks,
  Wrench,
  Download,
  Package,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { path: '/dashboard', label: '工作台', icon: LayoutDashboard },
  { path: '/import', label: '资料导入', icon: Upload },
  { path: '/rules', label: '规则配置', icon: Settings },
  { path: '/results', label: '检查结果', icon: ListChecks },
  { path: '/fixes', label: '批量修正', icon: Wrench },
  { path: '/export', label: '导出任务', icon: Download },
];

export default function Sidebar() {
  const location = useLocation();

  return (
    <aside className="fixed left-0 top-0 h-screen w-60 bg-white border-r border-gray-100 flex flex-col z-40">
      <div className="h-16 flex items-center px-5 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center shadow-sm">
            <Package className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-base font-bold text-gray-900">资料检查</h1>
            <p className="text-xs text-gray-400">商品上架助手</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 overflow-y-auto">
        <div className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150',
                  isActive
                    ? 'bg-primary-50 text-primary-700'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                )}
              >
                <Icon
                  className={cn('w-5 h-5', isActive ? 'text-primary-600' : 'text-gray-400')}
                />
                <span>{item.label}</span>
                {isActive && (
                  <span className="ml-auto w-1.5 h-1.5 rounded-full bg-primary-500" />
                )}
              </NavLink>
            );
          })}
        </div>

        <div className="mt-8">
          <p className="px-3 text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">
            快捷操作
          </p>
          <div className="space-y-1">
            <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors">
              <span className="w-5 h-5 flex items-center justify-center text-lg">📋</span>
              <span>查看历史记录</span>
            </button>
            <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors">
              <span className="w-5 h-5 flex items-center justify-center text-lg">❓</span>
              <span>帮助中心</span>
            </button>
          </div>
        </div>
      </nav>

      <div className="p-4 border-t border-gray-100">
        <div className="bg-gradient-to-r from-primary-50 to-blue-50 rounded-xl p-4">
          <p className="text-sm font-medium text-gray-900 mb-1">需要帮助？</p>
          <p className="text-xs text-gray-500 mb-3">查看使用指南快速上手</p>
          <button className="w-full text-xs font-medium text-primary-600 hover:text-primary-700">
            查看文档 →
          </button>
        </div>
      </div>
    </aside>
  );
}
