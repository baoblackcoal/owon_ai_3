'use client';

import { useRef, useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { ScrollArea } from "@/components/ui/scroll-area";
import ChatSidebar from '@/components/ChatSidebar';
import Header from '@/components/Header';
import { ChatProvider, useChatContext } from '@/contexts/ChatContext';
import { UIProvider, useUI } from '@/contexts/UIContext';
import { ChatMessage } from '@/components/ChatMessage';
import { ChatInput } from '@/components/ChatInput';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { instrumentType } from '@/lib/instrument-config';

function ChatArea() {
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
    <div className={`
      flex-1 mb-4 overflow-hidden
      ${deviceType === 'mobile' ? 'px-2' : 'px-4'}
    `}>
      <ScrollArea 
        className={`
          ${deviceType === 'mobile' 
            ? 'h-[calc(100vh-140px)]' 
            : 'h-[calc(100vh-200px)]'
          }
        `} 
        ref={scrollAreaRef}
      >
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
  return (
    <Suspense fallback={null}>
      <ChatPageInner />
    </Suspense>
  );
}

function ChatPageInner() {
  const { 
    currentChatId, 
    sendMessage, 
    handleChatSelect, 
    handleNewChat, 
    isLoading,
    instrument,
    series,
    setInstrumentSeries
  } = useChatContext();
  
  const { deviceType } = useUI();
  const searchParams = useSearchParams();
  const [showInstrumentModal, setShowInstrumentModal] = useState(false);

  // Handle URL parameters on initial load
  useEffect(() => {
    const urlInstrument = searchParams.get('instrument');
    const urlSeries = searchParams.get('series');
    
    if (urlInstrument && urlSeries) {
      // Validate against instrument config
      const isValidInstrument = Object.keys(instrumentType).includes(urlInstrument);
      const isValidSeries = isValidInstrument && 
                           Object.keys(instrumentType[urlInstrument].pipelineIds).includes(urlSeries);
      
      if (isValidInstrument && isValidSeries) {
        setInstrumentSeries(urlInstrument, urlSeries);
        setShowInstrumentModal(true);
      }
    }
  }, [searchParams, setInstrumentSeries]);

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      {/* 顶部导航 */}
      <Header />
      
      <div className="flex flex-1 overflow-hidden">
        {/* 侧边栏 - 在移动端会是 overlay */}
        <ChatSidebar
          currentChatId={currentChatId}
          onChatSelect={handleChatSelect}
          onNewChat={handleNewChat}
        />

        {/* 主聊天区域 */}
        <div className={`
          flex flex-col flex-1 overflow-hidden
          ${deviceType === 'desktop' ? 'max-w-4xl mx-auto' : ''}
          ${deviceType === 'mobile' ? 'w-full' : ''}
        `}>
          <ChatArea />
          <div className={deviceType === 'mobile' ? 'px-2 pb-2' : 'px-4 pb-4'}>
            <ChatInput onSendMessage={sendMessage} isLoading={isLoading} />
          </div>
        </div>
      </div>

      {/* Instrument Info Dialog */}
      <Dialog open={showInstrumentModal} onOpenChange={() => setShowInstrumentModal(false)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>仪器信息</DialogTitle>
          </DialogHeader>
          <DialogDescription>
            您的仪器是{instrumentType[instrument]?.name}，系列是{series}，
            AI对话将会使用相关知识库。
          </DialogDescription>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function ChatPage() {
  return (
    <UIProvider>
      <ChatProvider>
        <ChatPageContent />
      </ChatProvider>
    </UIProvider>
  );
}  