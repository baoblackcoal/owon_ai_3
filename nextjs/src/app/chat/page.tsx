'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import ChatSidebar from '@/components/ChatSidebar';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentChatId, setCurrentChatId] = useState<string>('');
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  // 自动滚动到底部
  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    
    // 创建一个空的AI回复消息
    const aiMessage: Message = { role: 'assistant', content: '' };
    setMessages(prev => [...prev, aiMessage]);
    
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          message: input,
          chatId: currentChatId // 发送当前聊天ID
        }),
      });

      if (!response.ok) throw new Error('请求失败');
      if (!response.body) throw new Error('没有响应数据');

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      // 更新最后一条消息（AI回复）
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        const text = decoder.decode(value);
        
        // 检查是否包含 chat_id
        const chatIdPattern = /<chat_id>(.*?)<\/chat_id>/;
        const chatMatch = text.match(chatIdPattern);
        if (chatMatch) {
          setCurrentChatId(chatMatch[1]); // 保存新的聊天ID
          continue; // 跳过显示 chat_id
        }
        
        // 跳过 session_id 标签
        if (text.includes('<session_id>') || text.includes('</session_id>')) {
          continue;
        }

        setMessages(prev => {
          const newMessages = [...prev];
          const lastMessage = newMessages[newMessages.length - 1];
          lastMessage.content += text;
          return newMessages;
        });
      }
    } catch (error) {
      console.error('聊天请求失败:', error);
      setMessages(prev => {
        const newMessages = [...prev];
        const lastMessage = newMessages[newMessages.length - 1];
        lastMessage.content = '抱歉，发生了错误，请重试。';
        return newMessages;
      });
    } finally {
      setIsLoading(false);
    }
  };

  // 创建新对话
  const handleNewChat = () => {
    setMessages([]);
    setCurrentChatId('');
  };

  // 选择历史对话
  const handleChatSelect = async (chatId: string) => {
    try {
      const response = await fetch(`/api/chat/${chatId}`);
      if (!response.ok) throw new Error('加载对话失败');
      
      const data = await response.json();
      const { messages: historyMessages } = data as { 
        messages: Array<{ userPrompt: string, aiResponse: string }> 
      };
      
      // 转换消息格式
      const formattedMessages: Message[] = [];
      historyMessages.forEach((msg) => {
        formattedMessages.push({ role: 'user', content: msg.userPrompt });
        formattedMessages.push({ role: 'assistant', content: msg.aiResponse });
      });
      
      setMessages(formattedMessages);
      setCurrentChatId(chatId);
    } catch (error) {
      console.error('加载历史对话失败:', error);
    }
  };

  return (
    <div className="flex h-screen">
      {/* 左侧边栏 */}
      <ChatSidebar 
        currentChatId={currentChatId}
        onChatSelect={handleChatSelect}
        onNewChat={handleNewChat}
      />
      
      {/* 主聊天区域 */}
      <div className="flex flex-col flex-1 max-w-4xl mx-auto p-4">
        <div className="mb-4">
          <h1 className="text-2xl font-bold">AI 助手</h1>
        </div>

      <Card className="flex-1 mb-4 p-4 overflow-hidden">
        <ScrollArea className="h-[calc(100vh-200px)]" ref={scrollAreaRef}>
          <div className="space-y-4">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex ${
                  message.role === 'user' ? 'justify-end' : 'justify-start'
                }`}
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

              <form onSubmit={handleSubmit} className="flex gap-2">
          <Input
            value={input}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setInput(e.target.value)}
            placeholder="输入消息..."
            disabled={isLoading}
            className="flex-1"
          />
          <Button type="submit" disabled={isLoading}>
            {isLoading ? '发送中...' : '发送'}
          </Button>
        </form>
      </div>
    </div>
  );
}  