'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import ChatSidebar from '@/components/ChatSidebar';
import Header from '@/components/Header';
import { ChatProvider, useChatContext } from '@/contexts/ChatContext';
import { UIProvider, useUI } from '@/contexts/UIContext';
import { ChatInput } from '@/components/ChatInput';
import { instrumentType } from '@/lib/instrument-config';
import { ChatArea } from '@/components/chat/ChatArea';
import { InstrumentDialog } from '@/components/chat/InstrumentDialog';

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

  // 处理URL参数
  useEffect(() => {
    const urlInstrument = searchParams.get('instrument');
    const urlSeries = searchParams.get('series');
    
    if (urlInstrument && urlSeries) {
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
        {/* 侧边栏 */}
        <ChatSidebar
          currentChatId={currentChatId}
          onChatSelect={handleChatSelect}
          onNewChat={handleNewChat}
        />

        {/* 主聊天区域 */}
        <div className="flex flex-col flex-1 w-full">
          <div className="w-full">
            <Header />
          </div>
          
          <div className={`
            flex flex-col flex-1 overflow-hidden
            ${deviceType === 'desktop' ? 'max-w-4xl mx-auto w-full' : ''}
            ${deviceType === 'mobile' ? 'w-full' : ''}
          `} id="chat-area">
            <ChatArea />
            <ChatInput onSendMessage={sendMessage} isLoading={isLoading} />
          </div>
        </div>
      </div>

      <InstrumentDialog 
        open={showInstrumentModal}
        onOpenChange={setShowInstrumentModal}
        instrument={instrument}
        series={series}
      />
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

export default function ChatPage() {
  return (
    <UIProvider>
      <ChatProvider>
        <ChatPageContent />
      </ChatProvider>
    </UIProvider>
  );
}  