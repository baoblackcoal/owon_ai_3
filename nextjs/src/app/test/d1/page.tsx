'use client';

import { useEffect, useState } from 'react';

// 定义FAQ分类数据类型
interface FaqCategory {
  id: string;
  name: string;
  description: string;
  created_at: string;
}

// 定义错误响应类型
interface ErrorResponse {
  error: string;
}

export default function D1TestPage() {
  const [categories, setCategories] = useState<FaqCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // 获取FAQ分类数据
    const fetchCategories = async () => {
      try {
        const response = await fetch('/api/test/d1?table=faq_categories');
        if (!response.ok) {
          const errorData = await response.json() as ErrorResponse;
          throw new Error(errorData.error || '数据获取失败');
        }
        const data = await response.json();
        setCategories(data as FaqCategory[]);
      } catch (err) {
        setError(err instanceof Error ? err.message : '发生未知错误');
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

  if (loading) {
    return <div className="p-4">加载中...</div>;
  }

  if (error) {
    return <div className="p-4 text-red-500">错误: {error}</div>;
  }

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">FAQ分类列表</h1>
      <div className="grid gap-4">
        {categories.map((category: FaqCategory) => (
          <div
            key={category.id}
            className="border rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow"
          >
            <h2 className="text-xl font-semibold">{category.name}</h2>
            <p className="text-gray-600">{category.description}</p>
            <p className="text-gray-500 text-sm">创建时间: {new Date(category.created_at).toLocaleString()}</p>
          </div>
        ))}
      </div>
      {categories.length === 0 && (
        <p className="text-gray-500">没有找到分类数据</p>
      )}
    </div>
  );
} 