'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Eye, ThumbsUp, Copy } from 'lucide-react';
import type { FaqQuestion, FaqDetailResponse } from '@/types/faq';
import { useUI } from '@/contexts/UIContext';
import { marked } from 'marked';
import { useSession } from 'next-auth/react';
import { toast } from 'sonner';
import Link from 'next/link';
import BackButton from '@/components/ui/BackButton';
import BilibiliVideo from '@/components/BilibiliVideo';

interface LikeResponse {
  liked: boolean;
  error?: string;
}

interface QuestionWithRelated extends FaqQuestion {
  related_questions?: FaqQuestion[];
}

export default function FaqDetailPage() {
  const params = useParams();
  const { deviceType } = useUI();
  const { data: session } = useSession();
  const [question, setQuestion] = useState<QuestionWithRelated | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [liking, setLiking] = useState(false);
  const [copying, setCopying] = useState(false);

  useEffect(() => {
    const loadQuestion = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/faq/${params.id}`);
        
        if (!response.ok) {
          throw new Error('问题不存在');
        }
        
        const data = await response.json() as FaqDetailResponse;
        setQuestion({
          ...data.question,
          related_questions: data.related_questions,
        });
      } catch {
        setError('加载失败');
      } finally {
        setLoading(false);
      }
    };

    if (params.id) {
      loadQuestion();
    }
  }, [params.id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="flex items-center space-x-2">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>加载中...</span>
        </div>
      </div>
    );
  }

  if (error || !question) {
    return (
      <div className={`
        flex flex-col h-full overflow-auto
        ${deviceType === 'desktop' ? 'max-w-4xl mx-auto w-full' : ''}
        ${deviceType === 'mobile' ? 'w-full' : ''}
        px-4
      `}>
        <BackButton>返回</BackButton>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center text-muted-foreground">
              {error || '问题不存在'}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleLike = async () => {
    if (!session) {
      toast.error('请先登录');
      return;
    }

    try {
      setLiking(true);
      const response = await fetch(`/api/faq/${params.id}/like`, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('操作失败');
      }

      const data = await response.json() as LikeResponse;
      if (data.error) {
        throw new Error(data.error);
      }
      
      setQuestion(prev => {
        if (!prev) return null;
        return {
          ...prev,
          is_liked: data.liked,
          likes_count: data.liked ? prev.likes_count + 1 : prev.likes_count - 1,
        };
      });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '操作失败');
    } finally {
      setLiking(false);
    }
  };

  const handleCopyAnswer = async () => {
    if (!question) return;
    
    try {
      setCopying(true);
      // 移除Markdown格式，只保留纯文本
      const plainText = question.answer
        .replace(/```[\s\S]*?```/g, '') // 移除代码块
        .replace(/`([^`]+)`/g, '$1') // 移除行内代码
        .replace(/\*\*([^*]+)\*\*/g, '$1') // 移除粗体
        .replace(/\*([^*]+)\*/g, '$1') // 移除斜体
        .replace(/#{1,6}\s/g, '') // 移除标题标记
        .replace(/>\s/g, '') // 移除引用标记
        .replace(/\[(.*?)\]\(.*?\)/g, '$1') // 移除链接，保留文本
        .replace(/\n\s*\n/g, '\n') // 清理多余空行
        .trim();
      
      await navigator.clipboard.writeText(plainText);
      toast.success('答案已复制到剪贴板');
    } catch {
      toast.error('复制失败，请手动选择复制');
    } finally {
      setCopying(false);
    }
  };

  return (
    <div className={`
      flex flex-col h-full overflow-auto
      ${deviceType === 'desktop' ? 'max-w-4xl mx-auto w-full' : ''}
      ${deviceType === 'mobile' ? 'w-full' : ''}
      px-4 space-y-4
    `}>
      <BackButton>返回</BackButton>

      <Card>
        <CardHeader>
          <CardTitle className="text-xl">
            {question.title}
          </CardTitle>
          <div className="flex items-center space-x-4 text-sm text-muted-foreground">
            <span>分类: {question.category?.name}</span>
            {question.product_model && <span>机型: {question.product_model.name}</span>}
            {question.tags && question.tags.length > 0 && (
              <span>标签: {question.tags.map(tag => tag.name).join(', ')}</span>
            )}
          </div>
          <div className="flex items-center space-x-4 text-sm text-muted-foreground mt-2">
            <div className="flex items-center space-x-1">
              <Eye className="h-4 w-4" />
              <span>{question.views_count} 次浏览</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className={`flex items-center space-x-1 ${question.is_liked ? 'text-primary' : ''}`}
              onClick={handleLike}
              disabled={liking}
            >
              <ThumbsUp className="h-4 w-4" />
              <span>{question.likes_count} 次点赞</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="flex items-center space-x-1"
              onClick={handleCopyAnswer}
              disabled={copying}
              aria-label="复制答案"
            >
              <Copy className="h-4 w-4" />
              <span>{copying ? '复制中...' : '复制答案'}</span>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div 
            className="prose prose-sm max-w-none mb-8"
            dangerouslySetInnerHTML={{ __html: marked(question.content) }}
          />
          
          {/* 视频播放器 */}
          {question.video_bilibili_bvid && (
            <div className="mb-8">
              <BilibiliVideo 
                bvid={question.video_bilibili_bvid} 
                title="视频演示"
                className="max-w-3xl mx-auto"
              />
            </div>
          )}
          
          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold mb-4">官方答案</h3>
            <div 
              className="prose prose-sm max-w-none"
              dangerouslySetInnerHTML={{ __html: marked(question.answer) }}
            />
          </div>
        </CardContent>
      </Card>

      {question?.related_questions && question.related_questions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">相关问题</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {question.related_questions.map((relatedQuestion) => (
                <Link
                  key={relatedQuestion.id}
                  href={`/faq/${relatedQuestion.id}`}
                  className="block p-3 rounded-lg hover:bg-muted transition-colors"
                >
                  <div className="font-medium">{relatedQuestion.title}</div>
                  {relatedQuestion.category && (
                    <div className="text-sm text-muted-foreground mt-1">
                      分类: {relatedQuestion.category.name}
                    </div>
                  )}
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
} 