'use client';

import { useRef, useEffect } from 'react';
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import ChatSidebar from '@/components/ChatSidebar';
import Header from '@/components/Header';
import { ChatProvider, useChatContext } from '@/contexts/ChatContext';
import { ChatMessage } from '@/components/ChatMessage';
import { ChatInput } from '@/components/ChatInput';

function ChatArea() {
  const { messages, isLoading, handleFeedbackChange } = useChatContext();
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  // 自动滚动到底部
  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <div className="flex-1 mb-4 p-4 overflow-hidden">
      <ScrollArea className="h-[calc(100vh-200px)]" ref={scrollAreaRef}>
        <div className="space-y-4">
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
      </ScrollArea>
    </div>
  );
}

function ChatPageContent() {
  const { currentChatId, sendMessage, handleChatSelect, handleNewChat, isLoading } = useChatContext();

  return (
    <div className="flex flex-col h-screen">
      
      <div className="flex flex-1 overflow-hidden">
        <ChatSidebar
          currentChatId={currentChatId}
          onChatSelect={handleChatSelect}
          onNewChat={handleNewChat}
        />

        <div className="flex flex-col flex-1 max-w-4xl mx-auto p-4">
          <Header />
          <ChatArea />
          <ChatInput onSendMessage={sendMessage} isLoading={isLoading} />
        </div>
      </div>
    </div>
  );
}

export default function ChatPage() {
  return (
    <ChatProvider>
      <ChatPageContent />
    </ChatProvider>
  );
}  