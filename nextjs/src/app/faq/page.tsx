'use client';

import { useState, useMemo, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
} from '@/components/ui/command';
import { Skeleton } from '@/components/ui/skeleton';
import { ChevronDown, Check, X, Search, Eye, ThumbsUp, FileQuestion } from 'lucide-react';
import { useDebounce } from '@/hooks/useDebounce';
import type { 
  FaqQuestion, 
  FaqCategory, 
  FaqProductModel, 
  FaqTag, 
  FaqFilters,
  FaqFiltersResponse,
  FaqListResponse 
} from '@/types/faq';

export default function FaqPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // 状态管理
  const [questions, setQuestions] = useState<FaqQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<FaqFilters>({
    search: searchParams.get('q') || '',
    categoryId: searchParams.get('category_id') || undefined,
    productModelId: searchParams.get('product_model_id') || undefined,
    tagId: searchParams.get('tag_id') || undefined,
    sortBy: (searchParams.get('sort') as any) || 'latest',
    period: (searchParams.get('period') as any) || 'all'
  });
  
  const [filterData, setFilterData] = useState<FaqFiltersResponse>({
    categories: [],
    product_models: [],
    tags: []
  });
  
  const [tagSearchOpen, setTagSearchOpen] = useState(false);
  const debouncedSearch = useDebounce(filters.search, 300);

  // 获取筛选器数据
  useEffect(() => {
    fetch('/api/faq/filters')
      .then(res => res.json())
      .then(data => setFilterData(data as FaqFiltersResponse))
      .catch(err => console.error('Failed to fetch filters:', err));
  }, []);

  // 获取问题列表
  useEffect(() => {
    const fetchQuestions = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (debouncedSearch) params.set('q', debouncedSearch);
        if (filters.categoryId) params.set('category_id', filters.categoryId);
        if (filters.productModelId) params.set('product_model_id', filters.productModelId);
        if (filters.tagId) params.set('tag_id', filters.tagId);
        params.set('sort', filters.sortBy);
        if (filters.sortBy === 'ranking') params.set('period', filters.period);
        
        const response = await fetch(`/api/faq?${params}`);
        const data: FaqListResponse = await response.json();
        setQuestions(data.data || []);
      } catch (error) {
        console.error('Failed to fetch questions:', error);
        setQuestions([]);
      } finally {
        setLoading(false);
      }
    };

    fetchQuestions();
  }, [debouncedSearch, filters.categoryId, filters.productModelId, filters.tagId, filters.sortBy, filters.period]);

  // 获取选中项的名称
  const selectedCategoryName = filters.categoryId 
    ? filterData.categories.find(cat => cat.id === filters.categoryId)?.name || '全部分类'
    : '全部分类';

  const selectedModelName = filters.productModelId 
    ? filterData.product_models.find(model => model.id === filters.productModelId)?.name || '全部机型'
    : '全部机型';

  const selectedTagName = filters.tagId
    ? filterData.tags.find(tag => tag.id === filters.tagId)?.name || '选择标签'
    : '选择标签';

  // 获取当前分类下的机型列表
  const availableModels = filters.categoryId
    ? filterData.product_models.filter(model => model.category_id === filters.categoryId)
    : filterData.product_models;

  // 处理筛选器变更
  const handleFilterChange = (key: keyof FaqFilters, value: any) => {
    setFilters(prev => {
      const newFilters = { ...prev, [key]: value };
      
      // 分类变更时重置机型
      if (key === 'categoryId') {
        newFilters.productModelId = undefined;
      }
      
      return newFilters;
    });
  };

  // 清除所有筛选条件
  const clearAllFilters = () => {
    setFilters({
      search: '',
      categoryId: undefined,
      productModelId: undefined,
      tagId: undefined,
      sortBy: 'latest',
      period: 'all'
    });
  };

  // 跳转到详情页
  const handleQuestionClick = (questionId: string) => {
    router.push(`/faq/${questionId}`);
  };

  // 格式化时间
  const formatTime = (timeStr: string) => {
    const date = new Date(timeStr);
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const hasActiveFilters = filters.search || filters.categoryId || filters.productModelId || filters.tagId;

  if (loading) {
    return (
      <div className="container mx-auto px-8 py-4 max-w-7xl">
        <div className="mb-4">
          <Skeleton className="h-10 w-96 mb-2" />
          <Skeleton className="h-6 w-72" />
        </div>
        <div className="mb-4 space-y-3">
          <Skeleton className="h-10 w-full max-w-2xl" />
          <Skeleton className="h-20 w-full" />
        </div>
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-8 py-4 max-w-7xl">
      {/* 页面标题区域 */}
      <div className="mb-4">
        <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
          OWON AI 助手 - 问答集
        </h1>
        <p className="text-base text-muted-foreground">
          汇总、分类并展示所有高质量的问答内容，快速找到技术解决方案和产品信息
        </p>
      </div>

      {/* 搜索和过滤器区域 */}
      <div className="mb-4 space-y-3">
        {/* 搜索框 */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            type="text"
            placeholder="搜索问题、内容或标签..."
            value={filters.search}
            onChange={(e) => handleFilterChange('search', e.target.value)}
            className="pl-10 h-10 text-sm w-full max-w-2xl"
          />
        </div>

        {/* 筛选条件区域 */}
        <div className="bg-muted/30 rounded-lg p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">筛选条件</h3>
            <div className="text-xs text-muted-foreground">
              找到 <span className="font-medium text-foreground">{questions.length}</span> 个问题
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
            {/* 分类过滤 */}
            <div className="space-y-1 md:col-span-2">
              <label className="text-xs font-medium text-foreground">分类</label>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="w-full justify-between h-8 text-xs">
                    {selectedCategoryName}
                    <ChevronDown className="ml-2 h-3 w-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-full">
                  <DropdownMenuItem onClick={() => handleFilterChange('categoryId', undefined)}>
                    全部分类
                  </DropdownMenuItem>
                  {filterData.categories.map((category) => (
                    <DropdownMenuItem
                      key={category.id}
                      onClick={() => handleFilterChange('categoryId', category.id)}
                    >
                      {category.name}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* 机型过滤 */}
            <div className="space-y-1 md:col-span-2">
              <label className="text-xs font-medium text-foreground">机型</label>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="outline" 
                    className="w-full justify-between h-8 text-xs"
                    disabled={!filters.categoryId}
                  >
                    {selectedModelName}
                    <ChevronDown className="ml-2 h-3 w-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-full">
                  <DropdownMenuItem onClick={() => handleFilterChange('productModelId', undefined)}>
                    全部机型
                  </DropdownMenuItem>
                  {availableModels.map((model) => (
                    <DropdownMenuItem
                      key={model.id}
                      onClick={() => handleFilterChange('productModelId', model.id)}
                    >
                      {model.name}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* 标签过滤 */}
            <div className="space-y-1 md:col-span-2">
              <label className="text-xs font-medium text-foreground">标签</label>
              <Popover open={tagSearchOpen} onOpenChange={setTagSearchOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={tagSearchOpen}
                    className="w-full justify-between h-8 text-xs"
                  >
                    {selectedTagName}
                    <ChevronDown className="ml-2 h-3 w-3" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0" align="start">
                  <Command>
                    <CommandInput placeholder="搜索标签..." />
                    <CommandEmpty>没有找到相关标签</CommandEmpty>
                    <CommandGroup className="max-h-48 overflow-y-auto">
                      {filterData.tags.map((tag) => (
                        <CommandItem
                          key={tag.id}
                          value={tag.name}
                          onSelect={() => {
                            handleFilterChange('tagId', tag.id);
                            setTagSearchOpen(false);
                          }}
                        >
                          <Check
                            className={`mr-2 h-4 w-4 ${
                              filters.tagId === tag.id ? "opacity-100" : "opacity-0"
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

            {/* 排序和清除按钮 */}
            <div className="space-y-1 md:col-span-6">
              <label className="text-xs font-medium text-foreground">排序</label>
              <div className="flex gap-1">
                <Tabs 
                  value={filters.sortBy} 
                  onValueChange={(value) => handleFilterChange('sortBy', value as any)} 
                  className="flex-1"
                >
                  <TabsList className="grid grid-cols-4 h-8 text-xs gap-2">
                    <TabsTrigger value="latest" className="text-xs px-2">最新</TabsTrigger>
                    <TabsTrigger value="best" className="text-xs px-2">最佳</TabsTrigger>
                    <TabsTrigger value="ranking" className="text-xs px-2">排行</TabsTrigger>
                    <TabsTrigger value="my-share" className="text-xs px-2">我的分享</TabsTrigger>
                  </TabsList>
                </Tabs>
                {hasActiveFilters && (
                  <Button 
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

          {/* 时间范围选择器 */}
          {filters.sortBy === 'ranking' && (
            <div className="flex items-center gap-2 pt-2 border-t">
              <span className="text-xs font-medium">时间范围:</span>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="h-7 text-xs min-w-[80px]">
                    {filters.period === 'week' && '本周'}
                    {filters.period === 'month' && '本月'}
                    {filters.period === 'quarter' && '本季度'}
                    {filters.period === 'year' && '本年'}
                    {filters.period === 'all' && '总排行'}
                    <ChevronDown className="ml-1 h-3 w-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={() => handleFilterChange('period', 'week')}>本周</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleFilterChange('period', 'month')}>本月</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleFilterChange('period', 'quarter')}>本季度</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleFilterChange('period', 'year')}>本年</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleFilterChange('period', 'all')}>总排行</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}
        </div>
      </div>

      {/* 问题列表 */}
      <div className="space-y-4">
        {questions.length === 0 ? (
          <div className="text-center py-12">
            <FileQuestion className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">未找到相关问题</h3>
            <p className="text-muted-foreground">尝试调整搜索条件或筛选器</p>
          </div>
        ) : (
          questions.map((question) => (
            <div
              key={question.id}
              className="bg-card rounded-lg p-4 border hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => handleQuestionClick(question.id)}
            >
              <div className="space-y-3">
                {/* 标题 */}
                <h3 className="text-lg font-medium text-foreground line-clamp-2">
                  {question.title}
                </h3>
                
                {/* 内容预览 */}
                <p className="text-sm text-muted-foreground line-clamp-3">
                  {question.content}
                </p>
                
                {/* 标签 */}
                <div className="flex flex-wrap gap-2">
                  {question.category && (
                    <Badge variant="secondary" className="text-xs">
                      {question.category.name}
                    </Badge>
                  )}
                  {question.product_model && (
                    <Badge variant="outline" className="text-xs">
                      {question.product_model.name}
                    </Badge>
                  )}
                  {question.tags?.map((tag) => (
                    <Badge key={tag.id} variant="outline" className="text-xs">
                      {tag.name}
                    </Badge>
                  ))}
                </div>
                
                {/* 底部指标和时间 */}
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1">
                      <Eye className="h-3 w-3" />
                      <span>{question.views_count}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <ThumbsUp className="h-3 w-3" />
                      <span>{question.likes_count}</span>
                    </div>
                  </div>
                  <span>最后更新: {formatTime(question.updated_at)}</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}