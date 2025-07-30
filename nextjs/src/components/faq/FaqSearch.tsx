'use client';

import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useFaq } from '@/contexts/FaqContext';
export default function FaqSearch() {
  const { filters, updateFilter } = useFaq();

  return (
    <div className="w-full transition-all duration-200 ease-in-out">
      <div className="relative w-full  mx-auto">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
        <Input
          type="text"
          placeholder="搜索问题、内容或标签..."
          value={filters.search}
          onChange={(e) => updateFilter('search', e.target.value)}
          className="pl-10 h-11 text-sm w-full shadow-sm focus:ring-2 focus:ring-primary/20"
        />
      </div>
    </div>
  );
} 