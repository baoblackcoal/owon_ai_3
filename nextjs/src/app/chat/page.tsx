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

  function parseConcatenatedJson(jsonString: string) {
    // Split the string by the '}{' pattern, but keep the braces for each part
    const jsonStrings = jsonString.split(/}(?={)/).map(s => {
      // Add the closing brace back if it was removed by the split
      if (!s.endsWith('}')) {
        return s + '}';
      }
      return s;
    });
  
    // Parse each individual JSON string
    const parsedData = jsonStrings.map(s => JSON.parse(s));
    return parsedData;
  }

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
          chatId: currentChatId,
          dashscopeSessionId: dashscopeSessionId
        }),
      });

      if (!response.ok) throw new Error('请求失败');
      if (!response.body) throw new Error('没有响应数据');

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let session_id = '';
      let chat_id = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) {
          console.log('session_id:', session_id);
          console.log('chat_id:', chat_id);
          setDashscopeSessionId(session_id);
          setCurrentChatId(chat_id);
          break;
        }

        const text = decoder.decode(value);
        buffer = text;

        try {          
          const data = parseConcatenatedJson(buffer);

          data.forEach(async item => {
            const output = item.output;
            const t = output?.text;
            if (t) {
              console.log('t:', t);
              setMessages(prev => {
                if (prev.length === 0) return prev;
                // 使用不可变更新，避免对同一对象进行多次原地修改导致的内容重复
                return prev.map((msg, idx) =>
                  idx === prev.length - 1
                    ? { ...msg, content: msg.content + t }
                    : msg
                );
              });
            }                    
          }); 

          // get session_id and chat_id from data frommetadata
          const metadata = data.find(item => item.type === 'metadata');
          if (metadata) {
            session_id = metadata.session_id;
            chat_id = metadata.chat_id;
          }
        } catch (e) {
          // JSON解析失败，可能是不完整的数据
          break;
        }      
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