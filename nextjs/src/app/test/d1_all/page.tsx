'use client';

import { useEffect, useState, useCallback } from 'react';
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
  data: Record<string, unknown>[];
  total: number;
}

interface RowData {
  [key: string]: string | number;
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
  const [editingRow, setEditingRow] = useState<RowData | null>(null);
  const [newRow, setNewRow] = useState<RowData | null>(null);

  // 获取所有表
  const fetchTables = useCallback(async () => {
    try {
      const response = await fetch('/api/test/d1_all?action=getTables');
      if (!response.ok) throw new Error('获取表列表失败');
      const data = await response.json() as TableInfo[];
      setTables(data);
      if (data.length > 0 && !selectedTable) {
        setSelectedTable(data[0].name);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '获取表列表失败');
    }
  }, [selectedTable]);

  // 获取表结构
  const fetchSchema = useCallback(async (tableName: string) => {
    try {
      const response = await fetch(`/api/test/d1_all?action=getSchema&table=${tableName}`);
      if (!response.ok) throw new Error('获取表结构失败');
      const data = await response.json() as ColumnInfo[];
      setSchema(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : '获取表结构失败');
    }
  }, []);

  // 获取表数据
  const fetchTableData = useCallback(async () => {
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
      const data = await response.json() as TableData;
      setTableData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : '获取表数据失败');
    }
  }, [selectedTable, page, pageSize, searchColumn, searchValue]);

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
    const newRowData: RowData = {};
    schema.forEach(col => {
      newRowData[col.name] = '';
    });
    setNewRow(newRowData);
  };

  // 处理保存新行
  const handleSaveNewRow = async () => {
    if (!newRow) return;
    
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
  const handleEditRow = (row: RowData) => {
    setEditingRow({ ...row });
  };

  // 处理保存编辑
  const handleSaveEdit = async () => {
    if (!editingRow) return;
    
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
  }, [fetchTables]);

  useEffect(() => {
    if (selectedTable) {
      setLoading(true);
      Promise.all([
        fetchSchema(selectedTable),
        fetchTableData()
      ]).finally(() => setLoading(false));
    }
  }, [selectedTable, fetchSchema, fetchTableData]);

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
            <Card className="p-4 mb-4">
              <div className="space-y-4">
                {schema.map((col) => (
                  <div key={col.name} className="flex items-center gap-2">
                    <span className="w-24">{col.name}:</span>
                    <Input
                      value={String(newRow[col.name] || '')}
                      onChange={(e) => setNewRow({
                        ...newRow,
                        [col.name]: e.target.value
                      })}
                    />
                  </div>
                ))}
                <div className="flex justify-end gap-2">
                  <Button onClick={() => setNewRow(null)} variant="outline">
                    取消
                  </Button>
                  <Button onClick={handleSaveNewRow}>
                    保存
                  </Button>
                </div>
              </div>
            </Card>
          )}

          {/* 数据表格 */}
          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-muted">
                    {schema.map((col) => (
                      <th key={col.name} className="px-4 py-2 text-left">
                        {col.name}
                      </th>
                    ))}
                    <th className="px-4 py-2 text-right">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {tableData.data.map((row, index) => (
                    <tr key={index} className="border-t">
                      {schema.map((col) => (
                        <td key={col.name} className="px-4 py-2">
                          {editingRow && (row as RowData).id === editingRow.id ? (
                            <Input
                              value={String(editingRow[col.name] || '')}
                              onChange={(e) => setEditingRow({
                                ...editingRow,
                                [col.name]: e.target.value
                              })}
                            />
                          ) : (
                            String((row as RowData)[col.name] || '')
                          )}
                        </td>
                      ))}
                      <td className="px-4 py-2 text-right">
                        {editingRow && (row as RowData).id === editingRow.id ? (
                          <div className="flex justify-end gap-2">
                            <Button
                              onClick={() => setEditingRow(null)}
                              variant="outline"
                              size="sm"
                            >
                              取消
                            </Button>
                            <Button
                              onClick={handleSaveEdit}
                              size="sm"
                            >
                              保存
                            </Button>
                          </div>
                        ) : (
                          <div className="flex justify-end gap-2">
                            <Button
                              onClick={() => handleEditRow(row as RowData)}
                              variant="outline"
                              size="sm"
                            >
                              编辑
                            </Button>
                            <Button
                              onClick={() => handleDeleteRow((row as RowData).id as number)}
                              variant="outline"
                              size="sm"
                              className="text-red-500 hover:text-red-700"
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
            </div>
          </Card>

          {/* 分页 */}
          <div className="flex justify-between items-center mt-4">
            <div className="text-sm text-muted-foreground">
              共 {tableData.total} 条记录
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                variant="outline"
              >
                上一页
              </Button>
              <Button
                onClick={() => setPage(p => p + 1)}
                disabled={page * pageSize >= tableData.total}
                variant="outline"
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