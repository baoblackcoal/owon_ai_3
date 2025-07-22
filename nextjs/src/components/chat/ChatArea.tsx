import { useRef, useEffect } from 'react';
import { useChatContext } from '@/contexts/ChatContext';
import { useUI } from '@/contexts/UIContext';
import { ChatMessage } from '@/components/ChatMessage';
import { Welcome } from './Welcome';

export function ChatArea() {
  const { messages, isLoading, handleFeedbackChange } = useChatContext();
  const { deviceType } = useUI();
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  // 自动滚动到底部
  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <div className="flex-1 overflow-hidden">
      <div 
        className={`
          ${deviceType === 'mobile' 
            ? 'h-[calc(100vh-200px)]' 
            : 'h-[calc(100vh-200px)]'
          }
          overflow-y-auto
          scrollbar-thin scrollbar-track-transparent scrollbar-thumb-gray-300 
          hover:scrollbar-thumb-gray-400 dark:scrollbar-thumb-gray-600 
          dark:hover:scrollbar-thumb-gray-500
        `}
        style={{
          scrollbarGutter: 'stable',
          scrollbarWidth: 'thin',
        }}
        ref={scrollAreaRef}
      >
        {messages.length === 0 ? (
          <Welcome />
        ) : (
          <div className="space-y-4 pt-4 mx-4
                [&_h1]:mb-2
                [&_h2]:mb-2 
                [&_h3]:mb-2
                [&_h4]:mb-2
                [&_h5]:mb-2
                [&_h6]:mb-2
                [&_ul]:ml-4 [&_ol]:ml-4 
                [&_ul]:mb-4 [&_ol]:mb-4 
                [&_strong]:font-bold
                " id="chat-message-area">
            {messages.map((message, index) => (
              <ChatMessage
                key={index}
                message={message}
                index={index}
                isLoading={isLoading}
                onFeedbackChange={handleFeedbackChange}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
} 