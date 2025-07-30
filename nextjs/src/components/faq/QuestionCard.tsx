'use client';

import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Heart, Eye, Clock } from 'lucide-react';
import { FaqCardProps } from '@/types/faq';
import { formatDistanceToNow } from 'date-fns';
import { zhCN } from 'date-fns/locale';

export function QuestionCard({ 
  question, 
  viewMode, 
  onLike, 
  onClick 
}: FaqCardProps) {
  const handleLike = (e: React.MouseEvent) => {
    e.stopPropagation();
    onLike?.(question.id);
  };

  const handleClick = () => {
    onClick?.(question.id);
  };

  const formatTime = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), {
        addSuffix: true,
        locale: zhCN,
      });
    } catch {
      return '未知时间';
    }
  };

  const truncateText = (text: string, maxLength: number) => {
    if (text.length <= maxLength) return text;
    return text.slice(0, maxLength) + '...';
  };

  if (viewMode === 'list') {
    return (
      <div
        className="flex items-center justify-between p-4 border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors"
        onClick={handleClick}
      >
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-medium text-gray-900 truncate">
            {question.title}
          </h3>
          
          <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
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
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {formatTime(question.created_at)}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-6 ml-4">
          <div className="flex items-center gap-1 text-sm text-gray-500">
            <Eye className="w-4 h-4" />
            {question.views_count}
          </div>
          
          <Button
            variant="ghost"
            size="sm"
            className={`flex items-center gap-1 ${
              question.is_liked ? 'text-red-500' : 'text-gray-500'
            }`}
            onClick={handleLike}
          >
            <Heart 
              className={`w-4 h-4 ${question.is_liked ? 'fill-current' : ''}`} 
            />
            {question.likes_count}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <Card 
      className="cursor-pointer hover:shadow-lg transition-shadow"
      onClick={handleClick}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-medium text-gray-900 line-clamp-2">
              {question.title}
            </h3>
            
            <div className="flex items-center gap-2 mt-2">
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
              {question.software_version && (
                <Badge variant="outline" className="text-xs">
                  v{question.software_version}
                </Badge>
              )}
            </div>
          </div>

          <Button
            variant="ghost"
            size="sm"
            className={`ml-2 ${
              question.is_liked ? 'text-red-500' : 'text-gray-500'
            }`}
            onClick={handleLike}
          >
            <Heart 
              className={`w-4 h-4 ${question.is_liked ? 'fill-current' : ''}`} 
            />
            {question.likes_count}
          </Button>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <div className="space-y-3">
          {/* 问题内容预览 */}
          <p className="text-sm text-gray-600 line-clamp-2">
            {truncateText(question.content, 150)}
          </p>

          {/* 答案预览 */}
          <div className="p-3 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-700 line-clamp-3">
              {truncateText(question.answer, 200)}
            </p>
          </div>

          {/* 标签 */}
          {question.tags && question.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {question.tags.slice(0, 3).map((tag) => (
                <Badge key={tag.id} variant="outline" className="text-xs">
                  #{tag.name}
                </Badge>
              ))}
              {question.tags.length > 3 && (
                <Badge variant="outline" className="text-xs">
                  +{question.tags.length - 3}
                </Badge>
              )}
            </div>
          )}

          {/* 底部信息 */}
          <div className="flex items-center justify-between pt-2 border-t border-gray-100">
            <div className="flex items-center gap-4 text-sm text-gray-500">
              <span className="flex items-center gap-1">
                <Eye className="w-3 h-3" />
                {question.views_count}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {formatTime(question.created_at)}
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 