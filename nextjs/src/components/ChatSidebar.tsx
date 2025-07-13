'use client';

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";

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
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
  const [loading, setLoading] = useState(true);

  // 加载历史对话列表
  const loadChatHistory = async () => {
    try {
      const response = await fetch('/api/chat/history');
      if (response.ok) {
        const sessions = await response.json();
        setChatSessions(sessions);
      }
    } catch (error) {
      console.error('加载历史对话失败:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadChatHistory();
  }, []);

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

  return (
    <div className="w-64 h-full bg-background border-r flex flex-col">
      {/* 头部 */}
      <div className="p-4 border-b">
        <Button 
          onClick={onNewChat}
          className="w-full"
          variant="default"
        >
          发起新对话
        </Button>
      </div>

      {/* 历史对话列表 */}
      <ScrollArea className="flex-1 p-2">
        {loading ? (
          <div className="text-center text-muted-foreground py-4">
            加载中...
          </div>
        ) : chatSessions.length === 0 ? (
          <div className="text-center text-muted-foreground py-4">
            暂无历史对话
          </div>
        ) : (
          <div className="space-y-2">
            {chatSessions.map((session) => (
              <Card
                key={session.id}
                className={`p-3 cursor-pointer hover:bg-accent transition-colors group ${
                  currentChatId === session.id ? 'bg-accent' : ''
                }`}
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
                  <Button
                    variant="ghost"
                    size="sm"
                    className="opacity-0 group-hover:opacity-100 transition-opacity ml-2 h-6 w-6 p-0"
                    onClick={(e) => handleDeleteChat(session.id, e)}
                  >
                    <span className="text-xs">×</span>
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
} 