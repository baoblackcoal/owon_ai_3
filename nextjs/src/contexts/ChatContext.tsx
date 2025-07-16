import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { 
  Message, 
  ChatContextType, 
  ChatHistoryResponse,
  ChatHistoryMessage,
  DashScopeResponse,
  MetadataResponse
} from '@/types/chat';
import { parseConcatenatedJson, fetchChatHistory, updateMessageFeedback } from '@/lib/chat-utils';

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export function ChatProvider({ children }: { children: ReactNode }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentChatId, setCurrentChatId] = useState<string>('');
  const [dashscopeSessionId, setDashscopeSessionId] = useState<string>('');

  const sendMessage = useCallback(async (message: string) => {
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

      if (!response.ok) {
        const errorData = await response.json() as { error?: string };
        if (response.status === 429) {
          setMessages(prev => {
            const newMessages = [...prev];
            const lastMessage = newMessages[newMessages.length - 1];
            lastMessage.content = errorData.error || '聊天次数已用完';
            return newMessages;
          });
          return;
        }
        throw new Error('请求失败');
      }
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
        buffer += text;

        try {
          const data = parseConcatenatedJson(buffer);
          const lastBraceIndex = buffer.lastIndexOf('}');
          if (lastBraceIndex !== -1) {
            buffer = buffer.substring(lastBraceIndex + 1);
          }

          data.forEach(item => {
            if ('output' in item) {
              const dashScopeResponse = item as DashScopeResponse;
              const t = dashScopeResponse.output?.text;
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
            }
          });

          const metadata = data.find(item => 'type' in item && item.type === 'metadata') as MetadataResponse | undefined;
          if (metadata) {
            session_id = metadata.session_id;
            chat_id = metadata.chat_id;
            
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
        } catch (error: unknown) {
          console.error('解析数据失败:', error instanceof Error ? error.message : '未知错误');
          continue;
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
  }, [currentChatId, dashscopeSessionId, isLoading]);

  const handleNewChat = useCallback(() => {
    setMessages([]);
    setCurrentChatId('');
    setDashscopeSessionId('');
  }, []);

  const handleChatSelect = useCallback(async (chatId: string) => {
    try {
      const data = await fetchChatHistory(chatId) as ChatHistoryResponse;
      const { chat, messages: historyMessages } = data;

      const formattedMessages: Message[] = [];
      historyMessages.forEach((msg: ChatHistoryMessage) => {
        formattedMessages.push({ role: 'user', content: msg.userPrompt });
        
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
      setDashscopeSessionId(chat.dashscopeSessionId || '');
    } catch (error: unknown) {
      console.error('加载历史对话失败:', error instanceof Error ? error.message : '未知错误');
    }
  }, []);

  const handleFeedbackChange = useCallback(async (messageId: string, feedback: 'like' | 'dislike' | null) => {
    setMessages(prev => prev.map(msg => 
      msg.id === messageId ? { ...msg, feedback } : msg
    ));

    try {
      await updateMessageFeedback(messageId, feedback);
    } catch (error: unknown) {
      // 回滚UI更新
      setMessages(prev => prev.map(msg => 
        msg.id === messageId ? { 
          ...msg, 
          feedback: feedback === 'like' ? 'dislike' : feedback === 'dislike' ? 'like' : null 
        } : msg
      ));
      console.error('更新反馈失败:', error instanceof Error ? error.message : '未知错误');
    }
  }, []);

  const value = {
    messages,
    isLoading,
    currentChatId,
    dashscopeSessionId,
    sendMessage,
    handleNewChat,
    handleChatSelect,
    handleFeedbackChange,
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}

export function useChatContext() {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error('useChatContext must be used within a ChatProvider');
  }
  return context;
} 