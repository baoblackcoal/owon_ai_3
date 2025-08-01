'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Edit, 
  Trash2, 
  Search, 
  Eye, 
  ThumbsUp,
  Video,
  Loader2
} from 'lucide-react';
import type { FaqQuestion, FaqListProps } from '@/types/faq';

export default function FaqList({ onEditFaq, selectedFaqId }: FaqListProps) {
  const [faqs, setFaqs] = useState<FaqQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredFaqs, setFilteredFaqs] = useState<FaqQuestion[]>([]);

  // 加载FAQ列表
  useEffect(() => {
    loadFaqs();
  }, []);

  // 搜索过滤
  useEffect(() => {
    const filtered = faqs.filter(faq => 
      faq.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      faq.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
      faq.category?.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredFaqs(filtered);
  }, [faqs, searchTerm]);

  const loadFaqs = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/faq');
      if (response.ok) {
        const data = await response.json() as { faqs?: FaqQuestion[] };
        setFaqs(data.faqs || []);
      } else {
        console.error('加载FAQ失败');
      }
    } catch (error) {
      console.error('加载FAQ失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteFaq = async (faqId: string) => {
    if (!confirm('确定要删除这个FAQ吗？此操作不可撤销。')) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/faq/${faqId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        // 重新加载列表
        await loadFaqs();
      } else {
        alert('删除失败');
      }
    } catch (error) {
      console.error('删除FAQ失败:', error);
      alert('删除失败');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-32">
        <Loader2 className="w-6 h-6 animate-spin" />
        <span className="ml-2">加载中...</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* 搜索栏 */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="搜索FAQ..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* FAQ列表 */}
      <div className="space-y-3 max-h-96 overflow-y-auto">
        {filteredFaqs.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            {searchTerm ? '没有找到匹配的FAQ' : '暂无FAQ数据'}
          </div>
        ) : (
          filteredFaqs.map((faq) => (
            <Card 
              key={faq.id} 
              className={`cursor-pointer transition-colors hover:bg-muted/50 ${
                selectedFaqId === faq.id ? 'ring-2 ring-primary' : ''
              }`}
              onClick={() => onEditFaq(faq)}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-sm truncate mb-1">
                      {faq.title}
                    </h3>
                    <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                      {faq.content}
                    </p>
                    
                    {/* 标签和统计信息 */}
                    <div className="flex items-center gap-2 flex-wrap">
                      {faq.category && (
                        <Badge variant="secondary" className="text-xs">
                          {faq.category.name}
                        </Badge>
                      )}
                      {faq.product_model && (
                        <Badge variant="outline" className="text-xs">
                          {faq.product_model.name}
                        </Badge>
                      )}
                      {faq.has_video && (
                        <Badge variant="outline" className="text-xs">
                          <Video className="w-3 h-3 mr-1" />
                          视频
                        </Badge>
                      )}
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Eye className="w-3 h-3" />
                        {faq.views_count}
                      </div>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <ThumbsUp className="w-3 h-3" />
                        {faq.likes_count}
                      </div>
                    </div>
                    
                    <div className="text-xs text-muted-foreground mt-2">
                      {formatDate(faq.created_at)}
                    </div>
                  </div>
                  
                  {/* 操作按钮 */}
                  <div className="flex items-center gap-1 ml-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        onEditFaq(faq);
                      }}
                      className="h-8 w-8 p-0"
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteFaq(faq.id);
                      }}
                      className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* 统计信息 */}
      <div className="text-xs text-muted-foreground text-center">
        共 {filteredFaqs.length} 个FAQ
        {searchTerm && ` (搜索: "${searchTerm}")`}
      </div>
    </div>
  );
} 