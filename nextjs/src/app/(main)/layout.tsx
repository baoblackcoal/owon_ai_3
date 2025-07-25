'use client';

import Header from "@/components/Header";
import ChatSidebar from '@/components/ChatSidebar';
import { ChatProvider } from '@/contexts/ChatContext';
import { UIProvider } from '@/contexts/UIContext';

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <UIProvider>
      <ChatProvider>
        <div className="flex h-screen overflow-hidden">
          <ChatSidebar />
          <div className="flex flex-col flex-1 overflow-hidden">
            <Header />
            <main className="flex-1 overflow-hidden">
              {children}
            </main>
          </div>
        </div>
      </ChatProvider>
    </UIProvider>
  );
} 