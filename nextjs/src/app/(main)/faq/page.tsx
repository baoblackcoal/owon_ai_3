'use client';

import { useSearchParams } from 'next/navigation';
import { useState, useEffect, Suspense } from 'react';
import { Search } from 'lucide-react';
import { FaqProvider, useFaq } from '@/contexts/FaqContext';
import { initFiltersFromParams } from '@/lib/faq-utils';
import FaqHeader from '@/components/faq/FaqHeader';
import FaqSearch from '@/components/faq/FaqSearch';
import FaqFilters from '@/components/faq/FaqFilters';
import FaqQuestionList from '@/components/faq/FaqQuestionList';
import { Button } from '@/components/ui/button';
import { useUI } from '@/contexts/UIContext';

function FaqPageContent() {
  const [showSearch, setShowSearch] = useState(false);
  const { deviceType } = useUI();
  const { loading, restoreScrollPosition } = useFaq();

  // 当数据加载完成后恢复滚动位置
  useEffect(() => {
    if (!loading) {
      restoreScrollPosition();
    }
  }, [loading, restoreScrollPosition]);

  return (
    <div className={`
      flex flex-col h-full overflow-auto
      ${deviceType === 'desktop' ? 'max-w-4xl mx-auto w-full' : ''}
      ${deviceType === 'mobile' ? 'w-full' : ''}
      px-4
    `}>
      {/* 页面标题区域 */}
      <div className="flex items-center justify-between">
        <FaqHeader />
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setShowSearch(!showSearch)}
          className="ml-2"
        >
          <Search className="h-10 w-10" />
        </Button>
      </div>

      {/* 搜索和过滤器区域 */}
      <div className="mb-4 space-y-3">
        {/* 搜索框 */}
        {showSearch && <FaqSearch />}

        {/* 筛选条件区域 */}
        <FaqFilters />
      </div>

      {/* 问题列表 */}
      <FaqQuestionList />
    </div>
  );
}

function FaqPageWithParams() {
  const searchParams = useSearchParams();
  const initialFilters = initFiltersFromParams(searchParams);

  return (
    <FaqProvider initialFilters={initialFilters}>
      <FaqPageContent />
    </FaqProvider>
  );
}

export default function FaqPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-64">加载中...</div>}>
      <FaqPageWithParams />
    </Suspense>
  );
} 