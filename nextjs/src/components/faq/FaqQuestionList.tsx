'use client';

import { useRouter } from 'next/navigation';
import { FileQuestion } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useFaq } from '@/contexts/FaqContext';
import FaqQuestionCard from './FaqQuestionCard';
import FaqQuestionListItem from './FaqQuestionListItem';

export default function FaqQuestionList() {
  const { questions, loading, filters, saveScrollPosition } = useFaq();
  const router = useRouter();

  const handleQuestionClick = (questionId: string) => {
    // 在导航前保存滚动位置
    saveScrollPosition();
    // 使用原始ID，因为数据库中的ID已经是正确的格式
    router.push(`/faq/${questionId}`);
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map(i => (
          <Skeleton key={i} className="h-32 w-full" />
        ))}
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="text-center py-12">
        <FileQuestion className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-medium text-foreground mb-2">未找到相关问题</h3>
        <p className="text-muted-foreground">尝试调整搜索条件或筛选器</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {questions.map((question) => (
        filters.viewMode === 'list' ? (
          <FaqQuestionListItem
            key={question.id}
            question={question}
            onClick={handleQuestionClick}
          />
        ) : (
          <FaqQuestionCard
            key={question.id}
            question={question}
            onClick={handleQuestionClick}
          />
        )
      ))}
    </div>
  );
} 