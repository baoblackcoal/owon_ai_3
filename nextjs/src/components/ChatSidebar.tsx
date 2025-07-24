'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useUI } from '@/contexts/UIContext';
import { useChatContext } from '@/contexts/ChatContext';
import { ChevronLeft, ChevronRight, X, Plus, Headphones } from 'lucide-react';
import { TooltipProvider } from '@radix-ui/react-tooltip';
import { ActionTooltip } from './ui/ActionTooltip';
import ServiceDialog from './ServiceDialog';

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
  const [showServiceDialog, setShowServiceDialog] = useState(false);
  const { setHistoryRefreshCallback } = useChatContext();
  
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

  // 注册历史刷新回调
  useEffect(() => {
    setHistoryRefreshCallback(loadChatHistory);
    return () => setHistoryRefreshCallback(null);
  }, [setHistoryRefreshCallback]);

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
          fixed top-0 left-0 h-full w-80 bg-muted  border-r z-50
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
            toggleSidebar={toggleSidebar}
            onServiceClick={() => setShowServiceDialog(true)}
          />
        </div>
        
        <ServiceDialog
          isOpen={showServiceDialog}
          onClose={() => setShowServiceDialog(false)}
        />
      </>
    );
  }

  // 桌面端和平板端：固定侧边栏
  return (
    <>
      <div className={`
        relative h-full bg-muted border-r flex flex-col
        transition-all duration-300 ease-in-out
        ${sidebarCollapsed ? 'w-16' : 'w-64'}
      `}>
        

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
          toggleSidebar={toggleSidebar}
          onServiceClick={() => setShowServiceDialog(true)}
        />
      </div>
      
      <ServiceDialog
        isOpen={showServiceDialog}
        onClose={() => setShowServiceDialog(false)}
      />
    </>
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
  toggleSidebar: () => void;
  onServiceClick?: () => void;
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
  toggleSidebar,
  onServiceClick
}: SidebarContentProps) {
  return (
    <TooltipProvider>
      {/* 头部 */}
      <div className={`p-4  bg-muted flex flex-col gap-2 ${sidebarCollapsed ? '' : 'border-b'}`}>
        {/* 桌面端侧边栏折叠/展开按钮 */}
        {!showCloseButton && (
          <ActionTooltip
            label={sidebarCollapsed ? "展开侧边栏" : "收起侧边栏"}
            side="right"
            align="center"
            sideOffset={10}
            enabled={sidebarCollapsed}
          >
            <Button
              id="toggle-sidebar"
              variant="ghost"
              className={!sidebarCollapsed ? "w-full hover:bg-background" : "h-10 w-10 p-0 hover:bg-background"}
              onClick={toggleSidebar}
              aria-label={sidebarCollapsed ? "展开侧边栏" : "收起侧边栏"}
            >
              {sidebarCollapsed ? (
                <ChevronRight className="h-4 w-4" />
              ) : (
                <>
                  <ChevronLeft className="h-4 w-4 mr-2" />
                  收起侧边栏
                </>
              )}
            </Button>
          </ActionTooltip>
        )}
        
        <ActionTooltip
          label="发起新对话"
          side="right"
          align="center"
          sideOffset={10}
          enabled={sidebarCollapsed}
        >
          <Button 
            id="new-chat"
            onClick={onNewChat}
            className={!sidebarCollapsed ? "w-full hover:bg-background" : "h-10 w-10 p-0 hover:bg-background"}
            variant="ghost"
          >
            {!sidebarCollapsed ? (
              <>
                <Plus className="h-4 w-4 mr-2" />
                发起新对话
              </>
            ) : (
              <Plus className="h-4 w-4" />
            )}
          </Button>
        </ActionTooltip>
      </div>

      {/* 历史对话列表 */}
      <ScrollArea className="flex-1 p-2 h-[calc(100vh-240px)]  bg-muted">
        {loading || status === 'loading' ? (
          <div className="text-center text-muted-foreground py-4">
            {sidebarCollapsed ? null : '加载中...'}
          </div>
        ) : !session ? (
          <div className="text-center text-muted-foreground py-4">
            {sidebarCollapsed ? null : <p>请登录以查看历史对话</p>}
          </div>
        ) : chatSessions.length === 0 ? (
          <div className="text-center text-muted-foreground py-4">
            {sidebarCollapsed ? null : '暂无历史对话'}
          </div>
        ) : sidebarCollapsed ? (
          // 侧边栏收起时不显示历史对话列表
          null
        ) : (
          <div className="space-y-2">
            {chatSessions.map((session) => (
              <Card
                key={session.id}
                className={`
                  bg-muted cursor-pointer hover:bg-background transition-all duration-200 group
                  ${currentChatId === session.id ? 'bg-background border-primary/50' : ''}
                  p-3
                `}
                onClick={() => onChatSelect(session.id)}
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm truncate">
                      {session.title}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {formatTime(session.updatedAt)} • {session.messageCount} 条消息
                    </div>
                  </div>
                  <ActionTooltip label="删除对话" side="top">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="opacity-0 group-hover:opacity-100 transition-opacity ml-2 h-6 w-6 p-0 hover:bg-destructive hover:text-destructive-foreground"
                      onClick={(e) => onDeleteChat(session.id, e)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </ActionTooltip>
                </div>
              </Card>
            ))}
          </div>
        )}
      </ScrollArea>
      
      {/* 底部人工服务按钮 */}
      {onServiceClick && (
        <div className="p-4 border-t bg-muted">
          <ActionTooltip
            label="人工服务"
            side="right"
            align="center"
            sideOffset={10}
            enabled={sidebarCollapsed}
          >
            <Button 
              id="human-service"
              onClick={onServiceClick}
              className={!sidebarCollapsed ? "w-full hover:bg-background" : "h-10 w-10 p-0 hover:bg-background"}
              variant="ghost"
            >
              {!sidebarCollapsed ? (
                <>
                  <Headphones className="h-4 w-4 mr-2" />
                  人工服务 🛎️
                </>
              ) : (
                <span className="text-lg">🛎️</span>
              )}
            </Button>
          </ActionTooltip>
        </div>
      )}
    </TooltipProvider>
  );
}  