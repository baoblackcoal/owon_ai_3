export interface Message {
  id?: string;
  role: 'user' | 'assistant';
  content: string;
  feedback?: 'like' | 'dislike' | null;
}

export interface DashScopeThought {
  action: string;
  action_input_stream: string;
  arguments: string;
  action_type: string;
  observation: string;
  action_name: string;
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
  sendMessage: (message: string, instrument?: string, series?: string) => Promise<void>;
  handleNewChat: () => void;
  handleChatSelect: (chatId: string) => Promise<void>;
  handleFeedbackChange: (messageId: string, feedback: 'like' | 'dislike' | null) => Promise<void>;
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