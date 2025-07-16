'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import ChatSidebar from '@/components/ChatSidebar';
import { QuickQuestions } from '@/components/QuickQuestions';
import { MessageActionBar } from '@/components/MessageActionBar';
import { marked } from 'marked';

interface Message {
  id?: string;
  role: 'user' | 'assistant';
  content: string;
  feedback?: 'like' | 'dislike' | null;
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

  function parseConcatenatedJson(jsonString: string) {
    const jsonStrings = jsonString.split(/}(?={)/).map(s => {
      if (!s.endsWith('}')) {
        return s + '}';
      }
      return s;
    });

    // Parse each individual JSON string
    const parsedData = jsonStrings.map(s => JSON.parse(s));
    return parsedData;
  }

  const sendMessage = async (message: string) => {
    if (!message.trim() || isLoading) return;

    const userMessage: Message = { role: 'user', content: message };
    setMessages(prev => [...prev, userMessage]);

    const aiMessage: Message = { role: 'assistant', content: '', feedback: null };
    setMessages(prev => [...prev, aiMessage]);

    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: message,
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
              setMessages(prev => {
                if (prev.length === 0) return prev;
                return prev.map((msg, idx) =>
                  idx === prev.length - 1
                    ? { ...msg, content: msg.content + t }
                    : msg
                );
              });
            }
          });

          const metadata = data.find(item => item.type === 'metadata');
          if (metadata) {
            session_id = metadata.session_id;
            chat_id = metadata.chat_id;
            
            // 更新最后一条assistant消息的ID
            if (metadata.message_id) {
              setMessages(prev => {
                if (prev.length === 0) return prev;
                return prev.map((msg, idx) =>
                  idx === prev.length - 1 && msg.role === 'assistant'
                    ? { ...msg, id: metadata.message_id }
                    : msg
                );
              });
            }
          }
        } catch (error) {
          console.error('解析数据失败:', error);
          setMessages(prev => {
            const newMessages = [...prev];
            const lastMessage = newMessages[newMessages.length - 1];
            lastMessage.content = '获取数据格式错误，请重试。';
            return newMessages;
          });
          break;
        }
      }
    } catch (error) {
      console.error('聊天请求失败:', error);
      setMessages(prev => {
        const newMessages = [...prev];
        const lastMessage = newMessages[newMessages.length - 1];
        lastMessage.content = '获取数据失败，请重试。';
        return newMessages;
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    await sendMessage(input);
    setInput('');
  };

  // 创建新对话
  const handleNewChat = () => {
    setMessages([]);
    setCurrentChatId('');
    setDashscopeSessionId(''); // 清空DashScope会话ID
  };

  // 处理点赞/点踩
  const handleFeedbackChange = async (messageId: string, feedback: 'like' | 'dislike' | null) => {
    // 乐观更新UI
    setMessages(prev => prev.map(msg => 
      msg.id === messageId ? { ...msg, feedback } : msg
    ));

    try {
      const response = await fetch(`/api/chat/message/${messageId}/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          type: feedback === null ? 'cancel' : feedback 
        }),
      });

      if (!response.ok) {
        throw new Error('更新反馈失败');
      }
    } catch (error) {
      console.error('更新反馈失败:', error);
      // 回滚UI更新
      setMessages(prev => prev.map(msg => 
        msg.id === messageId ? { 
          ...msg, 
          feedback: feedback === 'like' ? 'dislike' : feedback === 'dislike' ? 'like' : null 
        } : msg
      ));
    }
  };

  // 选择历史对话
  const handleChatSelect = async (chatId: string) => {
    try {
      const response = await fetch(`/api/chat/${chatId}`);
      if (!response.ok) throw new Error('加载对话失败');

      const data = await response.json();
      const { chat, messages: historyMessages } = data as {
        chat: { dashscopeSessionId?: string },
        messages: Array<{ id: string; userPrompt: string; aiResponse: string; feedback: number | null }>
      };

      // 转换消息格式
      const formattedMessages: Message[] = [];
      historyMessages.forEach((msg) => {
        formattedMessages.push({ role: 'user', content: msg.userPrompt });
        
        // 转换feedback数值为字符串
        let feedback: 'like' | 'dislike' | null = null;
        if (msg.feedback === 1) feedback = 'like';
        else if (msg.feedback === -1) feedback = 'dislike';
        
        formattedMessages.push({ 
          id: msg.id,
          role: 'assistant', 
          content: msg.aiResponse,
          feedback: feedback
        });
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
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'
                    }`}
                >
                  <div className="max-w-[80%]">
                    <div
                      className={`rounded-lg p-4 ${message.role === 'user'
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted'
                        }`}
                      id={message.role === 'user' ? `user-message-${index}` : `assistant-message-${index}`}
                    >
                      {message.content ? (
                        <div dangerouslySetInnerHTML={{ __html: marked(message.content) }} />
                      ) : (
                        message.role === 'assistant' && isLoading ? '正在思考...' : ''
                      )}                
                    </div>
                    
                    {message.role === 'assistant' && (
                      <MessageActionBar
                        messageId={message.id}
                        content={message.content}
                        feedback={message.feedback}
                        onFeedbackChange={handleFeedbackChange}
                        disabled={isLoading}
                      />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </Card>

        <QuickQuestions
          onQuestionSelect={sendMessage}
          disabled={isLoading}
        />

        <form onSubmit={handleSubmit} className="flex gap-2" id="chat-input">
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