'use client';

import { useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { Search } from 'lucide-react';
import { FaqProvider } from '@/contexts/FaqContext';
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

export default function FaqPage() {
  const searchParams = useSearchParams();
  const initialFilters = initFiltersFromParams(searchParams);

  return (
    <FaqProvider initialFilters={initialFilters}>
      <FaqPageContent />
    </FaqProvider>
  );
} 