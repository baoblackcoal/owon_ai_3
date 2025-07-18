import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { QuickQuestions } from './QuickQuestions';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { instrumentType } from '@/lib/instrument-config';
import { useChatContext } from '@/contexts/ChatContext'; // import the context

interface ChatInputProps {
  onSendMessage: (message: string) => Promise<void>; // change: no longer takes instrument and series
  isLoading: boolean;
}

export function ChatInput({ onSendMessage, isLoading }: ChatInputProps) {
  const [input, setInput] = useState('');
  // Use the context for instrument and series and their setters
  const { instrument, series, setInstrumentSeries } = useChatContext();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    await onSendMessage(input); // now onSendMessage only takes the message
    setInput('');
  };

  // Get available series for the selected instrument
  const getAvailableSeries = () => {
    const inst = instrumentType[instrument];
    return inst ? Object.keys(inst.pipelineIds) : [];
  };

  // Handle instrument change
  const handleInstrumentChange = (value: string) => {
    const availableSeries = Object.keys(instrumentType[value].pipelineIds);
    setInstrumentSeries(value, availableSeries[0]);
  };

  const handleSeriesChange = (value: string) => {
    setInstrumentSeries(instrument, value);
  };

  const handleQuickQuestionSelect = async (question: string) => {
    await onSendMessage(question);
  };

  return (
    <div className="space-y-4">
      <QuickQuestions
        onQuestionSelect={handleQuickQuestionSelect}
        disabled={isLoading}
      />

      <div className="flex gap-2">
        <Select
          value={instrument}
          onValueChange={handleInstrumentChange}
          disabled={isLoading}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="选择仪器" />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(instrumentType).map(([key, value]) => (
              <SelectItem key={key} value={key}>
                {value.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={series}
          onValueChange={handleSeriesChange}
          disabled={isLoading}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="选择系列" />
          </SelectTrigger>
          <SelectContent>
            {getAvailableSeries().map((s) => (
              <SelectItem key={s} value={s}>
                {s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

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