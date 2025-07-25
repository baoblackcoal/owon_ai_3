'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, Eye, ThumbsUp, Clock } from 'lucide-react';
import type { FaqQuestion } from '@/types/faq';

export default function FaqDetailPage() {
  const params = useParams();
  const router = useRouter();
  const questionId = params.id as string;
  
  const [question, setQuestion] = useState<FaqQuestion | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchQuestion = async () => {
      if (!questionId) return;
      
      setLoading(true);
      try {
        const response = await fetch(`/api/faq/${questionId}`);
        if (!response.ok) {
          if (response.status === 404) {
            setError('问题未找到');
          } else {
            setError('获取问题详情失败');
          }
          return;
        }
        
        const data = await response.json() as FaqQuestion;
        setQuestion(data);
      } catch (err) {
        setError('获取问题详情失败');
        console.error('Failed to fetch question:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchQuestion();
  }, [questionId]);

  const formatTime = (timeStr: string) => {
    const date = new Date(timeStr);
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="container mx-auto px-8 py-4 max-w-4xl">
        <div className="mb-6">
          <Skeleton className="h-8 w-20 mb-4" />
          <Skeleton className="h-10 w-3/4 mb-2" />
          <Skeleton className="h-6 w-1/2" />
        </div>
        <div className="space-y-4">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      </div>
    );
  }

  if (error || !question) {
    return (
      <div className="container mx-auto px-8 py-4 max-w-4xl">
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold mb-4">获取问题详情失败</h2>
          <p className="text-muted-foreground mb-6">
            {error || '抱歉，无法加载问题详情，请稍后再试'}
          </p>
          <Button onClick={() => router.push('/faq')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            返回问答列表
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-8 py-4 max-w-4xl">
      {/* 返回按钮 */}
      <div className="mb-6">
        <Button 
          variant="ghost" 
          onClick={() => router.push('/faq')}
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          返回问答列表
        </Button>
        
        {/* 问题标题和基本信息 */}
        <div className="space-y-4">
          <h1 className="text-3xl font-bold">{question.title}</h1>
          
          {/* 标签 */}
          <div className="flex flex-wrap gap-2">
            {question.category && (
              <Badge variant="secondary">
                {question.category.name}
              </Badge>
            )}
            {question.product_model && (
              <Badge variant="outline">
                {question.product_model.name}
              </Badge>
            )}
            {question.tags?.map((tag) => (
              <Badge key={tag.id} variant="outline">
                {tag.name}
              </Badge>
            ))}
            {question.software_version && (
              <Badge variant="outline">
                {question.software_version}
              </Badge>
            )}
          </div>
          
          {/* 统计信息 */}
          <div className="flex items-center gap-6 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Eye className="h-4 w-4" />
              <span>{question.views_count} 浏览</span>
            </div>
            <div className="flex items-center gap-1">
              <ThumbsUp className="h-4 w-4" />
              <span>{question.likes_count} 点赞</span>
            </div>
            <div className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              <span>创建于 {formatTime(question.created_at)}</span>
            </div>
            {question.updated_at !== question.created_at && (
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                <span>更新于 {formatTime(question.updated_at)}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 问题内容 */}
      <div className="bg-card rounded-lg border p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">问题描述</h2>
        <div className="prose max-w-none">
          <p className="whitespace-pre-line text-foreground leading-relaxed">
            {question.content}
          </p>
        </div>
      </div>

      {/* 答案列表 */}
      {question.answers && question.answers.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">
            解答 ({question.answers.length})
          </h2>
          
          {question.answers.map((answer, index) => (
            <div key={answer.id} className="bg-card rounded-lg border p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-medium">解答 #{index + 1}</h3>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  {answer.software_version && (
                    <Badge variant="outline" className="text-xs">
                      {answer.software_version}
                    </Badge>
                  )}
                  <div className="flex items-center gap-1">
                    <ThumbsUp className="h-3 w-3" />
                    <span>{answer.likes_count}</span>
                  </div>
                  <span>{formatTime(answer.created_at)}</span>
                </div>
              </div>
              
              <div className="prose max-w-none">
                <p className="whitespace-pre-line text-foreground leading-relaxed">
                  {answer.content}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 