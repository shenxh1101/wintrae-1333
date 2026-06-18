import { useState } from 'react';
import {
  Settings,
  Type,
  Image,
  DollarSign,
  Package,
  FileText,
  AlertTriangle,
  CheckSquare,
  Plus,
  X,
  Save,
  RotateCcw,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Switch from '@/components/ui/Switch';
import Input from '@/components/ui/Input';
import Badge from '@/components/ui/Badge';
import { useRuleStore } from '@/store/ruleStore';
import { REQUIRED_FIELD_OPTIONS } from '@/types/rule';
import { cn } from '@/lib/utils';

const platformIcons: Record<string, string> = {
  taobao: '🛒',
  jd: '📦',
  pdd: '🎯',
  douyin: '🎵',
};

export default function RulesPage() {
  const { rules, activePlatform, setActivePlatform, getRuleByPlatform, updateRule } =
    useRuleStore();
  const [newSensitiveWord, setNewSensitiveWord] = useState('');

  const currentRule = getRuleByPlatform(activePlatform);

  if (!currentRule) return null;

  const handleUpdate = <K extends keyof typeof currentRule>(
    key: K,
    value: (typeof currentRule)[K]
  ) => {
    updateRule(activePlatform, { [key]: value });
  };

  const handleNestedUpdate = (
    group: keyof typeof currentRule,
    key: string,
    value: any
  ) => {
    const groupData = currentRule[group] as Record<string, any>;
    updateRule(activePlatform, {
      [group]: { ...groupData, [key]: value },
    } as Partial<typeof currentRule>);
  };

  const handleAddSensitiveWord = () => {
    if (!newSensitiveWord.trim()) return;
    if (currentRule.sensitiveWords.includes(newSensitiveWord.trim())) {
      setNewSensitiveWord('');
      return;
    }
    updateRule(activePlatform, {
      sensitiveWords: [...currentRule.sensitiveWords, newSensitiveWord.trim()],
    });
    setNewSensitiveWord('');
  };

  const handleRemoveSensitiveWord = (word: string) => {
    updateRule(activePlatform, {
      sensitiveWords: currentRule.sensitiveWords.filter((w) => w !== word),
    });
  };

  const handleToggleRequiredField = (field: string) => {
    const hasField = currentRule.requiredFields.includes(field);
    updateRule(activePlatform, {
      requiredFields: hasField
        ? currentRule.requiredFields.filter((f) => f !== field)
        : [...currentRule.requiredFields, field],
    });
  };

  const ruleSections = [
    {
      title: '标题规则',
      icon: Type,
      key: 'titleRule',
      enabled: currentRule.titleRule.enabled,
      onToggle: (v: boolean) => handleNestedUpdate('titleRule', 'enabled', v),
      fields: [
        {
          label: '最少字数',
          key: 'minLength',
          value: currentRule.titleRule.minLength,
          type: 'number',
        },
        {
          label: '最多字数',
          key: 'maxLength',
          value: currentRule.titleRule.maxLength,
          type: 'number',
        },
        {
          label: '检查重复',
          key: 'checkDuplicate',
          value: currentRule.titleRule.checkDuplicate,
          type: 'switch',
        },
      ],
    },
    {
      title: '卖点规则',
      icon: FileText,
      key: 'sellingPointRule',
      enabled: currentRule.sellingPointRule.enabled,
      onToggle: (v: boolean) => handleNestedUpdate('sellingPointRule', 'enabled', v),
      fields: [
        {
          label: '最少数量',
          key: 'minCount',
          value: currentRule.sellingPointRule.minCount,
          type: 'number',
        },
        {
          label: '最多数量',
          key: 'maxCount',
          value: currentRule.sellingPointRule.maxCount,
          type: 'number',
        },
        {
          label: '单条最大字数',
          key: 'maxLengthPerPoint',
          value: currentRule.sellingPointRule.maxLengthPerPoint,
          type: 'number',
        },
      ],
    },
    {
      title: '图片规则',
      icon: Image,
      key: 'imageRule',
      enabled: currentRule.imageRule.enabled,
      onToggle: (v: boolean) => handleNestedUpdate('imageRule', 'enabled', v),
      fields: [
        {
          label: '最少主图',
          key: 'minMainImages',
          value: currentRule.imageRule.minMainImages,
          type: 'number',
        },
        {
          label: '最多主图',
          key: 'maxMainImages',
          value: currentRule.imageRule.maxMainImages,
          type: 'number',
        },
        {
          label: '检查命名规范',
          key: 'checkNaming',
          value: currentRule.imageRule.checkNaming,
          type: 'switch',
        },
      ],
    },
    {
      title: '价格规则',
      icon: DollarSign,
      key: 'priceRule',
      enabled: currentRule.priceRule.enabled,
      onToggle: (v: boolean) => handleNestedUpdate('priceRule', 'enabled', v),
      fields: [
        {
          label: '最低价格',
          key: 'minPrice',
          value: currentRule.priceRule.minPrice,
          type: 'number',
        },
        {
          label: '最高价格',
          key: 'maxPrice',
          value: currentRule.priceRule.maxPrice,
          type: 'number',
        },
        {
          label: '检查异常价格',
          key: 'checkAbnormal',
          value: currentRule.priceRule.checkAbnormal,
          type: 'switch',
        },
        {
          label: '异常阈值',
          key: 'abnormalThreshold',
          value: currentRule.priceRule.abnormalThreshold,
          type: 'number',
          condition: currentRule.priceRule.checkAbnormal,
        },
      ],
    },
    {
      title: '库存规则',
      icon: Package,
      key: 'stockRule',
      enabled: currentRule.stockRule.enabled,
      onToggle: (v: boolean) => handleNestedUpdate('stockRule', 'enabled', v),
      fields: [
        {
          label: '最低库存预警',
          key: 'minStock',
          value: currentRule.stockRule.minStock,
          type: 'number',
        },
        {
          label: '检查零库存',
          key: 'checkZeroStock',
          value: currentRule.stockRule.checkZeroStock,
          type: 'switch',
        },
      ],
    },
    {
      title: '详情规则',
      icon: FileText,
      key: 'descriptionRule',
      enabled: currentRule.descriptionRule.enabled,
      onToggle: (v: boolean) => handleNestedUpdate('descriptionRule', 'enabled', v),
      fields: [
        {
          label: '最少段落数',
          key: 'minParagraphs',
          value: currentRule.descriptionRule.minParagraphs,
          type: 'number',
        },
        {
          label: '最少字数',
          key: 'minLength',
          value: currentRule.descriptionRule.minLength,
          type: 'number',
        },
      ],
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">规则配置</h1>
          <p className="text-sm text-gray-500 mt-1">
            配置各平台商品资料的检查规则
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="md">
            <RotateCcw className="w-4 h-4" />
            恢复默认
          </Button>
          <Button variant="primary" size="md">
            <Save className="w-4 h-4" />
            保存配置
          </Button>
        </div>
      </div>

      <div className="flex gap-5">
        <div className="w-56 flex-shrink-0 space-y-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">选择平台</CardTitle>
            </CardHeader>
            <CardContent className="p-2">
              <div className="space-y-1">
                {rules.map((rule) => (
                  <button
                    key={rule.platform}
                    onClick={() => setActivePlatform(rule.platform)}
                    className={cn(
                      'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors',
                      activePlatform === rule.platform
                        ? 'bg-primary-50 text-primary-700'
                        : 'hover:bg-gray-50 text-gray-700'
                    )}
                  >
                    <span className="text-xl">{platformIcons[rule.platform] || '📦'}</span>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{rule.platformName}</p>
                      <p className="text-xs text-gray-500">
                        {rule.enabled ? '已启用' : '已禁用'}
                      </p>
                    </div>
                    <div
                      className={cn(
                        'w-2 h-2 rounded-full',
                        rule.enabled ? 'bg-success-500' : 'bg-gray-300'
                      )}
                    />
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-gray-900">启用规则</span>
                <Switch
                  checked={currentRule.enabled}
                  onChange={(checked) => handleUpdate('enabled', checked)}
                />
              </div>
              <p className="text-xs text-gray-500">
                关闭后该平台的所有检查规则将不生效
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="flex-1 space-y-5">
          <div className="grid grid-cols-2 gap-5">
            {ruleSections.map((section) => {
              const Icon = section.icon;
              return (
                <Card key={section.key}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div
                          className={cn(
                            'w-10 h-10 rounded-xl flex items-center justify-center',
                            section.enabled
                              ? 'bg-primary-100 text-primary-600'
                              : 'bg-gray-100 text-gray-400'
                          )}
                        >
                          <Icon className="w-5 h-5" />
                        </div>
                        <CardTitle className="text-base">{section.title}</CardTitle>
                      </div>
                      <Switch checked={section.enabled} onChange={section.onToggle} />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div
                      className={cn(
                        'space-y-4 transition-opacity duration-200',
                        !section.enabled && 'opacity-50 pointer-events-none'
                      )}
                    >
                      {section.fields.map((field) => {
                        if (field.condition === false) return null;
                        return (
                          <div
                            key={field.key}
                            className="flex items-center justify-between"
                          >
                            <label className="text-sm text-gray-600">{field.label}</label>
                            {field.type === 'switch' ? (
                              <Switch
                                checked={field.value as boolean}
                                onChange={(checked) =>
                                  handleNestedUpdate(
                                    section.key as any,
                                    field.key,
                                    checked
                                  )
                                }
                              />
                            ) : (
                              <input
                                type="number"
                                value={field.value as number}
                                onChange={(e) =>
                                  handleNestedUpdate(
                                    section.key as any,
                                    field.key,
                                    Number(e.target.value)
                                  )
                                }
                                className="w-24 h-9 px-3 rounded-lg border border-gray-300 text-sm text-right focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 focus:outline-none"
                              />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-danger-100 flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-danger-600" />
                </div>
                <div>
                  <CardTitle>禁用词 / 敏感词</CardTitle>
                  <CardDescription>
                    检测到以下词汇将标记为违规内容
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex gap-3 mb-4">
                <Input
                  placeholder="输入敏感词，按回车添加"
                  value={newSensitiveWord}
                  onChange={(e) => setNewSensitiveWord(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddSensitiveWord();
                    }
                  }}
                  className="flex-1"
                />
                <Button variant="primary" onClick={handleAddSensitiveWord}>
                  <Plus className="w-4 h-4" />
                  添加
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {currentRule.sensitiveWords.length > 0 ? (
                  currentRule.sensitiveWords.map((word) => (
                    <span
                      key={word}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-sm group hover:bg-gray-200 transition-colors"
                    >
                      {word}
                      <button
                        onClick={() => handleRemoveSensitiveWord(word)}
                        className="p-0.5 rounded opacity-60 group-hover:opacity-100 hover:bg-gray-300 transition-opacity"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))
                ) : (
                  <p className="text-sm text-gray-400">暂无敏感词，添加后将自动检测</p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-success-100 flex items-center justify-center">
                  <CheckSquare className="w-5 h-5 text-success-600" />
                </div>
                <div>
                  <CardTitle>必填项设置</CardTitle>
                  <CardDescription>
                    勾选的字段为必填项，为空时将触发警告
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-4 gap-3">
                {REQUIRED_FIELD_OPTIONS.map((option) => {
                  const isChecked = currentRule.requiredFields.includes(option.value);
                  return (
                    <button
                      key={option.value}
                      onClick={() => handleToggleRequiredField(option.value)}
                      className={cn(
                        'p-3 rounded-lg border text-left transition-all duration-150',
                        isChecked
                          ? 'border-primary-500 bg-primary-50 text-primary-700'
                          : 'border-gray-200 hover:border-gray-300 text-gray-700'
                      )}
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className={cn(
                            'w-5 h-5 rounded border-2 flex items-center justify-center transition-colors',
                            isChecked
                              ? 'border-primary-500 bg-primary-500'
                              : 'border-gray-300'
                          )}
                        >
                          {isChecked && (
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
                        <span className="text-sm font-medium">{option.label}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
