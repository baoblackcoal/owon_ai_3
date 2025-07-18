import { marked } from 'marked';
import { Message } from '@/types/chat';
import { MessageActionBar } from './MessageActionBar';
import { User, Bot } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
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

  return (
    <div className={`
      flex items-start gap-3 message-enter
      ${isUser ? 'flex-row-reverse' : 'flex-row'}
      ${deviceType === 'mobile' ? 'mx-2' : 'mx-4'}
    `}>
      {/* 头像 */}
      <Avatar className={`
        flex-shrink-0 
        ${deviceType === 'mobile' ? 'w-8 h-8' : 'w-10 h-10'}
        ${isUser ? 'order-last' : 'order-first'}
      `}>
        <AvatarFallback className={`
          ${isUser 
            ? 'bg-primary text-primary-foreground' 
            : 'bg-secondary text-secondary-foreground'
          }
        `}>
          {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
        </AvatarFallback>
      </Avatar>

      {/* 消息内容 */}
      <div className={`
        flex-1 max-w-none
        ${deviceType === 'mobile' ? 'max-w-[calc(100%-3rem)]' : 'max-w-[80%]'}
      `}>
        {/* 消息气泡 */}
        <div
          className={`
            p-3 text-responsive-sm
            ${deviceType === 'mobile' ? 'p-3' : 'p-4'}
            ${isUser 
              ? 'chat-bubble-user ml-auto' 
              : 'chat-bubble-assistant'
            }
            ${!message.content && isAssistant && isLoading ? 'animate-pulse' : ''}
          `}
          id={isUser ? `user-message-${index}` : `assistant-message-${index}`}
        >
          {message.content ? (
            <div 
              className={`
                prose prose-sm max-w-none
                ${isUser ? 'prose-invert' : 'dark:prose-invert'}
                prose-p:my-2 prose-p:leading-relaxed
                prose-code:bg-muted prose-code:px-1 prose-code:py-0.5 prose-code:rounded
                prose-pre:bg-muted prose-pre:border
              `}
              dangerouslySetInnerHTML={{ __html: marked(message.content) }} 
            />
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