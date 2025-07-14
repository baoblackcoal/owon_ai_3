'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface TableInfo {
  name: string;
}

interface ColumnInfo {
  name: string;
  type: string;
  notnull: number;
  pk: number;
}

interface TableData {
  data: any[];
  total: number;
}

export default function D1AllPage() {
  const [tables, setTables] = useState<TableInfo[]>([]);
  const [selectedTable, setSelectedTable] = useState<string>('');
  const [schema, setSchema] = useState<ColumnInfo[]>([]);
  const [tableData, setTableData] = useState<TableData>({ data: [], total: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [searchColumn, setSearchColumn] = useState<string>('');
  const [searchValue, setSearchValue] = useState<string>('');
  const [editingRow, setEditingRow] = useState<any | null>(null);
  const [newRow, setNewRow] = useState<any | null>(null);

  // 获取所有表
  const fetchTables = async () => {
    try {
      const response = await fetch('/api/test/d1_all?action=getTables');
      if (!response.ok) throw new Error('获取表列表失败');
      const data = await response.json();
      setTables(data);
      if (data.length > 0 && !selectedTable) {
        setSelectedTable(data[0].name);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '获取表列表失败');
    }
  };

  // 获取表结构
  const fetchSchema = async (tableName: string) => {
    try {
      const response = await fetch(`/api/test/d1_all?action=getSchema&table=${tableName}`);
      if (!response.ok) throw new Error('获取表结构失败');
      const data = await response.json();
      setSchema(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : '获取表结构失败');
    }
  };

  // 获取表数据
  const fetchTableData = async () => {
    try {
      const url = new URL('/api/test/d1_all', window.location.origin);
      url.searchParams.set('action', 'getData');
      url.searchParams.set('table', selectedTable);
      url.searchParams.set('page', page.toString());
      url.searchParams.set('pageSize', pageSize.toString());
      if (searchColumn && searchValue) {
        url.searchParams.set('searchColumn', searchColumn);
        url.searchParams.set('searchValue', searchValue);
      }

      const response = await fetch(url);
      if (!response.ok) throw new Error('获取表数据失败');
      const data = await response.json();
      setTableData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : '获取表数据失败');
    }
  };

  // 处理表选择
  const handleTableSelect = async (tableName: string) => {
    setSelectedTable(tableName);
    setPage(1);
    setSearchColumn('');
    setSearchValue('');
    setEditingRow(null);
    setNewRow(null);
  };

  // 处理搜索
  const handleSearch = () => {
    setPage(1);
    fetchTableData();
  };

  // 处理新增行
  const handleAddRow = () => {
    const newRowData = {};
    schema.forEach(col => {
      newRowData[col.name] = '';
    });
    setNewRow(newRowData);
  };

  // 处理保存新行
  const handleSaveNewRow = async () => {
    try {
      const response = await fetch('/api/test/d1_all', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          table: selectedTable,
          action: 'insert',
          data: newRow
        })
      });
      
      if (!response.ok) throw new Error('添加数据失败');
      setNewRow(null);
      fetchTableData();
    } catch (err) {
      setError(err instanceof Error ? err.message : '添加数据失败');
    }
  };

  // 处理编辑行
  const handleEditRow = (row: any) => {
    setEditingRow({ ...row });
  };

  // 处理保存编辑
  const handleSaveEdit = async () => {
    try {
      const response = await fetch('/api/test/d1_all', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          table: selectedTable,
          action: 'update',
          data: editingRow
        })
      });
      
      if (!response.ok) throw new Error('更新数据失败');
      setEditingRow(null);
      fetchTableData();
    } catch (err) {
      setError(err instanceof Error ? err.message : '更新数据失败');
    }
  };

  // 处理删除行
  const handleDeleteRow = async (id: number) => {
    if (!confirm('确定要删除这条记录吗？')) return;
    
    try {
      const response = await fetch('/api/test/d1_all', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          table: selectedTable,
          action: 'delete',
          data: { id }
        })
      });
      
      if (!response.ok) throw new Error('删除数据失败');
      fetchTableData();
    } catch (err) {
      setError(err instanceof Error ? err.message : '删除数据失败');
    }
  };

  useEffect(() => {
    fetchTables();
  }, []);

  useEffect(() => {
    if (selectedTable) {
      setLoading(true);
      Promise.all([
        fetchSchema(selectedTable),
        fetchTableData()
      ]).finally(() => setLoading(false));
    }
  }, [selectedTable, page]);

  if (loading && !tables.length) {
    return <div className="p-4">加载中...</div>;
  }

  if (error) {
    return <div className="p-4 text-red-500">错误: {error}</div>;
  }

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-2xl font-bold mb-4">D1 数据库管理</h1>
      
      {/* 表选择 */}
      <div className="flex gap-2 flex-wrap">
        {tables.map((table) => (
          <Button
            key={table.name}
            variant={selectedTable === table.name ? "default" : "outline"}
            onClick={() => handleTableSelect(table.name)}
          >
            {table.name}
          </Button>
        ))}
      </div>

      {selectedTable && (
        <>
          {/* 搜索栏 */}
          <Card className="p-4">
            <div className="flex gap-2">
              <select
                className="border rounded px-2 py-1"
                value={searchColumn}
                onChange={(e) => setSearchColumn(e.target.value)}
              >
                <option value="">选择搜索字段</option>
                {schema.map((col) => (
                  <option key={col.name} value={col.name}>
                    {col.name}
                  </option>
                ))}
              </select>
              <Input
                placeholder="搜索值"
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
              />
              <Button onClick={handleSearch}>搜索</Button>
              <Button variant="outline" onClick={() => {
                setSearchColumn('');
                setSearchValue('');
                setPage(1);
                fetchTableData();
              }}>
                重置
              </Button>
              <Button variant="outline" onClick={handleAddRow}>
                新增
              </Button>
            </div>
          </Card>

          {/* 新增行表单 */}
          {newRow && (
            <Card className="p-4 bg-gray-50">
              <h3 className="font-bold mb-2">新增记录</h3>
              <div className="grid gap-2">
                {schema.map((col) => (
                  <div key={col.name} className="flex items-center gap-2">
                    <span className="w-24">{col.name}:</span>
                    <Input
                      value={newRow[col.name]}
                      onChange={(e) => setNewRow({
                        ...newRow,
                        [col.name]: e.target.value
                      })}
                    />
                  </div>
                ))}
                <div className="flex gap-2 mt-2">
                  <Button onClick={handleSaveNewRow}>保存</Button>
                  <Button variant="outline" onClick={() => setNewRow(null)}>
                    取消
                  </Button>
                </div>
              </div>
            </Card>
          )}

          {/* 数据表格 */}
          <Card className="p-4 overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="bg-gray-50">
                  {schema.map((col) => (
                    <th key={col.name} className="px-4 py-2 text-left">
                      {col.name}
                      {col.pk === 1 && ' (PK)'}
                    </th>
                  ))}
                  <th className="px-4 py-2">操作</th>
                </tr>
              </thead>
              <tbody>
                {tableData.data.map((row, index) => (
                  <tr key={index} className="border-t">
                    {schema.map((col) => (
                      <td key={col.name} className="px-4 py-2">
                        {editingRow && editingRow.id === row.id ? (
                          <Input
                            value={editingRow[col.name]}
                            onChange={(e) => setEditingRow({
                              ...editingRow,
                              [col.name]: e.target.value
                            })}
                          />
                        ) : (
                          row[col.name]
                        )}
                      </td>
                    ))}
                    <td className="px-4 py-2">
                      {editingRow && editingRow.id === row.id ? (
                        <div className="flex gap-2">
                          <Button size="sm" onClick={handleSaveEdit}>
                            保存
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setEditingRow(null)}
                          >
                            取消
                          </Button>
                        </div>
                      ) : (
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEditRow(row)}
                          >
                            编辑
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDeleteRow(row.id)}
                          >
                            删除
                          </Button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>

          {/* 分页 */}
          <div className="flex justify-between items-center">
            <div>
              总计: {tableData.total} 条记录
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                disabled={page === 1}
                onClick={() => setPage(p => Math.max(1, p - 1))}
              >
                上一页
              </Button>
              <span className="px-4 py-2">
                第 {page} 页
              </span>
              <Button
                variant="outline"
                disabled={page * pageSize >= tableData.total}
                onClick={() => setPage(p => p + 1)}
              >
                下一页
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
} 