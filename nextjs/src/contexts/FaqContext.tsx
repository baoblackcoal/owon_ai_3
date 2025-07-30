'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import type { 
  FaqQuestion, 
  FaqFilters,
  FaqFiltersResponse 
} from '@/types/faq';
import { fetchFaqQuestions, createDefaultFilters } from '@/lib/faq-utils';
import { useDebounce } from '@/hooks/useDebounce';

interface FaqContextValue {
  // 状态
  questions: FaqQuestion[];
  loading: boolean;
  filters: FaqFilters;
  filterData: FaqFiltersResponse;
  
  // 操作
  setFilters: (filters: FaqFilters) => void;
  updateFilter: (key: keyof FaqFilters, value: FaqFilters[keyof FaqFilters]) => void;
  clearAllFilters: () => void;
  refreshQuestions: () => Promise<void>;
  // 滚动位置管理
  saveScrollPosition: () => void;
  restoreScrollPosition: () => void;
}

const FaqContext = createContext<FaqContextValue | undefined>(undefined);

interface FaqProviderProps {
  children: ReactNode;
  initialFilters?: FaqFilters;
}

export function FaqProvider({ children, initialFilters }: FaqProviderProps) {
  const [questions, setQuestions] = useState<FaqQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<FaqFilters>(
    initialFilters || createDefaultFilters()
  );

  // 客户端挂载后同步本地存储中的视图模式，避免与服务端初始渲染不一致
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedViewMode = localStorage.getItem('faq-view-mode');
      if (savedViewMode === 'card' || savedViewMode === 'list') {
        setFilters(prev => ({ ...prev, viewMode: savedViewMode as 'card' | 'list' }));
      }
    }
      }, []);
  const [filterData, setFilterData] = useState<FaqFiltersResponse>({
    categories: [],
    product_models: [],
    tags: []
  });

  // 使用防抖处理搜索
  const debouncedSearch = useDebounce(filters.search, 300);

  // 获取筛选器数据
  useEffect(() => {
    fetch('/api/faq/filters')
      .then(res => res.json())
      .then(data => setFilterData(data as FaqFiltersResponse))
      .catch(err => console.error('Failed to fetch filters:', err));
  }, []);

  // 获取问题列表
  const refreshQuestions = useCallback(async () => {
    setLoading(true);
    try {
      const searchFilters = { ...filters, search: debouncedSearch };
      const data = await fetchFaqQuestions(searchFilters);
      setQuestions(data.data || []);
    } catch (error) {
      console.error('Failed to fetch questions:', error);
      setQuestions([]);
    } finally {
      setLoading(false);
    }
  }, [filters, debouncedSearch]);

  useEffect(() => {
    refreshQuestions();
  }, [refreshQuestions]);

  // 保存viewMode到localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('faq-view-mode', filters.viewMode);
    }
  }, [filters.viewMode]);

  // 更新单个筛选条件
  const updateFilter = (key: keyof FaqFilters, value: FaqFilters[keyof FaqFilters]) => {
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
    setFilters(createDefaultFilters());
  };

  // 保存滚动位置
  const saveScrollPosition = () => {
    const scrollY = window.scrollY;
    sessionStorage.setItem('faq-scroll-position', scrollY.toString());
  };

  // 恢复滚动位置
  const restoreScrollPosition = () => {
    const savedPosition = sessionStorage.getItem('faq-scroll-position');
    if (savedPosition) {
      // 延迟恢复，确保DOM完全渲染
      setTimeout(() => {
        window.scrollTo(0, parseInt(savedPosition, 10));
      }, 100);
    }
  };

  // 当筛选条件或数据加载完成时，保存当前状态
  useEffect(() => {
    if (!loading) {
      // 更新保存的筛选条件
      const currentFilters = { ...filters, search: debouncedSearch };
      sessionStorage.setItem('faq-filters', JSON.stringify(currentFilters));
    }
  }, [filters, debouncedSearch, loading]);

  const value: FaqContextValue = {
    questions,
    loading,
    filters,
    filterData,
    setFilters,
    updateFilter,
    clearAllFilters,
    refreshQuestions,
    saveScrollPosition,
    restoreScrollPosition,
  };

  return (
    <FaqContext.Provider value={value}>
      {children}
    </FaqContext.Provider>
  );
}

export function useFaq() {
  const context = useContext(FaqContext);
  if (context === undefined) {
    throw new Error('useFaq must be used within a FaqProvider');
  }
  return context;
} 