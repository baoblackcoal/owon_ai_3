import { useRef, useEffect, useState } from 'react';
import { useChatContext } from '@/contexts/ChatContext';
import { useUI } from '@/contexts/UIContext';
import { ChatMessage } from '@/components/ChatMessage';
import { Welcome } from './Welcome';

export function ChatArea() {
  const { messages, isLoading, handleFeedbackChange } = useChatContext();
  const { deviceType } = useUI();
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const [isAtBottom, setIsAtBottom] = useState(true);

  // 检测滚动位置
  const handleScroll = () => {
    if (!scrollAreaRef.current) return;
    
    const { scrollTop, scrollHeight, clientHeight } = scrollAreaRef.current;
    // 考虑一个小的误差范围（1px），因为有时候不会完全相等
    const isBottom = Math.abs(scrollHeight - scrollTop - clientHeight) <= 1;
    setIsAtBottom(isBottom);
  };

  // 滚动到底部
  const scrollToBottom = () => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  };

  // 监听滚动事件
  useEffect(() => {
    const scrollArea = scrollAreaRef.current;
    if (scrollArea) {
      scrollArea.addEventListener('scroll', handleScroll);
      return () => scrollArea.removeEventListener('scroll', handleScroll);
    }
  }, []);

  // 智能滚动：仅在底部时自动滚动
  useEffect(() => {
    if (isAtBottom) {
      scrollToBottom();
    }
  }, [messages, isAtBottom]);

  // 初始化时滚动到底部
  useEffect(() => {
    scrollToBottom();
  }, []);

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