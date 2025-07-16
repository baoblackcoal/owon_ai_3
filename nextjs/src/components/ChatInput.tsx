import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { QuickQuestions } from './QuickQuestions';

interface ChatInputProps {
  onSendMessage: (message: string) => Promise<void>;
  isLoading: boolean;
}

export function ChatInput({ onSendMessage, isLoading }: ChatInputProps) {
  const [input, setInput] = useState('');

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    await onSendMessage(input);
    setInput('');
  };

  return (
    <div className="space-y-4">
      <QuickQuestions
        onQuestionSelect={onSendMessage}
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
  );
} 