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
  const [dashscopeSessionId, setDashscopeSessionId] = useState<string>('');
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  // 自动滚动到底部
  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);

  // 监控 dashscopeSessionId 的变化
  // useEffect(() => {
  //   console.log('dashscopeSessionId 状态变化:', dashscopeSessionId);
  // }, [dashscopeSessionId]);

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
      // console.log('发送请求前的状态:', { input, currentChatId, dashscopeSessionId });
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          message: input,
          chatId: currentChatId, // 发送当前聊天ID
          dashscopeSessionId: dashscopeSessionId // 发送当前DashScope会话ID
        }),
      });

      if (!response.ok) throw new Error('请求失败');
      if (!response.body) throw new Error('没有响应数据');

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = ''; // 用于处理跨chunk的标签

      // 更新最后一条消息（AI回复）
      while (true) {
        const { value, done } = await reader.read();
        if (done) {
          // 处理剩余的buffer
          if (buffer) {
            let displayText = buffer.replace(/<[^>]*>/g, ''); // 移除XML标签
            displayText = displayText.replace(/\b[a-f0-9]{32}\b/g, ''); // 移除32位十六进制字符串
            displayText = displayText.trim(); // 去除前后空格
            
            if (displayText) {
              setMessages(prev => {
                const newMessages = [...prev];
                const lastMessage = newMessages[newMessages.length - 1];
                lastMessage.content += displayText;
                return newMessages;
              });
            }
          }
          break;
        }

        const text = decoder.decode(value);
        buffer += text;
        
        // 检查并处理 chat_id 标签
        const chatIdPattern = /<chat_id>(.*?)<\/chat_id>/;
        const chatMatch = buffer.match(chatIdPattern);
        if (chatMatch) {
          setCurrentChatId(chatMatch[1]); // 保存新的聊天ID
          buffer = buffer.replace(chatIdPattern, ''); // 从buffer中移除
          // continue;
        }
        
        // 检查并处理 session_id 标签
        const sessionIdPattern = /<session_id>(.*?)<\/session_id>/;
        const sessionMatch = buffer.match(sessionIdPattern);
        if (sessionMatch) {
          // console.log('收到新的 session_id:', sessionMatch[1]);
          setDashscopeSessionId(sessionMatch[1]); // 保存新的DashScope会话ID
          buffer = buffer.replace(sessionIdPattern, ''); // 从buffer中移除
          continue;
        }

        // 检查是否有不完整的标签
        const incompleteTagPattern = /<(chat_id|session_id)([^>]*)$/;
        if (incompleteTagPattern.test(buffer)) {
          // 有不完整的标签，等待更多数据
          continue;
        }

        // 移除所有XML样式的标签和32位十六进制字符串（session_id格式），只保留纯文本
        let cleanText = buffer.replace(/<[^>]*>/g, ''); // 移除XML标签
        cleanText = cleanText.replace(/\b[a-f0-9]{32}\b/g, ''); // 移除32位十六进制字符串
        cleanText = cleanText.trim(); // 去除前后空格
        
        if (cleanText) { // 只有当有实际内容时才更新
          setMessages(prev => {
            const newMessages = [...prev];
            const lastMessage = newMessages[newMessages.length - 1];
            lastMessage.content += cleanText;
            return newMessages;
          });
        }
        
        buffer = ''; // 清空buffer
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
    setDashscopeSessionId(''); // 清空DashScope会话ID
  };

  // 选择历史对话
  const handleChatSelect = async (chatId: string) => {
    try {
      const response = await fetch(`/api/chat/${chatId}`);
      if (!response.ok) throw new Error('加载对话失败');
      
      const data = await response.json();
      const { chat, messages: historyMessages } = data as { 
        chat: { dashscopeSessionId?: string },
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
      setDashscopeSessionId(chat.dashscopeSessionId || ''); // 设置DashScope会话ID
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