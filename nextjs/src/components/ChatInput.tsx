import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { TestQuestions } from './QuickQuestions';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { instrumentType } from '@/lib/instrument-config';
import { useChatContext } from '@/contexts/ChatContext';
import { useUI } from '@/contexts/UIContext';
import { ArrowUp, Square, Settings, ChevronDown } from 'lucide-react';

interface ChatInputProps {
  onSendMessage: (message: string) => Promise<void>;
  isLoading: boolean;
}
export function ChatInput({ onSendMessage, isLoading }: ChatInputProps) {
  const [input, setInput] = useState('');
  const [showInstrumentDialog, setShowInstrumentDialog] = useState(false);
  const { instrument, series, setInstrumentSeries } = useChatContext();
  const { deviceType } = useUI();

  // 输入相关逻辑
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as unknown as React.FormEvent<HTMLFormElement>);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    
    await onSendMessage(input);
    setInput('');
  };

  // 仪器配置相关逻辑
  const getAvailableSeries = () => {
    const inst = instrumentType[instrument];
    return inst ? Object.keys(inst.pipelineIds) : [];
  };

  const handleInstrumentChange = (value: string) => {
    const availableSeries = Object.keys(instrumentType[value].pipelineIds);
    setInstrumentSeries(value, availableSeries[0]);
  };

  const handleSeriesChange = (value: string) => {
    setInstrumentSeries(instrument, value);
  };

  const currentInstrumentName = instrumentType[instrument]?.name || instrument;
  const currentSeriesName = series;

  // UI 组件
  const renderInputForm = () => (
    <form onSubmit={handleSubmit} className="flex-1">
      <Textarea
        id="chat-input"
        value={input}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        placeholder="输入消息..."
        disabled={isLoading}
        className={`
          text-responsive-sm border-none w-full shadow-none resize-none
          min-h-[20px] max-h-[40px] overflow-y-auto
          ${deviceType === 'mobile' ? 'h-12' : 'h-auto'}
          focus:ring-0 focus-visible:ring-0 focus:outline-none
        `}
      />
    </form>
  );

  const renderInstrumentDialog = () => (
    <Dialog open={showInstrumentDialog} onOpenChange={setShowInstrumentDialog}>
      <DialogTrigger asChild>
        <Button
          id="instrument-select"
          variant="ghost"
          disabled={isLoading}
          className={`
            flex items-center gap-2 justify-between px-3
            ${deviceType === 'mobile' ? 'h-11' : 'h-10'}
          `}
        >
          <div className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            <span className="truncate">
              {currentSeriesName}
            </span>
          </div>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>仪器配置</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">仪器类型</label>
            <Select
              value={instrument}
              onValueChange={handleInstrumentChange}
              disabled={isLoading}
            >
              <SelectTrigger>
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
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">系列</label>
            <Select
              value={series}
              onValueChange={handleSeriesChange}
              disabled={isLoading}
            >
              <SelectTrigger>
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

          <div className="flex justify-end">
            <Button onClick={() => setShowInstrumentDialog(false)}>
              确定
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );

  const renderSendButton = () => (
    <Button
      id="send-button"
      onClick={(e) => {
        e.preventDefault();
        handleSubmit(e as unknown as React.FormEvent<HTMLFormElement>);
      }}
      disabled={isLoading || !input.trim()}
      className={`
        button-enhanced rounded-full
        ${deviceType === 'mobile' 
          ? 'h-8 w-8 p-0' 
          : 'h-8 w-8 px-4 gap-2'
        }
      `}
      title={isLoading ? "发送中" : "发送"}
    >
      {isLoading ? (
        deviceType === 'mobile' ? (
          <Square className="h-5 w-5" />
        ) : (
          <Square className="h-4 w-4" />
        )
      ) : (
        deviceType === 'mobile' ? (
          <ArrowUp className="h-5 w-5" />
        ) : (
          <ArrowUp className="h-4 w-4" />
        )
      )}
    </Button>
  );

  return (
    <div className="space-y-3">
      <div className="space-y-1" id="chat-input-container">
        <div className="flex flex-col gap-2 border rounded-xl p-2">
          <div className="w-full">
            {renderInputForm()}
          </div>
          <div className="flex items-center justify-between w-full  text-base line-height-1">
            {renderInstrumentDialog()}
            {renderSendButton()}
          </div>
        </div>
      </div>
      
      <p className="text-xs text-muted-foreground text-center">
        AI生成内容未必准确，请仔细核查
      </p>
    </div>
  );
}