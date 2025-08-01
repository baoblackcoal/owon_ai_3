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

// CSV 导入相关类型
export interface FaqCsvRow {
  title: string;
  content_md: string;
  answer_md: string;
  category: string;
  product_model?: string;
  tags?: string; // 逗号分隔的标签名称
  software_version?: string;
  bilibili_bvid?: string; // Bilibili视频BVID
}

export interface FaqImportError {
  row: number; // 行号（从1开始）
  field?: string; // 出错的字段名
  message: string; // 错误描述
  data?: FaqCsvRow; // 原始数据
}

export interface FaqImportResult {
  successCount: number;
  errorCount: number;
  skippedCount: number;
  errors: FaqImportError[];
  newCategories: string[]; // 新创建的分类名称
  newProductModels: string[]; // 新创建的产品型号名称
  newTags: string[]; // 新创建的标签名称
}

export interface FaqImportRequest {
  csvData: string; // CSV文件内容
  updateExisting?: boolean; // 是否更新已存在的问题（基于title匹配）
}

export interface FaqImportResponse {
  success: boolean;
  message: string;
  result?: FaqImportResult;
}

// CSV模板相关
export interface FaqCsvTemplate {
  filename: string;
  headers: string[];
  sampleData: FaqCsvRow[];
}

export interface FaqImportStats {
  totalRows: number;
  processedRows: number;
  successRows: number;
  errorRows: number;
  isComplete: boolean;
}

// FAQ 编辑器相关类型
export interface FaqEditorData {
  id?: string;
  title: string;
  content: string;
  answer: string;
  category_id?: string;
  product_model_id?: string;
  software_version?: string;
  video_bilibili_bvid?: string;
  tags?: string[]; // 标签名称数组
}

export interface FaqEditorProps {
  faq?: FaqQuestion | null;
  onSave: (data: FaqEditorData) => Promise<void>;
  onCancel: () => void;
}

export interface FaqListProps {
  onEditFaq: (faq: FaqQuestion) => void;
  selectedFaqId?: string | null;
}

export interface FaqPreviewProps {
  data: FaqEditorData;
  isPreview?: boolean;
}

// 分类、产品型号、标签管理类型
export interface FaqCategoryFormData {
  id?: string;
  name: string;
  description?: string;
}

export interface FaqProductModelFormData {
  id?: string;
  name: string;
  category_id?: string;
}

export interface FaqTagFormData {
  id?: string;
  name: string;
}

// API 响应类型
export interface FaqSaveResponse {
  success: boolean;
  message: string;
  faq?: FaqQuestion;
}

export interface FaqDeleteResponse {
  success: boolean;
  message: string;
} 