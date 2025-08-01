'use client';

import { useState } from 'react';
import { ChevronDown, Check, X, Video, LayoutGrid, List } from 'lucide-react';
import { Button } from '@/components/ui/button';
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
import { useFaq } from '@/contexts/FaqContext';
import { hasActiveFilters } from '@/lib/faq-utils';

export default function FaqFilters() {
  const { filters, filterData, updateFilter, clearAllFilters } = useFaq();
  // 移动端和桌面端各自维护 Popover 打开状态，避免受隐藏元素影响
  const [tagSearchOpenMobile, setTagSearchOpenMobile] = useState(false);
  const [tagSearchOpenDesktop, setTagSearchOpenDesktop] = useState(false);

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

  const activeFilters = hasActiveFilters(filters);

  return (
    <div className="bg-muted/30 rounded-lg p-2 space-y-3">
      {/* <div className="flex items-center justify-between">
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">筛选条件</h3>
        <div className="text-xs text-muted-foreground">
          找到 <span className="font-medium text-foreground">{questions.length}</span> 个问题
        </div>
      </div> */}
      
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
        {/* 移动端筛选器容器 */}
        <div className="flex gap-2 md:hidden col-span-1">
          {/* 分类过滤 */}
          <div className="flex-1" id="faq-filters-category">
            <label className="text-xs font-medium text-foreground">分类</label>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="w-full justify-between h-8 text-xs">
                  {selectedCategoryName}
                  <ChevronDown className="ml-2 h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-[150px]">
                <DropdownMenuItem onClick={() => updateFilter('categoryId', undefined)}>
                  全部分类
                </DropdownMenuItem>
                {filterData.categories.map((category) => (
                  <DropdownMenuItem
                    key={category.id}
                    onClick={() => updateFilter('categoryId', category.id)}
                  >
                    {category.name}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* 机型过滤 */}
          <div className="flex-1" id="faq-filters-model">
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
              <DropdownMenuContent className="w-[150px]">
                <DropdownMenuItem onClick={() => updateFilter('productModelId', undefined)}>
                  全部机型
                </DropdownMenuItem>
                {availableModels.map((model) => (
                  <DropdownMenuItem
                    key={model.id}
                    onClick={() => updateFilter('productModelId', model.id)}
                  >
                    {model.name}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* 标签过滤 */}
          <div className="flex-1" id="faq-filters-tag">
            <label className="text-xs font-medium text-foreground">标签</label>
            <Popover open={tagSearchOpenMobile} onOpenChange={setTagSearchOpenMobile}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={tagSearchOpenMobile}
                  className="w-full justify-between h-8 text-xs"
                >
                  {selectedTagName}
                  <ChevronDown className="ml-2 h-3 w-3" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[200px] p-0" align="start">
                <Command>
                  <CommandInput placeholder="搜索标签..." />
                  <CommandEmpty>没有找到相关标签</CommandEmpty>
                  <CommandGroup className="max-h-48 overflow-y-auto">
                    {filterData.tags.map((tag) => (
                      <CommandItem
                        key={tag.id}
                        value={tag.name}
                        onSelect={() => {
                          updateFilter('tagId', tag.id);
                          setTagSearchOpenMobile(false);
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
        </div>

        {/* 桌面端筛选器 */}
        <div className="hidden md:block md:col-span-2">
          <label className="text-xs font-medium text-foreground">分类</label>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="w-full justify-between h-8 text-xs">
                {selectedCategoryName}
                <ChevronDown className="ml-2 h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-full">
              <DropdownMenuItem onClick={() => updateFilter('categoryId', undefined)}>
                全部分类
              </DropdownMenuItem>
              {filterData.categories.map((category) => (
                <DropdownMenuItem
                  key={category.id}
                  onClick={() => updateFilter('categoryId', category.id)}
                >
                  {category.name}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="hidden md:block md:col-span-2">
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
              <DropdownMenuItem onClick={() => updateFilter('productModelId', undefined)}>
                全部机型
              </DropdownMenuItem>
              {availableModels.map((model) => (
                <DropdownMenuItem
                  key={model.id}
                  onClick={() => updateFilter('productModelId', model.id)}
                >
                  {model.name}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="hidden md:block md:col-span-2">
          <label className="text-xs font-medium text-foreground">标签</label>
          {/* 桌面端 Popover 使用独立的受控状态 */}
          <Popover open={tagSearchOpenDesktop} onOpenChange={setTagSearchOpenDesktop}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={tagSearchOpenDesktop}
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
                        updateFilter('tagId', tag.id);
                        setTagSearchOpenDesktop(false);
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

        {/* 视频筛选和排序 */}
        <div className="space-y-1 md:col-span-6">
          <label className="text-xs font-medium text-foreground">排序与筛选</label>
          <div className="flex gap-1">
            <Tabs 
              value={filters.sortBy} 
              onValueChange={(value) => updateFilter('sortBy', value as 'latest' | 'best' | 'ranking' | 'my-share')} 
              className="flex-1"
            >
              <TabsList className="grid grid-cols-3 h-8 text-xs gap-2" id="faq-filters-sort-by">
                <TabsTrigger value="latest" className="text-xs px-2">最新</TabsTrigger>
                <TabsTrigger value="best" className="text-xs px-2">最佳</TabsTrigger>
                <TabsTrigger value="ranking" className="text-xs px-2">热门</TabsTrigger>
                {/* <TabsTrigger value="my-share" className="text-xs px-2">我的分享</TabsTrigger> */}
              </TabsList>
            </Tabs>
            
            <Button
              variant={filters.hasVideo ? "default" : "outline"}
              size="sm"
              onClick={() => updateFilter('hasVideo', filters.hasVideo ? undefined : true)}
              className="h-8 px-2 text-xs"
              aria-label="仅显示有视频的问题"
            >
              <Video className="h-3 w-3 mr-1" />
              视频
            </Button>
            
            {/* 视图切换按钮 */}
            <div className="flex border rounded-md">
              <Button
                variant={filters.viewMode === 'card' ? "default" : "ghost"}
                size="sm"
                onClick={() => updateFilter('viewMode', 'card')}
                className="h-8 px-2 text-xs rounded-r-none border-r"
                aria-label="卡片视图"
              >
                <LayoutGrid className="h-3 w-3" />
              </Button>
              <Button
                variant={filters.viewMode === 'list' ? "default" : "ghost"}
                size="sm"
                onClick={() => updateFilter('viewMode', 'list')}
                className="h-8 px-2 text-xs rounded-l-none"
                aria-label="列表视图"
              >
                <List className="h-3 w-3" />
              </Button>
            </div>
            
            {activeFilters && (
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
      {(filters.sortBy === 'ranking' || filters.sortBy === 'best') && (
        <div className="flex items-center gap-2 pt-2 border-t" id="faq-filters-period">
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
              <DropdownMenuItem onClick={() => updateFilter('period', 'week')}>本周</DropdownMenuItem>
              <DropdownMenuItem onClick={() => updateFilter('period', 'month')}>本月</DropdownMenuItem>
              <DropdownMenuItem onClick={() => updateFilter('period', 'quarter')}>本季度</DropdownMenuItem>
              <DropdownMenuItem onClick={() => updateFilter('period', 'year')}>本年</DropdownMenuItem>
              <DropdownMenuItem onClick={() => updateFilter('period', 'all')}>总排行</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}
    </div>
  );
} 