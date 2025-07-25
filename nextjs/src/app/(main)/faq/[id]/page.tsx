'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Loader2 } from 'lucide-react';
import type { FaqQuestion } from '@/types/faq';

export default function FaqDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [question, setQuestion] = useState<FaqQuestion | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadQuestion = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/faq/${params.id}`);
        
        if (!response.ok) {
          throw new Error('问题不存在');
        }
        
        const data = await response.json();
        setQuestion(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : '加载失败');
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
      <div className="container mx-auto px-8 py-4 max-w-4xl">
        <div className="mb-4">
          <Button 
            variant="ghost" 
            onClick={() => router.back()}
            className="flex items-center space-x-2"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>返回</span>
          </Button>
        </div>
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

  return (
    <div className="container mx-auto px-8 py-4 max-w-4xl h-full overflow-auto">
      <div className="mb-4">
        <Button 
          variant="ghost" 
          onClick={() => router.back()}
          className="flex items-center space-x-2"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>返回问答集</span>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-xl">
            {question.question}
          </CardTitle>
          <div className="flex items-center space-x-4 text-sm text-muted-foreground">
            <span>分类: {question.category_name}</span>
            {question.model_name && <span>机型: {question.model_name}</span>}
            {question.tags && question.tags.length > 0 && (
              <span>标签: {question.tags.join(', ')}</span>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div 
            className="prose prose-sm max-w-none"
            dangerouslySetInnerHTML={{ __html: question.answer }}
          />
        </CardContent>
      </Card>
    </div>
  );
} 