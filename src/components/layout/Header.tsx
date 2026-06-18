import { Bell, Search, ChevronDown, Play } from 'lucide-react';
import { useProductStore } from '@/store/productStore';
import { useRuleStore } from '@/store/ruleStore';
import { useIssueStore } from '@/store/issueStore';
import { runCheck } from '@/services/checkEngine';
import { useState } from 'react';
import Button from '@/components/ui/Button';

export default function Header() {
  const { products } = useProductStore();
  const { rules } = useRuleStore();
  const { setIssues, setHasChecked } = useIssueStore();
  const [isChecking, setIsChecking] = useState(false);

  const handleRunCheck = () => {
    setIsChecking(true);
    setTimeout(() => {
      const result = runCheck(products, rules);
      setIssues(result.issues);
      setHasChecked(true);
      setIsChecking(false);
    }, 800);
  };

  return (
    <header className="h-16 bg-white/80 backdrop-blur-sm border-b border-gray-100 sticky top-0 z-30">
      <div className="h-full px-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="搜索商品、问题..."
              className="w-80 h-9 pl-10 pr-4 rounded-lg border border-gray-200 bg-gray-50/50 text-sm text-gray-700 placeholder:text-gray-400 focus:bg-white focus:border-primary-300 focus:ring-2 focus:ring-primary-500/20 focus:outline-none transition-all"
            />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="primary"
            size="md"
            onClick={handleRunCheck}
            loading={isChecking}
          >
            <Play className="w-4 h-4" />
            开始检查
          </Button>

          <div className="h-6 w-px bg-gray-200" />

          <button className="relative p-2 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors">
            <Bell className="w-5 h-5" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-danger-500 rounded-full" />
          </button>

          <div className="flex items-center gap-3 pl-2">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white text-sm font-medium">
              运
            </div>
            <div className="hidden md:block">
              <p className="text-sm font-medium text-gray-900">运营小王</p>
              <p className="text-xs text-gray-500">商品运营组</p>
            </div>
            <ChevronDown className="w-4 h-4 text-gray-400" />
          </div>
        </div>
      </div>
    </header>
  );
}
