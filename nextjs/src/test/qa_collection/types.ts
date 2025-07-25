export interface Category {
  id: number;
  name: string;
  description: string;
}

export interface ProductModel {
  id: number;
  name: string;
  category_id: number;
}

export interface Tag {
  id: number;
  name: string;
}

export interface Question {
  id: number;
  title: string;
  content: string;
  created_at: string;
  category_id: number;
  product_model_id: number;
  views_count: number;
  likes_count: number;
  replies_count: number;
  tags: Tag[];
  updated_at: string;
  user_id?: string; // 添加用户ID字段
  is_shared?: boolean; // 添加是否为用户分享的标识
}

export interface QAFilters {
  search: string;
  category: number | null;
  model: number | null;
  tags: number[];
  sortBy: 'latest' | 'best' | 'ranking' | 'my-share';
  period: 'week' | 'month' | 'quarter' | 'year' | 'all';
} 