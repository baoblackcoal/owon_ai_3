import { Category, ProductModel, Tag, Question } from './types';

export const categories: Category[] = [
  { id: 1, name: '示波器', description: '数字示波器产品' },
  { id: 2, name: '信号发生器', description: '任意波形信号发生器' },
  { id: 3, name: '万用表', description: '数字万用表产品' },
  { id: 4, name: '电源', description: '可编程电源产品' },
  { id: 5, name: '频谱分析仪', description: '频谱分析设备' },
];

export const productModels: ProductModel[] = [
  // 示波器
  { id: 1, name: 'ADS800A', category_id: 1 },
  { id: 2, name: 'ADS900A', category_id: 1 },
  { id: 3, name: 'XDS3000', category_id: 1 },
  { id: 4, name: 'SDS1000X-E', category_id: 1 },
  // 信号发生器
  { id: 5, name: 'AG1022F', category_id: 2 },
  { id: 6, name: 'AG2052F', category_id: 2 },
  // 万用表
  { id: 7, name: 'B35T+', category_id: 3 },
  { id: 8, name: 'HDS200', category_id: 3 },
  // 电源
  { id: 9, name: 'SPD3303X', category_id: 4 },
  { id: 10, name: 'SPD3303C', category_id: 4 },
];

export const tags: Tag[] = [
  { id: 0, name: '全部' },
  { id: 1, name: '测量' },
  { id: 2, name: '触发' },
  { id: 3, name: '光标' },
  { id: 4, name: 'FFT' },
  { id: 5, name: 'XY模式' },
  { id: 6, name: '固件升级' },
  { id: 7, name: 'PC软件' },
  { id: 8, name: '校准' },
  { id: 9, name: '波形存储' },
  { id: 10, name: '协议解码' },
  { id: 11, name: '带宽' },
  { id: 12, name: '采样率' },
  { id: 13, name: '连接问题' },
  { id: 14, name: '参数设置' },
  { id: 15, name: '故障排除' },
];

export const questions: Question[] = [
  {
    id: 1,
    title: 'ADS800A示波器的最大带宽是多少？',
    content: '想了解ADS800A示波器的技术规格，特别是带宽参数，用于高频信号测量。',
    created_at: '2024-01-15T10:30:00Z',
    category_id: 1,
    product_model_id: 1,
    views_count: 156,
    likes_count: 12,
    replies_count: 3,
    tags: [{ id: 11, name: '带宽' }, { id: 1, name: '测量' }],
    updated_at: '2024-01-16T14:20:00Z',
    user_id: 'user123',
    is_shared: true
  },
  {
    id: 2,
    title: '如何在ADS900A上设置边沿触发？',
    content: '新手求助，在使用ADS900A时不知道如何正确设置边沿触发功能，希望有详细的操作步骤。',
    created_at: '2024-01-14T09:15:00Z',
    category_id: 1,
    product_model_id: 2,
    views_count: 234,
    likes_count: 18,
    replies_count: 5,
    tags: [{ id: 2, name: '触发' }, { id: 14, name: '参数设置' }],
    updated_at: '2024-01-15T11:30:00Z',
  },
  {
    id: 3,
    title: 'XDS3000示波器FFT功能使用教程',
    content: '求XDS3000的FFT功能详细使用方法，包括参数设置和结果分析。',
    created_at: '2024-01-13T16:45:00Z',
    category_id: 1,
    product_model_id: 3,
    views_count: 189,
    likes_count: 25,
    replies_count: 7,
    tags: [{ id: 4, name: 'FFT' }, { id: 1, name: '测量' }, { id: 14, name: '参数设置' }],
    updated_at: '2024-01-14T12:00:00Z',
  },
  {
    id: 4,
    title: 'AG1022F信号发生器无法连接PC软件',
    content: 'AG1022F通过USB连接电脑后，PC软件无法识别设备，已尝试重新安装驱动但仍无法解决。',
    created_at: '2024-01-12T14:20:00Z',
    category_id: 2,
    product_model_id: 5,
    views_count: 145,
    likes_count: 8,
    replies_count: 4,
    tags: [{ id: 7, name: 'PC软件' }, { id: 13, name: '连接问题' }, { id: 15, name: '故障排除' }],
    updated_at: '2024-01-13T09:30:00Z',
  },
  {
    id: 5,
    title: 'B35T+万用表校准周期和方法',
    content: '请问B35T+万用表的建议校准周期是多长？有什么自校准功能吗？',
    created_at: '2024-01-11T11:10:00Z',
    category_id: 3,
    product_model_id: 7,
    views_count: 98,
    likes_count: 6,
    replies_count: 2,
    tags: [{ id: 8, name: '校准' }, { id: 1, name: '测量' }],
    updated_at: '2024-01-12T15:45:00Z',
  },
  {
    id: 6,
    title: 'SPD3303X电源的保护功能设置',
    content: '想了解SPD3303X可编程电源的过压、过流保护功能如何设置和使用。',
    created_at: '2024-01-10T13:25:00Z',
    category_id: 4,
    product_model_id: 9,
    views_count: 167,
    likes_count: 14,
    replies_count: 6,
    tags: [{ id: 14, name: '参数设置' }, { id: 15, name: '故障排除' }],
    updated_at: '2024-01-11T10:20:00Z',
  },
  {
    id: 7,
    title: 'SDS1000X-E示波器波形存储容量',
    content: 'SDS1000X-E最多可以存储多少个波形文件？支持哪些格式导出？',
    created_at: '2024-01-09T15:40:00Z',
    category_id: 1,
    product_model_id: 4,
    views_count: 203,
    likes_count: 11,
    replies_count: 3,
    tags: [{ id: 9, name: '波形存储' }, { id: 7, name: 'PC软件' }],
    updated_at: '2024-01-10T14:15:00Z',
  },
  {
    id: 8,
    title: 'AG2052F任意波形生成功能详解',
    content: '求AG2052F任意波形发生器的自定义波形编辑和下载方法，有没有相关软件工具？',
    created_at: '2024-01-08T12:30:00Z',
    category_id: 2,
    product_model_id: 6,
    views_count: 178,
    likes_count: 20,
    replies_count: 8,
    tags: [{ id: 7, name: 'PC软件' }, { id: 14, name: '参数设置' }],
    updated_at: '2024-01-09T16:50:00Z',
  },
  {
    id: 9,
    title: 'XDS3000协议解码功能支持哪些协议？',
    content: 'XDS3000示波器的协议解码功能都支持哪些通信协议？如何激活和使用？',
    created_at: '2024-01-07T10:15:00Z',
    category_id: 1,
    product_model_id: 3,
    views_count: 267,
    likes_count: 22,
    replies_count: 9,
    tags: [{ id: 10, name: '协议解码' }, { id: 1, name: '测量' }],
    updated_at: '2024-01-08T13:40:00Z',
  },
  {
    id: 10,
    title: 'HDS200手持示波表固件升级步骤',
    content: 'HDS200手持示波表如何进行固件升级？升级过程中需要注意什么？',
    created_at: '2024-01-06T14:55:00Z',
    category_id: 3,
    product_model_id: 8,
    views_count: 134,
    likes_count: 9,
    replies_count: 4,
    tags: [{ id: 6, name: '固件升级' }, { id: 15, name: '故障排除' }],
    updated_at: '2024-01-07T11:25:00Z',
  },
  {
    id: 11,
    title: 'ADS800A的XY模式如何使用？',
    content: '想用ADS800A的XY模式观察李萨如图形，但不知道如何正确设置和操作。',
    created_at: '2024-01-05T16:20:00Z',
    category_id: 1,
    product_model_id: 1,
    views_count: 156,
    likes_count: 15,
    replies_count: 5,
    tags: [{ id: 5, name: 'XY模式' }, { id: 1, name: '测量' }, { id: 14, name: '参数设置' }],
    updated_at: '2024-01-06T12:30:00Z',
  },
  {
    id: 12,
    title: 'SPD3303C多路输出电源同步控制',
    content: 'SPD3303C三路输出电源如何实现多路输出的同步控制？可以编程控制吗？',
    created_at: '2024-01-04T09:40:00Z',
    category_id: 4,
    product_model_id: 10,
    views_count: 121,
    likes_count: 7,
    replies_count: 3,
    tags: [{ id: 14, name: '参数设置' }, { id: 7, name: 'PC软件' }],
    updated_at: '2024-01-05T14:10:00Z',
  },
  {
    id: 13,
    title: '分享：ADS900A示波器实现高精度相位测量的技巧',
    content: '总结了一些使用ADS900A进行相位测量的实用技巧和注意事项，希望对大家有帮助。',
    created_at: '2024-01-03T08:30:00Z',
    category_id: 1,
    product_model_id: 2,
    views_count: 245,
    likes_count: 28,
    replies_count: 12,
    tags: [{ id: 1, name: '测量' }, { id: 14, name: '参数设置' }],
    updated_at: '2024-01-04T16:20:00Z',
    user_id: 'user123',
    is_shared: true
  },
  {
    id: 14,
    title: '分享：XDS3000示波器自动测量功能实战应用',
    content: '分享一下在实际工作中如何高效使用XDS3000的自动测量功能，包括一些不常见但很实用的技巧。',
    created_at: '2024-01-02T11:20:00Z',
    category_id: 1,
    product_model_id: 3,
    views_count: 198,
    likes_count: 32,
    replies_count: 15,
    tags: [{ id: 1, name: '测量' }, { id: 14, name: '参数设置' }],
    updated_at: '2024-01-03T09:45:00Z',
    user_id: 'user123',
    is_shared: true
  }
];

// 辅助函数：根据分类ID获取产品型号
export const getModelsByCategory = (categoryId: number | null): ProductModel[] => {
  if (!categoryId) return productModels;
  return productModels.filter(model => model.category_id === categoryId);
};

// 辅助函数：获取分类名称
export const getCategoryName = (categoryId: number): string => {
  const category = categories.find(cat => cat.id === categoryId);
  return category?.name || '未知分类';
};

// 辅助函数：获取产品型号名称
export const getModelName = (modelId: number): string => {
  const model = productModels.find(m => m.id === modelId);
  return model?.name || '未知型号';
}; 