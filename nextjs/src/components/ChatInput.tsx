import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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

  const handleTestQuestionSelect = async (question: string) => {
    await onSendMessage(question);
  };

  // 获取当前选中的仪器和系列名称
  const currentInstrumentName = instrumentType[instrument]?.name || instrument;
  const currentSeriesName = series;

  return (
    <div className="space-y-4">
      {/* 测试问题 */}
      <TestQuestions
        onQuestionSelect={handleTestQuestionSelect}
        disabled={isLoading}
      />

      {/* 两行输入区域 */}
      <div className="space-y-3" id="chat-input">
        {/* 第一行：文字输入 */}
        <form onSubmit={handleSubmit}>
          <Input
            value={input}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setInput(e.target.value)}
            placeholder="输入消息..."
            disabled={isLoading}
            className={`
              text-responsive-sm
              ${deviceType === 'mobile' ? 'h-12' : 'h-11'}
              focus:ring-2 focus:ring-primary/20
            `}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmit(e as unknown as React.FormEvent<HTMLFormElement>);
              }
            }}
          />
        </form>

        {/* 第二行：仪器配置按钮和发送按钮 */}
        <div className="flex items-center gap-3">
          {/* 左侧：仪器配置按钮 */}
          <Dialog open={showInstrumentDialog} onOpenChange={setShowInstrumentDialog}>
            <DialogTrigger asChild>
              <Button
                variant="outline"
                disabled={isLoading}
                className={`
                  flex items-center gap-2 flex-1 justify-between
                  ${deviceType === 'mobile' ? 'h-11' : 'h-10'}
                `}
              >
                <div className="flex items-center gap-2">
                  <Settings className="h-4 w-4" />
                  <span className="truncate">
                    {currentInstrumentName} - {currentSeriesName}
                  </span>
                </div>
                <ChevronDown className="h-4 w-4" />
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

          {/* 右侧：发送按钮 */}
          <Button
            onClick={(e) => {
              e.preventDefault();
              handleSubmit(e as unknown as React.FormEvent<HTMLFormElement>);
            }}
            disabled={isLoading || !input.trim()}
            className={`
              button-enhanced touch-target
              ${deviceType === 'mobile' 
                ? 'h-11 w-11 p-0' 
                : 'h-10 px-4 gap-2'
              }
            `}
          >
            {isLoading ? (
              deviceType === 'mobile' ? (
                <Square className="h-5 w-5" />
              ) : (
                <>
                  <Square className="h-4 w-4" />
                  发送中
                </>
              )
            ) : (
              deviceType === 'mobile' ? (
                <ArrowUp className="h-5 w-5" />
              ) : (
                <>
                  <ArrowUp className="h-4 w-4" />
                  发送
                </>
              )
            )}
          </Button>
        </div>
      </div>
      
      {/* 提示文本 */}
      <p className="text-xs text-muted-foreground text-center">
        按 Enter 发送消息，Shift + Enter 换行
      </p>
    </div>
  );
} 