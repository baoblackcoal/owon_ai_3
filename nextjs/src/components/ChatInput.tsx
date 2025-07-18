import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { QuickQuestions } from './QuickQuestions';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { instrumentType } from '@/lib/instrument-config';
import { useChatContext } from '@/contexts/ChatContext';
import { useUI } from '@/contexts/UIContext';
import { Send, Settings } from 'lucide-react';
import { Card } from '@/components/ui/card';

interface ChatInputProps {
  onSendMessage: (message: string) => Promise<void>;
  isLoading: boolean;
}

export function ChatInput({ onSendMessage, isLoading }: ChatInputProps) {
  const [input, setInput] = useState('');
  const { instrument, series, setInstrumentSeries } = useChatContext();
  const { deviceType } = useUI();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    
    await onSendMessage(input);
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
      {/* 快速问题 */}
      <QuickQuestions
        onQuestionSelect={handleQuickQuestionSelect}
        disabled={isLoading}
      />

      {/* 仪器选择 - 响应式布局 */}
      <Card className="p-4 bg-muted/50 border-muted">
        <div className="flex items-center gap-2 mb-3">
          <Settings className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium text-muted-foreground">
            仪器配置
          </span>
        </div>
        
        <div className={`
          flex gap-2
          ${deviceType === 'mobile' ? 'flex-col' : 'flex-row'}
        `}>
          <Select
            value={instrument}
            onValueChange={handleInstrumentChange}
            disabled={isLoading}
          >
            <SelectTrigger className={`
              ${deviceType === 'mobile' ? 'w-full' : 'w-[180px]'}
            `}>
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
            <SelectTrigger className={`
              ${deviceType === 'mobile' ? 'w-full' : 'w-[180px]'}
            `}>
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
      </Card>

      {/* 输入区域 */}
      <form onSubmit={handleSubmit} className="flex gap-2" id="chat-input">
        <div className="flex-1 relative">
          <Input
            value={input}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setInput(e.target.value)}
            placeholder="输入消息..."
            disabled={isLoading}
            className={`
              pr-12 text-responsive-sm
              ${deviceType === 'mobile' ? 'h-11' : 'h-10'}
              focus:ring-2 focus:ring-primary/20
            `}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmit(e as any);
              }
            }}
          />
          
          {/* 发送按钮 - 嵌入在输入框内 */}
          <Button
            type="submit"
            disabled={isLoading || !input.trim()}
            size="sm"
            className={`
              absolute right-1 top-1/2 -translate-y-1/2
              button-enhanced touch-target
              ${deviceType === 'mobile' ? 'h-9 w-9 p-0' : 'h-8 w-8 p-0'}
            `}
          >
            {isLoading ? (
              <div className="loading-dots w-4 h-4" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
        
        {/* 移动端可能需要额外的发送按钮 */}
        {deviceType === 'mobile' && (
          <Button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="button-enhanced touch-target px-6"
          >
            {isLoading ? '发送中...' : '发送'}
          </Button>
        )}
      </form>
      
      {/* 提示文本 */}
      <p className="text-xs text-muted-foreground text-center">
        按 Enter 发送消息，Shift + Enter 换行
      </p>
    </div>
  );
} 