import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import remarkGfm from 'remark-gfm';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css'; 
import { Message } from '@/types/chat';
import { MessageActionBar } from './MessageActionBar';
import { useUI } from '@/contexts/UIContext';

interface ChatMessageProps {
  message: Message;
  index: number;
  isLoading: boolean;
  onFeedbackChange: (messageId: string, feedback: 'like' | 'dislike' | null) => Promise<void>;
}

export function ChatMessage({ message, index, isLoading, onFeedbackChange }: ChatMessageProps) {
  const { deviceType } = useUI();
  const isUser = message.role === 'user';
  const isAssistant = message.role === 'assistant';

  // 加载状态下的动画文本
  const LoadingIndicator = () => (
    <div className="flex items-center space-x-1">
      <span>正在思考</span>
      <div className="flex space-x-1">
        <div className="w-1 h-1 bg-current rounded-full loading-dots"></div>
        <div className="w-1 h-1 bg-current rounded-full loading-dots" style={{ animationDelay: '0.2s' }}></div>
        <div className="w-1 h-1 bg-current rounded-full loading-dots" style={{ animationDelay: '0.4s' }}></div>
      </div>
    </div>
  );

  const rehypePlugins = [
    [rehypeKatex, { throwOnError: false }]
  ] as any; // eslint-disable-line @typescript-eslint/no-explicit-any

  return (
    <div className={`
      flex items-start gap-3 message-enter
      ${isUser ? 'flex-row-reverse justify-start' : 'flex-row'}
    `}>
      {/* 消息内容 */}
      <div className={`
        ${isUser ? 'max-w-[80%]' : 'w-full'}
        ${deviceType === 'mobile' ? 'max-w-[calc(100%-2rem)]' : ''}
      `}>
        {/* 消息气泡 */}
        <div
          className={`
            ${isUser 
              ? 'bg-primary text-primary-foreground rounded-lg inline-block ml-auto p-4' 
              : 'text-foreground'}
            ${!message.content && isAssistant && isLoading ? 'animate-pulse' : ''}            
          `}
          id={isUser ? `user-message-${index}` : `assistant-message-${index}`}
        >
          
          {/* 深度思考 - reasoning */}
          {isAssistant && message.thought && (
            <details className="mt-2 text-xs text-muted-foreground pb-4" open>
              <summary className="cursor-pointer select-none ">深度思考</summary>
              <div className="mt-1 whitespace-pre-wrap">
                              <ReactMarkdown
                remarkPlugins={[remarkMath, remarkGfm]}
                rehypePlugins={rehypePlugins}
              >
                {message.thought}
              </ReactMarkdown>
              </div>
            </details>
          )}

          {message.content ? (
            <div 
              className={`
                ${isUser ? 'prose-invert' : 'dark:prose-invert  [&_p]:mb-2'}

                [&_table]:border-collapse [&_table]:w-full [&_table]:border [&_table]:border-border
                [&_th]:border [&_th]:border-border [&_th]:p-2 [&_th]:text-left [&_th]:font-semibold [&_th]:bg-muted/30
                [&_td]:border [&_td]:border-border [&_td]:p-2
              `}
            >
              <ReactMarkdown
                remarkPlugins={[remarkMath, remarkGfm]}
                rehypePlugins={rehypePlugins}
              >
                {message.content}
              </ReactMarkdown>
            </div>
          ) : (
            isAssistant && isLoading ? (
              <div className="text-muted-foreground">
                <LoadingIndicator />
              </div>
            ) : null
          )}
        </div>
        

        {/* 操作栏 - 只在 AI 消息上显示 */}
        {isAssistant && message.content && (
          <div className={`
            mt-2 
            ${isUser ? 'flex justify-end' : 'flex justify-start'}
          `}>
            <MessageActionBar
              messageId={message.id}
              content={message.content}
              feedback={message.feedback}
              onFeedbackChange={onFeedbackChange}
              disabled={isLoading}
            />
          </div>
        )}
      </div>
    </div>
  );
}
 