'use client';

import { Eye, ThumbsUp } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import type { FaqQuestion } from '@/types/faq';
import { formatTime } from '@/lib/faq-utils';

interface FaqQuestionCardProps {
  question: FaqQuestion;
  onClick: (questionId: string) => void;
}

export default function FaqQuestionCard({ question, onClick }: FaqQuestionCardProps) {
  return (
    <div
      className="bg-card rounded-lg p-4 border hover:shadow-md transition-shadow cursor-pointer"
      onClick={() => onClick(question.id)}
    >
      <div className="space-y-3">
        {/* 标题 */}
        <h3 className="text-lg font-medium text-foreground line-clamp-2">
          {question.title}
        </h3>
        
        {/* 内容预览 */}
        <p className="text-sm text-muted-foreground line-clamp-3">
          {question.content}
        </p>
        
        {/* 标签 */}
        <div className="flex flex-wrap gap-2">
          {question.category && (
            <Badge variant="secondary" className="text-xs">
              {question.category.name}
            </Badge>
          )}
          {question.product_model && (
            <Badge variant="outline" className="text-xs">
              {question.product_model.name}
            </Badge>
          )}
          {question.tags?.map((tag) => (
            <Badge key={tag.id} variant="outline" className="text-xs">
              {tag.name}
            </Badge>
          ))}
        </div>
        
        {/* 底部指标和时间 */}
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              <Eye className="h-3 w-3" />
              <span>{question.views_count}</span>
            </div>
            <div className="flex items-center gap-1">
              <ThumbsUp className="h-3 w-3" />
              <span>{question.likes_count}</span>
            </div>
          </div>
          <span>最后更新: {formatTime(question.updated_at)}</span>
        </div>
      </div>
    </div>
  );
} 