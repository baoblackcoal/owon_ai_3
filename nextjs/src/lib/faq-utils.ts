import type { FaqFilters, FaqListResponse } from '@/types/faq';

/**
 * 构建FAQ API查询参数
 */
export function buildFaqQueryParams(filters: FaqFilters): URLSearchParams {
  const params = new URLSearchParams();
  
  if (filters.search) params.set('q', filters.search);
  if (filters.categoryId) params.set('category_id', filters.categoryId.toString());
  if (filters.productModelId) params.set('product_model_id', filters.productModelId.toString());
  if (filters.tagId) params.set('tag_id', filters.tagId.toString());
  if (filters.hasVideo) params.set('has_video', 'true');
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
  return !!(filters.search || filters.categoryId || filters.productModelId || filters.tagId || filters.hasVideo);
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
    hasVideo: undefined,
    sortBy: 'latest',
    period: 'all',
    viewMode: 'card' // 默认卡片视图
  };
}

/**
 * 从URL参数初始化筛选条件
 */
export function initFiltersFromParams(searchParams: URLSearchParams): FaqFilters {
  // 注意：不可在此直接访问 localStorage，否则会导致服务端与客户端初始渲染不一致（hydration mismatch）
  return {
    search: searchParams.get('q') || '',
    categoryId: searchParams.get('category_id') || undefined,
    productModelId: searchParams.get('product_model_id') || undefined,
    tagId: searchParams.get('tag_id') || undefined,
    hasVideo: searchParams.get('has_video') === 'true' ? true : undefined,
    sortBy: (searchParams.get('sort') as 'latest' | 'best' | 'ranking' | 'my-share') || 'latest',
    period: (searchParams.get('period') as 'week' | 'month' | 'quarter' | 'year' | 'all') || 'all',
    viewMode: 'card' // 统一默认视图，后续在客户端再根据 localStorage 调整
  };
} 