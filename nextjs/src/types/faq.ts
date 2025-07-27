// FAQ 常见问答集相关类型定义

export interface FaqCategory {
  id: string;
  name: string;
  description?: string;
  created_at: string;
}

export interface FaqProductModel {
  id: string;
  category_id?: string;
  name: string;
  created_at: string;
}

export interface FaqTag {
  id: string;
  name: string;
  created_at: string;
}

export interface FaqQuestion {
  id: string;
  title: string;
  content: string;
  answer: string; // Markdown 格式的官方答案
  category_id?: string;
  product_model_id?: string;
  software_version?: string;
  views_count: number;
  likes_count: number;
  created_by?: string;
  created_at: string;
  updated_at: string;
  // 视频支持
  video_bilibili_bvid?: string; // Bilibili视频BVID
  has_video?: boolean; // 是否有视频（冗余字段，用于快速筛选）
  // 关联数据
  category?: FaqCategory;
  product_model?: FaqProductModel;
  tags?: FaqTag[];
  is_liked?: boolean; // 当前用户是否已点赞
}

export interface FaqLike {
  id: string;
  user_id: string;
  question_id: string; // 现在只支持对问题点赞
  created_at: string;
}

// API 请求/响应类型
export interface FaqListParams {
  q?: string; // 搜索关键词
  category_id?: string;
  product_model_id?: string;
  tag_id?: string;
  has_video?: boolean; // 仅显示有视频的问题
  sort?: 'latest' | 'best' | 'ranking' | 'my-share';
  period?: 'week' | 'month' | 'quarter' | 'year' | 'all';
  limit?: number;
  cursor?: string; // 分页游标
}

export interface FaqListResponse {
  data: FaqQuestion[];
  nextCursor?: string;
  total?: number;
}

export interface FaqDetailResponse {
  question: FaqQuestion;
  related_questions?: FaqQuestion[]; // 相关推荐问题
}

export interface FaqFiltersResponse {
  categories: FaqCategory[];
  product_models: FaqProductModel[];
  tags: FaqTag[];
}

export interface FaqLikeRequest {
  target: 'question'; // 现在只支持对问题点赞
}

// 前端 UI 相关类型
export interface FaqFilters {
  search: string;
  categoryId?: string;
  productModelId?: string;
  tagId?: string;
  hasVideo?: boolean; // 仅显示有视频的问题
  sortBy: 'latest' | 'best' | 'ranking' | 'my-share';
  period: 'week' | 'month' | 'quarter' | 'year' | 'all';
  viewMode: 'list' | 'card'; // 视图模式
}

export interface FaqViewMode {
  type: 'list' | 'card';
}

// 组件 Props 类型
export interface FaqCardProps {
  question: FaqQuestion;
  viewMode: 'list' | 'card';
  onLike?: (questionId: string) => void;
  onClick?: (questionId: string) => void;
}

export interface FaqSearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export interface FaqFiltersProps {
  filters: FaqFilters;
  onChange: (filters: Partial<FaqFilters>) => void;
  categories: FaqCategory[];
  productModels: FaqProductModel[];
  tags: FaqTag[];
  resultCount: number;
}

export interface FaqSortTabsProps {
  value: FaqFilters['sortBy'];
  onChange: (value: FaqFilters['sortBy']) => void;
  period: FaqFilters['period'];
  onPeriodChange: (period: FaqFilters['period']) => void;
  showPeriod: boolean;
} 