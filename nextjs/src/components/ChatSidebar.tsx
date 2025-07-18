'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useUI } from '@/contexts/UIContext';
import { ChevronLeft, ChevronRight, X, MessageSquare, Plus } from 'lucide-react';

interface ChatSession {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  messageCount: number;
}

interface ChatSidebarProps {
  currentChatId?: string;
  onChatSelect: (chatId: string) => void;
  onNewChat: () => void;
}

export default function ChatSidebar({ currentChatId, onChatSelect, onNewChat }: ChatSidebarProps) {
  const { data: session, status } = useSession();
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
  const [loading, setLoading] = useState(true);
  
  const { 
    sidebarCollapsed, 
    mobileSidebarOpen, 
    deviceType, 
    toggleSidebar, 
    setMobileSidebarOpen 
  } = useUI();

  // 加载历史对话列表
  const loadChatHistory = async () => {
    try {
      const response = await fetch('/api/chat/history');
      if (response.ok) {
        const sessions = await response.json() as ChatSession[];
        setChatSessions(sessions);
      } else {
        // 如果未登录，清空聊天历史
        setChatSessions([]);
      }
    } catch (error) {
      console.error('加载历史对话失败:', error);
      setChatSessions([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (status !== 'loading') {
      loadChatHistory();
    }
  }, [status]);

  // 删除对话
  const handleDeleteChat = async (chatId: string, e: React.MouseEvent) => {
    e.stopPropagation(); // 阻止事件冒泡
    
    if (!confirm('确定要删除这个对话吗？')) return;

    try {
      const response = await fetch(`/api/chat/${chatId}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        setChatSessions(prev => prev.filter(session => session.id !== chatId));
        if (currentChatId === chatId) {
          onNewChat(); // 如果删除的是当前对话，创建新对话
        }
      }
    } catch (error) {
      console.error('删除对话失败:', error);
    }
  };

  // 格式化时间显示
  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffTime = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      return date.toLocaleTimeString('zh-CN', { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    } else if (diffDays === 1) {
      return '昨天';
    } else if (diffDays < 7) {
      return `${diffDays}天前`;
    } else {
      return date.toLocaleDateString('zh-CN', { 
        month: 'short', 
        day: 'numeric' 
      });
    }
  };

  const handleChatSelectAndCloseMobile = (chatId: string) => {
    onChatSelect(chatId);
    if (deviceType === 'mobile') {
      setMobileSidebarOpen(false);
    }
  };

  const handleNewChatAndCloseMobile = () => {
    onNewChat();
    if (deviceType === 'mobile') {
      setMobileSidebarOpen(false);
    }
  };

  // 移动端：overlay 模式
  if (deviceType === 'mobile') {
    return (
      <>
        {/* 移动端遮罩层 */}
        {mobileSidebarOpen && (
          <div 
            className="fixed inset-0 bg-black/50 z-40 transition-opacity duration-300"
            onClick={() => setMobileSidebarOpen(false)}
          />
        )}
        
        {/* 移动端侧边栏 */}
        <div className={`
          fixed top-0 left-0 h-full w-80 bg-background border-r z-50
          transform transition-transform duration-300 ease-in-out
          ${mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        `}>
          <SidebarContent 
            loading={loading}
            status={status}
            session={session}
            chatSessions={chatSessions}
            currentChatId={currentChatId}
            sidebarCollapsed={false}
            onNewChat={handleNewChatAndCloseMobile}
            onChatSelect={handleChatSelectAndCloseMobile}
            onDeleteChat={handleDeleteChat}
            formatTime={formatTime}
            showCloseButton={true}
            onClose={() => setMobileSidebarOpen(false)}
          />
        </div>
      </>
    );
  }

  // 桌面端和平板端：固定侧边栏
  return (
    <div className={`
      relative h-full bg-background border-r flex flex-col
      transition-all duration-300 ease-in-out
      ${sidebarCollapsed ? 'w-16' : 'w-64'}
    `}>
      {/* 折叠/展开按钮 */}
      <div className="absolute -right-3 top-6 z-10">
        <Button
          variant="outline"
          size="sm"
          className="h-6 w-6 rounded-full p-0 shadow-md bg-background hover:bg-accent"
          onClick={toggleSidebar}
        >
          {sidebarCollapsed ? (
            <ChevronRight className="h-3 w-3" />
          ) : (
            <ChevronLeft className="h-3 w-3" />
          )}
        </Button>
      </div>

      <SidebarContent 
        loading={loading}
        status={status}
        session={session}
        chatSessions={chatSessions}
        currentChatId={currentChatId}
        sidebarCollapsed={sidebarCollapsed}
        onNewChat={onNewChat}
        onChatSelect={onChatSelect}
        onDeleteChat={handleDeleteChat}
        formatTime={formatTime}
      />
    </div>
  );
}

// 侧边栏内容组件，复用于移动端和桌面端
interface SidebarContentProps {
  loading: boolean;
  status: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  session: any;  // 由于 NextAuth v5 beta 版本的类型兼容性问题，暂时使用 any
  chatSessions: ChatSession[];
  currentChatId?: string;
  sidebarCollapsed: boolean;
  onNewChat: () => void;
  onChatSelect: (chatId: string) => void;
  onDeleteChat: (chatId: string, e: React.MouseEvent) => void;
  formatTime: (timestamp: string) => string;
  showCloseButton?: boolean;
  onClose?: () => void;
}

function SidebarContent({
  loading,
  status,
  session,
  chatSessions,
  currentChatId,
  sidebarCollapsed,
  onNewChat,
  onChatSelect,
  onDeleteChat,
  formatTime,
  showCloseButton = false,
  onClose
}: SidebarContentProps) {
  return (
    <>
      {/* 头部 */}
      <div className="p-4 border-b flex items-center justify-between">
        {showCloseButton && (
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
        
        {!sidebarCollapsed ? (
          <Button 
            onClick={onNewChat}
            className="flex-1 ml-2"
            variant="default"
          >
            <Plus className="h-4 w-4 mr-2" />
            发起新对话
          </Button>
        ) : (
          <Button 
            onClick={onNewChat}
            className="h-10 w-10 p-0"
            variant="default"
            title="发起新对话"
          >
            <Plus className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* 历史对话列表 */}
      <ScrollArea className="flex-1 p-2">
        {loading || status === 'loading' ? (
          <div className="text-center text-muted-foreground py-4">
            {sidebarCollapsed ? <MessageSquare className="h-4 w-4 mx-auto" /> : '加载中...'}
          </div>
        ) : !session ? (
          <div className="text-center text-muted-foreground py-4">
            {sidebarCollapsed ? (
              <MessageSquare className="h-4 w-4 mx-auto opacity-50" />
            ) : (
              <p>请登录以查看历史对话</p>
            )}
          </div>
        ) : chatSessions.length === 0 ? (
          <div className="text-center text-muted-foreground py-4">
            {sidebarCollapsed ? (
              <MessageSquare className="h-4 w-4 mx-auto opacity-50" />
            ) : (
              '暂无历史对话'
            )}
          </div>
        ) : (
          <div className="space-y-2">
            {chatSessions.map((session) => (
              <Card
                key={session.id}
                className={`
                  cursor-pointer hover:bg-accent transition-all duration-200 group
                  ${currentChatId === session.id ? 'bg-accent border-primary/50' : ''}
                  ${sidebarCollapsed ? 'p-2' : 'p-3'}
                `}
                onClick={() => onChatSelect(session.id)}
                title={sidebarCollapsed ? session.title : undefined}
              >
                {sidebarCollapsed ? (
                  <div className="flex justify-center">
                    <MessageSquare className="h-4 w-4" />
                  </div>
                ) : (
                  <div className="flex justify-between items-start">
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm truncate">
                        {session.title}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {formatTime(session.updatedAt)} • {session.messageCount} 条消息
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="opacity-0 group-hover:opacity-100 transition-opacity ml-2 h-6 w-6 p-0 hover:bg-destructive hover:text-destructive-foreground"
                      onClick={(e) => onDeleteChat(session.id, e)}
                      title="删除对话"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                )}
              </Card>
            ))}
          </div>
        )}
      </ScrollArea>
    </>
  );
} 