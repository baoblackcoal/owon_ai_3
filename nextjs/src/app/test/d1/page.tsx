'use client';

import { useEffect, useState } from 'react';

// 定义客户数据类型
interface Customer {
  CustomerID: number;
  CompanyName: string;
  ContactName: string;
}

// 定义错误响应类型
interface ErrorResponse {
  error: string;
}

export default function D1TestPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // 获取 Bs Beverages 的客户数据
    const fetchCustomers = async () => {
      try {
        const response = await fetch('/api/test/d1');
        if (!response.ok) {
          const errorData = await response.json() as ErrorResponse;
          throw new Error(errorData.error || '数据获取失败');
        }
        const data = await response.json();
        setCustomers(data as Customer[]);
      } catch (err) {
        setError(err instanceof Error ? err.message : '发生未知错误');
      } finally {
        setLoading(false);
      }
    };

    fetchCustomers();
  }, []);

  if (loading) {
    return <div className="p-4">加载中...</div>;
  }

  if (error) {
    return <div className="p-4 text-red-500">错误: {error}</div>;
  }

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Bs Beverages 客户列表</h1>
      <div className="grid gap-4">
        {customers.map((customer) => (
          <div
            key={customer.CustomerID}
            className="border rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow"
          >
            <h2 className="text-xl font-semibold">{customer.ContactName}</h2>
            <p className="text-gray-600">{customer.CompanyName}</p>
          </div>
        ))}
      </div>
      {customers.length === 0 && (
        <p className="text-gray-500">没有找到客户数据</p>
      )}
    </div>
  );
} 