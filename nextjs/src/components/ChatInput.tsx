import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { QuickQuestions } from './QuickQuestions';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { instrumentType } from '@/lib/instrument-config';

interface ChatInputProps {
  onSendMessage: (message: string, instrument: string, series: string) => Promise<void>;
  isLoading: boolean;
}

export function ChatInput({ onSendMessage, isLoading }: ChatInputProps) {
  const [input, setInput] = useState('');
  const [selectedInstrument, setSelectedInstrument] = useState('OSC');
  const [selectedSeries, setSelectedSeries] = useState('ADS800A');

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    await onSendMessage(input, selectedInstrument, selectedSeries);
    setInput('');
  };

  // Get available series for the selected instrument
  const getAvailableSeries = () => {
    const instrument = instrumentType[selectedInstrument];
    return instrument ? Object.keys(instrument.pipelineIds) : [];
  };

  // Handle instrument change
  const handleInstrumentChange = (value: string) => {
    setSelectedInstrument(value);
    // Reset series to first available option for new instrument
    const availableSeries = Object.keys(instrumentType[value].pipelineIds);
    setSelectedSeries(availableSeries[0]);
  };

  const handleQuickQuestionSelect = async (question: string) => {
    await onSendMessage(question, selectedInstrument, selectedSeries);
  };

  return (
    <div className="space-y-4">
      <QuickQuestions
        onQuestionSelect={handleQuickQuestionSelect}
        disabled={isLoading}
      />

      <div className="flex gap-2">
        <Select
          value={selectedInstrument}
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
          value={selectedSeries}
          onValueChange={setSelectedSeries}
          disabled={isLoading}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="选择系列" />
          </SelectTrigger>
          <SelectContent>
            {getAvailableSeries().map((series) => (
              <SelectItem key={series} value={series}>
                {series}
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