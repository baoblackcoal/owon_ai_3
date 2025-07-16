'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { ChatInput } from '@/components/ChatInput';
import { Message, DashScopeResponse, MetadataResponse } from '@/types/chat';
import { parseConcatenatedJson } from '@/lib/chat-utils';

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [chatId, setChatId] = useState<string>('');
  const [dashscopeSessionId, setDashscopeSessionId] = useState<string>('');
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  // 自动滚动到底部
  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);

  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim() || isLoading) return;

    // 添加用户消息
    setMessages(prev => [...prev, { role: 'user', content }]);

    // 添加占位的 AI 消息
    setMessages(prev => [...prev, { role: 'assistant', content: '' }]);

    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: content,
          chatId,
          dashscopeSessionId,
        }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({})) as { error?: string };
        throw new Error(errData.error || '请求失败');
      }

      if (!response.body) throw new Error('没有响应数据');

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let newSessionId = dashscopeSessionId;
      let newChatId = chatId;

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        buffer += chunk;

        try {
          const jsonObjects = parseConcatenatedJson(buffer);
          const lastBraceIdx = buffer.lastIndexOf('}');
          if (lastBraceIdx !== -1) {
            buffer = buffer.substring(lastBraceIdx + 1);
          }

          jsonObjects.forEach(obj => {
            if ('output' in obj) {
              const dashResp = obj as DashScopeResponse;
              const text = dashResp.output?.text;
              if (text) {
                setMessages(prev => {
                  if (prev.length === 0) return prev;
                  return prev.map((msg, idx) =>
                    idx === prev.length - 1 ? { ...msg, content: msg.content + text } : msg
                  );
                });
              }
            } else if ('type' in obj && obj.type === 'metadata') {
              const meta = obj as MetadataResponse;
              newSessionId = meta.session_id;
              newChatId = meta.chat_id;
            }
          });
        } catch (e) {
          console.error('解析数据失败:', e);
          // 继续读取
        }
      }

      setDashscopeSessionId(newSessionId);
      setChatId(newChatId);
    } catch (error) {
      console.error('聊天请求失败:', error);
      setMessages(prev => {
        if (prev.length === 0) return prev;
        const newMessages = [...prev];
        const last = newMessages[newMessages.length - 1];
        last.content = '抱歉，发生了错误，请重试。';
        return newMessages;
      });
    } finally {
      setIsLoading(false);
    }
  }, [chatId, dashscopeSessionId, isLoading]);

  const handleClearChat = () => {
    setMessages([]);
    setChatId('');
    setDashscopeSessionId('');
  };

  return (
    <div className="flex flex-col h-screen max-w-4xl mx-auto p-4">
      <div className="flex justify-between mb-4">
        <h1 className="text-2xl font-bold">AI 助手</h1>
        <Button 
          onClick={handleClearChat}
          variant="outline"
          className="text-red-500 hover:text-red-700"
        >
          清除对话
        </Button>
      </div>

      <Card className="flex-1 mb-4 p-4 overflow-hidden">
        <ScrollArea className="h-[calc(100vh-200px)]" ref={scrollAreaRef}>
          <div className="space-y-4">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-lg p-4 whitespace-pre-wrap ${
                    message.role === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted'
                  }`}
                >
                  {message.content || (message.role === 'assistant' && isLoading ? '正在思考...' : '')}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </Card>

      <ChatInput onSendMessage={sendMessage} isLoading={isLoading} />
    </div>
  );
} 