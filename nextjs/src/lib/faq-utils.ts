import type { FaqFilters, FaqListResponse } from '@/types/faq';

/**
 * 构建FAQ API查询参数
 */
export function buildFaqQueryParams(filters: FaqFilters): URLSearchParams {
  const params = new URLSearchParams();
  
  if (filters.search) params.set('q', filters.search);
  if (filters.categoryId) params.set('category_id', filters.categoryId);
  if (filters.productModelId) params.set('product_model_id', filters.productModelId);
  if (filters.tagId) params.set('tag_id', filters.tagId);
  params.set('sort', filters.sortBy);
  if (filters.sortBy === 'ranking') params.set('period', filters.period);
  
  return params;
}

/**
 * 获取FAQ问题列表
 */
export async function fetchFaqQuestions(filters: FaqFilters): Promise<FaqListResponse> {
  const params = buildFaqQueryParams(filters);
  const response = await fetch(`/api/faq?${params}`);
  
  if (!response.ok) {
    throw new Error('Failed to fetch FAQ questions');
  }
  
  return response.json();
}

/**
 * 格式化时间
 */
export function formatTime(timeStr: string): string {
  const date = new Date(timeStr);
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

/**
 * 检查是否有活跃的筛选条件
 */
export function hasActiveFilters(filters: FaqFilters): boolean {
  return !!(filters.search || filters.categoryId || filters.productModelId || filters.tagId);
}

/**
 * 创建默认的筛选条件
 */
export function createDefaultFilters(): FaqFilters {
  return {
    search: '',
    categoryId: undefined,
    productModelId: undefined,
    tagId: undefined,
    sortBy: 'latest',
    period: 'all'
  };
}

/**
 * 从URL参数初始化筛选条件
 */
export function initFiltersFromParams(searchParams: URLSearchParams): FaqFilters {
  return {
    search: searchParams.get('q') || '',
    categoryId: searchParams.get('category_id') || undefined,
    productModelId: searchParams.get('product_model_id') || undefined,
    tagId: searchParams.get('tag_id') || undefined,
    sortBy: (searchParams.get('sort') as any) || 'latest',
    period: (searchParams.get('period') as any) || 'all'
  };
} 