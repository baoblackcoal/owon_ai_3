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
  const { messages, isLoading, handleFeedbackChange, sendMessage } = useChatContext();
  const { deviceType } = useUI();
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  // 自动滚动到底部
  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);

  interface CommonQuestion {
    text: string;
    icon: string;
  }
  
  const COMMON_QUESTIONS: CommonQuestion[] = [
    { text: "幅度是怎么计算？", icon: "📏"},
    { text: "如何使用光标测量？", icon: "📊"},
    { text: "如何进行示波器校准？", icon: "🔧"},
  ];

  const handleQuestionClick = async (question: string) => {
    await sendMessage(question);
  };

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
        {messages.length === 0 ? (
          // 欢迎页面
          <div className="h-full flex">
            <div className="flex flex-col items-center justify-center h-full py-30 px-8 text-center w-full" id="welcome-area">
              <div className="max-w-2xl">
                <h2 className="text-2xl font-bold mb-4 text-foreground">
                  欢迎使用 OWON AI 助手
                </h2>
                <p className="text-muted-foreground mb-8 text-lg">
                  我是您的专业测试测量设备助手，可以帮助您解答关于OWON的示波器、信号发生器等设备的问题。
                </p>
                
                <div className="space-y-4">                
                  <div className="grid gap-3">
                    {COMMON_QUESTIONS.map((question, index) => (
                      <button
                        key={index}
                        onClick={() => handleQuestionClick(question.text)}
                        disabled={isLoading}
                        className="p-4 bg-muted hover:bg-muted/80 rounded-lg text-left transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <div className="flex items-center">
                          <span className="text-primary mr-3">{question.icon}</span>
                          <span className="text-foreground">{question.text}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          // 聊天消息列表
          <div className="space-y-4 pt-4" id="chat-message-area">
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
      <div className="flex flex-1 overflow-hidden">
        {/* 侧边栏 - 在移动端会是 overlay */}
        <ChatSidebar
          currentChatId={currentChatId}
          onChatSelect={handleChatSelect}
          onNewChat={handleNewChat}
        />

        {/* 主聊天区域 */}
        <div className="flex flex-col flex-1 w-full">
          {/* 顶部导航 - 现在作为聊天区域的一部分 */}
          <div className="w-full">
            <Header />
          </div>
          
          <div className={`
            flex flex-col flex-1 overflow-hidden
            ${deviceType === 'desktop' ? 'max-w-4xl mx-auto w-full' : ''}
            ${deviceType === 'mobile' ? 'w-full' : ''}
          `} id="chat-area">
            <ChatArea />
            <div className={deviceType === 'mobile' ? 'px-2 pb-2' : 'px-4 pb-4'}>
              <ChatInput onSendMessage={sendMessage} isLoading={isLoading} />
            </div>
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