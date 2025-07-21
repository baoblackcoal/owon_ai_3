import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Settings, ChevronDown } from 'lucide-react';
import { instrumentType } from '@/lib/instrument-config';
import type { InstrumentSelectorProps } from './types';

export function InstrumentSelector({ value, onChange }: InstrumentSelectorProps) {
  const [showDialog, setShowDialog] = useState(false);
  const [selectedInstrument, setSelectedInstrument] = useState('');
  const [selectedSeries, setSelectedSeries] = useState('');

  // 解析当前值
  useEffect(() => {
    if (value) {
      // 查找对应的仪器和系列
      for (const [key, instValue] of Object.entries(instrumentType)) {
        if (Object.keys(instValue.pipelineIds).includes(value)) {
          setSelectedInstrument(key);
          setSelectedSeries(value);
          break;
        }
      }
    }
  }, [value]);

  const handleInstrumentChange = (instrumentKey: string) => {
    setSelectedInstrument(instrumentKey);
    const availableSeries = Object.keys(instrumentType[instrumentKey].pipelineIds);
    if (availableSeries.length > 0) {
      setSelectedSeries(availableSeries[0]);
    }
  };

  const handleConfirm = () => {
    if (selectedSeries) {
      onChange(selectedSeries);
    }
    setShowDialog(false);
  };

  const getCurrentDisplayName = () => {
    if (!value) return '选择默认机型';
    
    for (const [, instValue] of Object.entries(instrumentType)) {
      if (Object.keys(instValue.pipelineIds).includes(value)) {
        return `${instValue.name} - ${value}`;
      }
    }
    return value;
  };

  return (
    <Dialog open={showDialog} onOpenChange={setShowDialog}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          className="w-full justify-between"
        >
          <div className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            <span className="truncate">{getCurrentDisplayName()}</span>
          </div>
          <ChevronDown className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>选择默认机型</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>仪器类型</Label>
            <Select value={selectedInstrument} onValueChange={handleInstrumentChange}>
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

          {selectedInstrument && (
            <div className="space-y-2">
              <Label>系列</Label>
              <Select value={selectedSeries} onValueChange={setSelectedSeries}>
                <SelectTrigger>
                  <SelectValue placeholder="选择系列" />
                </SelectTrigger>
                <SelectContent>
                  {Object.keys(instrumentType[selectedInstrument].pipelineIds).map((series) => (
                    <SelectItem key={series} value={series}>
                      {series}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowDialog(false)}>
              取消
            </Button>
            <Button onClick={handleConfirm} disabled={!selectedSeries}>
              确定
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
} 