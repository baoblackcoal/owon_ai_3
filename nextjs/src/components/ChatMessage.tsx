import { marked } from 'marked';
import { Message } from '@/types/chat';
import { MessageActionBar } from './MessageActionBar';

interface ChatMessageProps {
  message: Message;
  index: number;
  isLoading: boolean;
  onFeedbackChange: (messageId: string, feedback: 'like' | 'dislike' | null) => Promise<void>;
}

export function ChatMessage({ message, index, isLoading, onFeedbackChange }: ChatMessageProps) {
  return (
    <div className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
      <div className="max-w-[80%]">
        <div
          className={`rounded-lg p-4 ${
            message.role === 'user'
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted'
          }`}
          id={message.role === 'user' ? `user-message-${index}` : `assistant-message-${index}`}
        >
          {message.content ? (
            <div dangerouslySetInnerHTML={{ __html: marked(message.content) }} />
          ) : (
            message.role === 'assistant' && isLoading ? '正在思考...' : ''
          )}
        </div>
        
        {message.role === 'assistant' && (
          <MessageActionBar
            messageId={message.id}
            content={message.content}
            feedback={message.feedback}
            onFeedbackChange={onFeedbackChange}
            disabled={isLoading}
          />
        )}
      </div>
    </div>
  );
} 