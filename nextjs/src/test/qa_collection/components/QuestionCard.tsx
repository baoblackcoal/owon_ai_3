import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Question } from '../types';
import { getCategoryName, getModelName } from '../mockData';
import { Eye, ThumbsUp, MessageCircle } from 'lucide-react';

interface QuestionCardProps {
  question: Question;
}

export function QuestionCard({ question }: QuestionCardProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <Card className="p-4 gap-2 hover:shadow-md transition-shadow cursor-pointer">
      {/* 标题和内容预览 */}
      <div className="mb-3">
        <h3 className="text-base font-semibold mb-2 line-clamp-2 hover:text-primary">
          {question.title}
        </h3>
        <p className="text-sm text-foreground/80 line-clamp-2">
          {question.content}
        </p>
      </div>

      {/* 标签区域 - 更柔和的样式 */}
      <div className="flex flex-wrap gap-1.5 mb-3">
        <Badge variant="secondary" className="text-[10px] px-1.5 py-0 bg-secondary/50 text-secondary-foreground/70">
          {getCategoryName(question.category_id)}
        </Badge>
        <Badge variant="secondary" className="text-[10px] px-1.5 py-0 bg-secondary/50 text-secondary-foreground/70">
          {getModelName(question.product_model_id)}
        </Badge>
        {question.tags.map((tag) => (
          <Badge 
            key={tag.id} 
            variant="secondary" 
            className="text-[10px] px-1.5 py-0 bg-secondary/50 text-secondary-foreground/70"
          >
            {tag.name}
          </Badge>
        ))}
      </div>

      {/* 统计信息和时间 */}
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1">
            <Eye className="w-3.5 h-3.5" />
            <span>{question.views_count}</span>
          </span>
          <span className="flex items-center gap-1">
            <ThumbsUp className="w-3.5 h-3.5" />
            <span>{question.likes_count}</span>
          </span>
          {/* <span className="flex items-center gap-1">
            <MessageCircle className="w-3.5 h-3.5" />
            <span>{question.replies_count}</span>
          </span> */}
        </div>
        <div className="text-xs">
          <span>最后更新: {formatDate(question.updated_at)}</span>
        </div>
      </div>
    </Card>
  );
} 