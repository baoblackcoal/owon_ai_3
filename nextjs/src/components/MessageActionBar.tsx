import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Copy, ThumbsUp, ThumbsDown, Check } from 'lucide-react';

interface MessageActionBarProps {
  messageId?: string;
  content: string;
  feedback?: 'like' | 'dislike' | null;
  onFeedbackChange?: (messageId: string, feedback: 'like' | 'dislike' | null) => void;
  disabled?: boolean;
}

export function MessageActionBar({ 
  messageId, 
  content, 
  feedback, 
  onFeedbackChange, 
  disabled = false 
}: MessageActionBarProps) {
  const [copySuccess, setCopySuccess] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      console.error('复制失败:', err);
    }
  };

  const handleFeedback = async (type: 'like' | 'dislike') => {
    if (!messageId || !onFeedbackChange || disabled || isUpdating) return;

    setIsUpdating(true);
    try {
      // 如果点击的是当前状态，则取消；否则设置新状态
      const newFeedback = feedback === type ? null : type;
      await onFeedbackChange(messageId, newFeedback);
    } finally {
      setIsUpdating(false);
    }
  };

  // 只有在SSE流结束且有messageId时才显示操作栏
  if (!messageId) {
    return null;
  }

  return (
    <div className="flex items-center gap-2 opacity-70 hover:opacity-100 transition-opacity">
      <Button
        variant="ghost"
        size="sm"
        onClick={handleCopy}
        disabled={disabled}
        className="h-8 w-8 p-0"
        title={copySuccess ? '已复制' : '复制'}
      >
        {copySuccess ? (
          <Check className="h-4 w-4" />
        ) : (
          <Copy className="h-4 w-4" />
        )}
      </Button>

      <Button
        variant="ghost"
        size="sm"
        onClick={() => handleFeedback('like')}
        disabled={disabled || isUpdating}
        className={`h-8 w-8 p-0 ${
          feedback === 'like' ? 'text-green-600 bg-green-50' : ''
        }`}
        title="点赞"
      >
        <ThumbsUp className="h-4 w-4" />
      </Button>

      <Button
        variant="ghost"
        size="sm"
        onClick={() => handleFeedback('dislike')}
        disabled={disabled || isUpdating}
        className={`h-8 w-8 p-0 ${
          feedback === 'dislike' ? 'text-red-600 bg-red-50' : ''
        }`}
        title="点踩"
      >
        <ThumbsDown className="h-4 w-4" />
      </Button>
    </div>
  );
} 