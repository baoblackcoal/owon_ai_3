'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Plus, FileText } from 'lucide-react';
import Link from 'next/link';
import FaqList from '@/components/admin/FaqList';
import FaqEditor from '@/components/admin/FaqEditor';
import { useState } from 'react';
import type { FaqQuestion, FaqEditorData } from '@/types/faq';

export default function FaqAddPage() {
  const [selectedFaq, setSelectedFaq] = useState<FaqQuestion | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  const handleCreateNew = () => {
    setSelectedFaq(null);
    setIsEditing(true);
  };

  const handleEditFaq = (faq: FaqQuestion) => {
    setSelectedFaq(faq);
    setIsEditing(true);
  };

  const handleSave = async (data: FaqEditorData) => {
    try {
      const response = await fetch('/api/admin/faq', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        const result = await response.json() as { message?: string };
        alert(result.message || '保存成功');
        setIsEditing(false);
        setSelectedFaq(null);
        // 这里可以触发列表刷新
      } else {
        const error = await response.json() as { error?: string };
        alert(error.error || '保存失败');
      }
    } catch (error) {
      console.error('保存失败:', error);
      alert('保存失败');
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setSelectedFaq(null);
  };

  return (
    <div className="space-y-6">
      {/* 页面头部 */}
      <div className="flex items-center gap-4">
        <Link href="/admin">
          <Button variant="outline" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            返回后台
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <FileText className="w-8 h-8" />
            FAQ 在线编辑
          </h1>
          <p className="text-muted-foreground">
            在线编辑FAQ问答，支持Markdown格式和实时预览
          </p>
        </div>
      </div>

      {/* 主要内容区域 */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* 左侧：FAQ列表 */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>FAQ 列表</CardTitle>
                <CardDescription>
                  管理所有FAQ问答内容
                </CardDescription>
              </div>
              <Button onClick={handleCreateNew} size="sm">
                <Plus className="w-4 h-4 mr-2" />
                新建FAQ
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <FaqList 
              onEditFaq={handleEditFaq}
              selectedFaqId={selectedFaq?.id || null}
            />
          </CardContent>
        </Card>

        {/* 右侧：编辑器 */}
        <Card>
          <CardHeader>
            <CardTitle>
              {selectedFaq ? '编辑FAQ' : '新建FAQ'}
            </CardTitle>
            <CardDescription>
              {selectedFaq 
                ? `编辑：${selectedFaq.title}` 
                : '创建新的FAQ问答'
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isEditing ? (
              <FaqEditor 
                faq={selectedFaq}
                onSave={handleSave}
                onCancel={handleCancel}
              />
            ) : (
              <div className="flex items-center justify-center h-64 text-muted-foreground">
                <div className="text-center">
                  <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>选择左侧的FAQ进行编辑，或点击&ldquo;新建FAQ&rdquo;</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* 使用说明 */}
      <Card>
        <CardHeader>
          <CardTitle>使用说明</CardTitle>
          <CardDescription>
            了解如何高效编辑FAQ内容
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-medium mb-3">编辑功能</h3>
              <ul className="space-y-2 text-sm text-muted-foreground list-disc list-inside">
                <li>支持Markdown格式编辑</li>
                <li>实时预览编辑效果</li>
                <li>自动创建分类、产品型号和标签</li>
                <li>支持Bilibili视频链接</li>
                <li>表单验证和错误提示</li>
              </ul>
            </div>
            <div>
              <h3 className="font-medium mb-3">快捷键</h3>
              <ul className="space-y-2 text-sm text-muted-foreground list-disc list-inside">
                <li>Ctrl+S：保存FAQ</li>
                <li>Ctrl+Enter：预览模式</li>
                <li>Ctrl+Shift+P：切换预览</li>
                <li>Esc：取消编辑</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 