'use client';

import { useState, useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ChevronDown, Check, X, Search } from 'lucide-react';
import { questions, categories, productModels, tags, getModelsByCategory } from './mockData';
import { QuestionCard } from './components/QuestionCard';
import { Question, QAFilters } from './types';

export default function QACollectionPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [selectedModel, setSelectedModel] = useState<number | null>(null);
  const [selectedTags, setSelectedTags] = useState<number[]>([]);
  const [sortBy, setSortBy] = useState<QAFilters['sortBy']>('latest');
  const [period, setPeriod] = useState<QAFilters['period']>('all');
  const [tagSearchOpen, setTagSearchOpen] = useState(false);
  
  console.log('问题数量:', questions.length); // 控制台测试输出

  // 获取选中分类的名称
  const selectedCategoryName = selectedCategory 
    ? categories.find(cat => cat.id === selectedCategory)?.name 
    : '全部分类';

  // 获取选中机型的名称
  const selectedModelName = selectedModel 
    ? productModels.find(model => model.id === selectedModel)?.name 
    : '全部机型';

  // 获取当前分类下的机型列表
  const availableModels = getModelsByCategory(selectedCategory);

  // 当分类改变时，重置机型选择
  const handleCategoryChange = (categoryId: number | null) => {
    setSelectedCategory(categoryId);
    setSelectedModel(null); // 重置机型选择
  };

  // 标签选择处理
  const handleTagToggle = (tagId: number) => {
    setSelectedTags(prev => 
      prev.includes(tagId) 
        ? prev.filter(id => id !== tagId)
        : [...prev, tagId]
    );
  };

  // 搜索和过滤逻辑
  const filteredQuestions = useMemo(() => {
    let result = questions;

    // 搜索过滤
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase();
      
      result = result.filter((question) => {
        // 搜索标题
        if (question.title.toLowerCase().includes(searchLower)) {
          return true;
        }
        
        // 搜索内容
        if (question.content.toLowerCase().includes(searchLower)) {
          return true;
        }
        
        // 搜索标签
        if (question.tags.some(tag => tag.name.toLowerCase().includes(searchLower))) {
          return true;
        }
        
        return false;
      });
    }

    // 分类过滤
    if (selectedCategory) {
      result = result.filter(question => question.category_id === selectedCategory);
    }

    // 机型过滤
    if (selectedModel) {
      result = result.filter(question => question.product_model_id === selectedModel);
    }

    // 标签过滤 (单选模式)
    if (selectedTags.length > 0) {
      result = result.filter(question => 
        question.tags.some(tag => tag.id === selectedTags[0])
      );
    }

    // 排序和特殊过滤
    switch (sortBy) {
      case 'latest':
        result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        break;
      case 'best':
        result.sort((a, b) => b.likes_count - a.likes_count);
        break;
      case 'ranking':
        // 时间范围过滤（仅在排行模式下生效）
        if (period !== 'all') {
          const now = new Date();
          let timeLimit: Date;
          
          switch (period) {
            case 'week':
              timeLimit = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
              break;
            case 'month':
              timeLimit = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
              break;
            case 'quarter':
              timeLimit = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
              break;
            case 'year':
              timeLimit = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
              break;
            default:
              timeLimit = new Date(0);
          }
          
          result = result.filter(question => 
            new Date(question.created_at) >= timeLimit
          );
        }
        result.sort((a, b) => b.views_count - a.views_count);
        break;
      case 'my-share':
        // 假设当前用户ID为 'user123'
        const currentUserId = 'user123';
        result = result.filter(question => 
          question.user_id === currentUserId && question.is_shared
        );
        result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        break;
    }

    return result;
  }, [searchTerm, selectedCategory, selectedModel, selectedTags, sortBy, period]);

  // 清除所有筛选条件
  const clearAllFilters = () => {
    setSearchTerm('');
    setSelectedCategory(null);
    setSelectedModel(null);
    setSelectedTags([]);
  };

  return (
    <div className="container mx-auto px-8 py-4 max-w-7xl">
      {/* 页面标题区域 - 紧凑化 */}
      <div className="mb-4">
        <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
          OWON AI 助手 - 问答集
        </h1>
        <p className="text-base text-muted-foreground">
          汇总、分类并展示所有高质量的问答内容，快速找到技术解决方案和产品信息
        </p>
      </div>

      {/* 搜索和过滤器整合区域 - 紧凑化 */}
      <div className="mb-4 space-y-3">
        {/* 搜索框 - 减小高度 */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            type="text"
            placeholder="搜索问题、内容或标签..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 h-10 text-sm w-full max-w-2xl"
          />
        </div>

        {/* 过滤器区域 - 紧凑化布局 */}
        <div className="bg-muted/30 rounded-lg p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">筛选条件</h3>
            <div className="text-xs text-muted-foreground">
              找到 <span className="font-medium text-foreground">{filteredQuestions.length}</span> 个问题
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
            {/* 分类过滤 - 紧凑化 */}
            <div className="space-y-1 md:col-span-2" id="category-filter">
              <label className="text-xs font-medium text-foreground">分类</label>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="w-full justify-between h-8 text-xs">
                    {selectedCategoryName}
                    <ChevronDown className="ml-2 h-3 w-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-full">
                  <DropdownMenuItem onClick={() => handleCategoryChange(null)}>
                    全部分类
                  </DropdownMenuItem>
                  {categories.map((category) => (
                    <DropdownMenuItem
                      key={category.id}
                      onClick={() => handleCategoryChange(category.id)}
                    >
                      {category.name}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* 机型过滤 - 紧凑化 */}
            <div className="space-y-1 md:col-span-2" id="model-filter">
              <label className="text-xs font-medium text-foreground">机型</label>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="outline" 
                    className="w-full justify-between h-8 text-xs"
                    disabled={!selectedCategory}
                  >
                    {selectedModelName}
                    <ChevronDown className="ml-2 h-3 w-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-full">
                  <DropdownMenuItem onClick={() => setSelectedModel(null)}>
                    全部机型
                  </DropdownMenuItem>
                  {availableModels.map((model) => (
                    <DropdownMenuItem
                      key={model.id}
                      onClick={() => setSelectedModel(model.id)}
                    >
                      {model.name}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* 标签过滤 - 单选模式 */}
            <div className="space-y-1 md:col-span-2" id="tag-filter">
              <label className="text-xs font-medium text-foreground">标签</label>
              <Popover open={tagSearchOpen} onOpenChange={setTagSearchOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={tagSearchOpen}
                    className="w-full justify-between h-8 text-xs"
                  >
                    {selectedTags.length === 0 
                      ? '选择标签' 
                      : tags.find(tag => tag.id === selectedTags[0])?.name || '选择标签'
                    }
                    <ChevronDown className="ml-2 h-3 w-3" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0" align="start">
                  <Command>
                    <CommandInput placeholder="搜索标签..." />
                    <CommandEmpty>没有找到相关标签</CommandEmpty>
                    <CommandGroup className="max-h-48 overflow-y-auto">
                      {tags.map((tag) => (
                        <CommandItem
                          key={tag.id}
                          value={tag.name}
                          onSelect={() => {
                            // 单选模式：直接设置为当前选中的标签
                            setSelectedTags([tag.id]);
                            setTagSearchOpen(false);
                          }}
                        >
                          <Check
                            className={`mr-2 h-4 w-4 ${
                              selectedTags[0] === tag.id ? "opacity-100" : "opacity-0"
                            }`}
                          />
                          {tag.name}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>

            {/* 排序和清除按钮整合 - 新增紧凑布局 */}
            <div className="space-y-1 md:col-span-6" id="sort-filter">
              <label className="text-xs font-medium text-foreground">排序</label>
              <div className="flex gap-1">
                <Tabs value={sortBy} onValueChange={(value) => setSortBy(value as QAFilters['sortBy'])} className="flex-1">
                  <TabsList className="grid grid-cols-4 h-8 text-xs gap-2">
                    <TabsTrigger value="latest" className="text-xs px-2">最新</TabsTrigger>
                    <TabsTrigger value="best" className="text-xs px-2">最佳</TabsTrigger>
                    <TabsTrigger value="ranking" className="text-xs px-2">排行</TabsTrigger>
                    <TabsTrigger value="my-share" className="text-xs px-2">我的分享</TabsTrigger>
                  </TabsList>
                </Tabs>
                {(searchTerm || selectedCategory || selectedModel || selectedTags.length > 0) && (
                  <Button 
                    id="clear-all-filters"
                    variant="ghost" 
                    size="sm"
                    onClick={clearAllFilters}
                    className="h-8 px-2 text-xs text-muted-foreground hover:text-foreground"
                  >
                    重置
                    <X className="ml-1 h-3 w-3" />
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* 时间范围选择器整合到过滤器内 */}
          {sortBy === 'ranking' && (
            <div className="flex items-center gap-2 pt-2 border-t">
              <span className="text-xs font-medium">时间范围:</span>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="h-7 text-xs min-w-[80px]">
                    {period === 'week' && '本周'}
                    {period === 'month' && '本月'}
                    {period === 'quarter' && '本季度'}
                    {period === 'year' && '本年'}
                    {period === 'all' && '总排行'}
                    <ChevronDown className="ml-1 h-3 w-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={() => setPeriod('week')}>本周</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setPeriod('month')}>本月</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setPeriod('quarter')}>本季度</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setPeriod('year')}>本年</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setPeriod('all')}>总排行</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}
        </div>
      </div>

      {/* 问题列表 - 紧凑化间距 */}
      <div className="space-y-3">
        {filteredQuestions.length > 0 ? (
          filteredQuestions.map((question) => (
            <QuestionCard key={question.id} question={question} />
          ))
        ) : (
          <div className="text-center py-12">
            <div className="mb-4">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
                <Search className="h-6 w-6 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2">没有找到匹配的问题</h3>
              <p className="text-sm text-muted-foreground mb-4 max-w-md mx-auto">
                尝试调整搜索关键词或筛选条件，或者重置所有筛选项查看更多内容
              </p>
              <div className="flex gap-3 justify-center">
                {(searchTerm || selectedCategory || selectedModel || selectedTags.length > 0) && (
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={clearAllFilters}
                    className="px-4"
                  >
                    重置筛选
                    <X className="ml-2 h-4 w-4" />
                  </Button>
                )}
                <Button variant="default" size="sm" onClick={() => setSearchTerm('')}>
                  浏览全部问题
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 