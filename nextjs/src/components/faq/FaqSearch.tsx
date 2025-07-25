'use client';

import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useFaq } from '@/contexts/FaqContext';
import { useDebounce } from '@/hooks/useDebounce';
import { useEffect } from 'react';

export default function FaqSearch() {
  const { filters, updateFilter } = useFaq();
  const debouncedSearch = useDebounce(filters.search, 300);

  return (
    <div className="relative w-full">
      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
      <Input
        type="text"
        placeholder="搜索问题、内容或标签..."
        value={filters.search}
        onChange={(e) => updateFilter('search', e.target.value)}
        className="pl-10 h-10 text-sm w-full"
      />
    </div>
  );
} 