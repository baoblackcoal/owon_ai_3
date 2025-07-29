export interface Message {
  id?: string;
  role: 'user' | 'assistant';
  content: string;
  feedback?: 'like' | 'dislike' | null;
}

// 根据DashScope返回的thoughts结构完善类型定义
export interface DashScopeThought {
  action: string; // 动作类型，如 rag、reasoning
  action_input_stream?: string; // rag时有，reasoning时无
  arguments?: string; // rag时有，reasoning时无
  action_type: string; // agentRag 或 reasoning
  observation?: string; // rag时有，reasoning时无
  action_name: string; // rag: 知识检索，reasoning: 思考过程
  // reasoning类型特有字段
  thought?: string; // reasoning时有
  response?: string; // reasoning时有
}

export interface DashScopeUsage {
  models: Array<{
    input_tokens: number;
    output_tokens: number;
    model_id: string;
  }>;
}

export interface DashScopeOutput {
  thoughts: DashScopeThought[];
  session_id: string;
  finish_reason: string | null;
  text: string;
  reject_status: boolean;
}

export interface DashScopeResponse {
  output: DashScopeOutput;
  usage: DashScopeUsage;
  request_id: string;
}

export interface MetadataResponse {
  type: 'metadata';
  session_id: string;
  chat_id: string;
  message_id: string;
}

export type ParsedJsonObject = DashScopeResponse | MetadataResponse;

export interface ChatContextType {
  messages: Message[];
  isLoading: boolean;
  currentChatId: string;
  dashscopeSessionId: string;
  // 仪器和系列相关
  instrument: string;
  series: string;
  setInstrumentSeries: (instrument: string, series: string) => void;
  // 聊天相关方法
  sendMessage: (message: string) => Promise<void>;
  handleNewChat: () => void;
  handleChatSelect: (chatId: string) => Promise<void>;
  handleFeedbackChange: (messageId: string, feedback: 'like' | 'dislike' | null) => Promise<void>;
  // 历史记录刷新回调
  setHistoryRefreshCallback: (callback: (() => void) | null) => void;
}

export interface ChatHistoryMessage {
  id: string;
  userPrompt: string;
  aiResponse: string;
  feedback: number | null;
}

export interface ChatHistoryResponse {
  chat: {
    id: string;
    title: string;
    dashscopeSessionId: string | null;
  };
  messages: ChatHistoryMessage[];
} 