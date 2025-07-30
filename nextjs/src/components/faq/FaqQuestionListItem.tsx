'use client';

import { Eye, ThumbsUp, Video } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import type { FaqQuestion } from '@/types/faq';
import { formatTime } from '@/lib/faq-utils';

interface FaqQuestionListItemProps {
  question: FaqQuestion;
  onClick: (questionId: number) => void;
}

export default function FaqQuestionListItem({ question, onClick }: FaqQuestionListItemProps) {
  return (
    <div
      className="bg-card rounded-lg p-3 border hover:shadow-md transition-shadow cursor-pointer flex items-center justify-between"
      onClick={() => onClick(question.id)}
    >
      <div className="flex-1 min-w-0">
        {/* 标题 */}
        <h3 className="text-base font-medium text-foreground line-clamp-1 flex items-center gap-2 mb-1">
          {question.has_video && (
            <Video className="h-4 w-4 text-primary flex-shrink-0" />
          )}
          <span className="truncate">{question.title}</span>
        </h3>
        
        {/* 标签 */}
        <div className="flex flex-wrap gap-1 mb-2">
          {question.category && (
            <Badge variant="secondary" className="text-xs px-1.5 py-0.5">
              {question.category.name}
            </Badge>
          )}
          {question.product_model && (
            <Badge variant="outline" className="text-xs px-1.5 py-0.5">
              {question.product_model.name}
            </Badge>
          )}
        </div>
      </div>
      
      {/* 右侧指标 */}
      <div className="flex items-center gap-4 text-xs text-muted-foreground ml-4">
        <div className="flex items-center gap-1">
          <Eye className="h-3 w-3" />
          <span>{question.views_count}</span>
        </div>
        <div className="flex items-center gap-1">
          <ThumbsUp className="h-3 w-3" />
          <span>{question.likes_count}</span>
        </div>
        <span className="hidden sm:block">{formatTime(question.updated_at)}</span>
      </div>
    </div>
  );
} 