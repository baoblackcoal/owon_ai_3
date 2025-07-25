'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  ArrowLeft, 
  Eye, 
  ThumbsUp, 
  Copy,
  Calendar,
  Tag,
  Layers,
  Settings 
} from 'lucide-react';
import { toast } from 'sonner';
import type { 
  FaqDetailResponse,
  FaqQuestion,
  FaqAnswer 
} from '@/types/faq';

export default function FaqDetailPage() {
  const router = useRouter();
  const params = useParams();
  const questionId = params.id as string;
  
  const [data, setData] = useState<FaqDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 获取问题详情
  useEffect(() => {
    if (!questionId) return;
    
    const fetchDetail = async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/faq/${questionId}`);
        if (!response.ok) {
          if (response.status === 404) {
            setError('问题不存在');
          } else {
            setError('获取问题详情失败');
          }
          return;
        }
        const result: FaqDetailResponse = await response.json();
        setData(result);
      } catch (error) {
        console.error('Failed to fetch FAQ detail:', error);
        setError('获取问题详情失败');
      } finally {
        setLoading(false);
      }
    };

    fetchDetail();
  }, [questionId]);

  // 复制答案到剪贴板
  const handleCopyAnswer = async (content: string) => {
    try {
      await navigator.clipboard.writeText(content);
      toast.success('已复制到剪贴板');
    } catch (error) {
      console.error('Failed to copy:', error);
      toast.error('复制失败');
    }
  };

  // 点赞功能（暂时只是 UI，后续实现 API）
  const handleLike = (type: 'question' | 'answer', id: string) => {
    toast.info('点赞功能即将上线');
  };

  // 格式化时间
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

  // 返回上一页
  const handleBack = () => {
    router.back();
  };

  // 跳转到相关问题
  const handleRelatedClick = (relatedId: string) => {
    router.push(`/faq/${relatedId}`);
  };

  if (loading) {
    return (
      <div className="container mx-auto px-8 py-4 max-w-5xl">
        <div className="mb-6">
          <Skeleton className="h-10 w-32 mb-4" />
          <Skeleton className="h-8 w-3/4 mb-2" />
          <Skeleton className="h-20 w-full" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Skeleton className="h-40 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
          <div className="space-y-4">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="container mx-auto px-8 py-4 max-w-5xl">
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold text-foreground mb-2">
            {error || '加载失败'}
          </h2>
          <p className="text-muted-foreground mb-4">
            抱歉，无法加载问题详情，请稍后再试
          </p>
          <Button onClick={handleBack}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            返回
          </Button>
        </div>
      </div>
    );
  }

  const { question, answers, related_questions } = data;

  return (
    <div className="container mx-auto px-8 py-4 max-w-5xl">
      {/* 返回按钮和面包屑 */}
      <div className="mb-6">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={handleBack}
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          返回问答集
        </Button>
        
        {/* 问题标题 */}
        <h1 className="text-2xl lg:text-3xl font-bold text-foreground mb-4 line-clamp-2">
          {question.title}
        </h1>
        
        {/* 问题内容 */}
        <div className="prose prose-slate dark:prose-invert max-w-none mb-6">
          <p className="text-muted-foreground whitespace-pre-wrap">
            {question.content}
          </p>
        </div>
      </div>

      {/* 主要内容区域 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 左侧：答案区域 */}
        <div className="lg:col-span-2 space-y-6">
          {/* 问题操作栏 */}
          <div className="flex items-center justify-between py-4 border-y">
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Eye className="h-4 w-4" />
                <span>{question.views_count} 次浏览</span>
              </div>
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                <span>创建于 {formatTime(question.created_at)}</span>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => handleLike('question', question.id)}
              >
                <ThumbsUp className="mr-2 h-4 w-4" />
                {question.likes_count}
              </Button>
            </div>
          </div>

          {/* 答案列表 */}
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-foreground">
              解答 ({answers.length})
            </h2>
            
            {answers.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                暂无解答
              </div>
            ) : (
              answers.map((answer, index) => (
                <div 
                  key={answer.id} 
                  className="bg-card rounded-lg p-6 border space-y-4"
                >
                  {/* 答案内容 */}
                  <div className="prose prose-slate dark:prose-invert max-w-none">
                    <div className="whitespace-pre-wrap text-foreground">
                      {answer.content}
                    </div>
                  </div>
                  
                  {/* 答案元数据 */}
                  {(answer.software_version || answer.product_model) && (
                    <div className="flex flex-wrap gap-2 pt-4 border-t">
                      {answer.software_version && (
                        <Badge variant="outline" className="text-xs">
                          <Settings className="mr-1 h-3 w-3" />
                          {answer.software_version}
                        </Badge>
                      )}
                      {answer.product_model && (
                        <Badge variant="outline" className="text-xs">
                          <Layers className="mr-1 h-3 w-3" />
                          {answer.product_model.name}
                        </Badge>
                      )}
                    </div>
                  )}
                  
                  {/* 答案操作 */}
                  <div className="flex items-center justify-between pt-4 border-t">
                    <div className="text-xs text-muted-foreground">
                      发布于 {formatTime(answer.created_at)}
                    </div>
                    <div className="flex items-center gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleCopyAnswer(answer.content)}
                      >
                        <Copy className="mr-2 h-4 w-4" />
                        复制
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleLike('answer', answer.id)}
                      >
                        <ThumbsUp className="mr-2 h-4 w-4" />
                        {answer.likes_count}
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* 右侧：元数据和相关问题 */}
        <div className="space-y-6">
          {/* 问题元数据 */}
          <div className="bg-card rounded-lg p-4 border space-y-4">
            <h3 className="font-semibold text-foreground">问题信息</h3>
            
            {/* 分类 */}
            {question.category && (
              <div className="space-y-2">
                <div className="text-sm font-medium text-muted-foreground">分类</div>
                <Badge variant="secondary">
                  <Layers className="mr-1 h-3 w-3" />
                  {question.category.name}
                </Badge>
              </div>
            )}
            
            {/* 机型 */}
            {question.product_model && (
              <div className="space-y-2">
                <div className="text-sm font-medium text-muted-foreground">机型</div>
                <Badge variant="outline">
                  <Settings className="mr-1 h-3 w-3" />
                  {question.product_model.name}
                </Badge>
              </div>
            )}
            
            {/* 软件版本 */}
            {question.software_version && (
              <div className="space-y-2">
                <div className="text-sm font-medium text-muted-foreground">软件版本</div>
                <Badge variant="outline">
                  {question.software_version}
                </Badge>
              </div>
            )}
            
            {/* 标签 */}
            {question.tags && question.tags.length > 0 && (
              <div className="space-y-2">
                <div className="text-sm font-medium text-muted-foreground">标签</div>
                <div className="flex flex-wrap gap-1">
                  {question.tags.map((tag) => (
                    <Badge key={tag.id} variant="outline" className="text-xs">
                      <Tag className="mr-1 h-3 w-3" />
                      {tag.name}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* 相关问题 */}
          {related_questions && related_questions.length > 0 && (
            <div className="bg-card rounded-lg p-4 border space-y-4">
              <h3 className="font-semibold text-foreground">相关问题</h3>
              <div className="space-y-3">
                {related_questions.map((relatedQ) => (
                  <div 
                    key={relatedQ.id}
                    className="cursor-pointer p-3 rounded-md hover:bg-muted/50 transition-colors"
                    onClick={() => handleRelatedClick(relatedQ.id)}
                  >
                    <h4 className="text-sm font-medium text-foreground line-clamp-2 mb-2">
                      {relatedQ.title}
                    </h4>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Eye className="h-3 w-3" />
                        <span>{relatedQ.views_count}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <ThumbsUp className="h-3 w-3" />
                        <span>{relatedQ.likes_count}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 