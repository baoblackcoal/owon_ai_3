import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { instrumentType } from '@/lib/instrument-config';

interface InstrumentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  instrument: string;
  series: string;
}

export function InstrumentDialog({ open, onOpenChange, instrument, series }: InstrumentDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>仪器信息</DialogTitle>
        </DialogHeader>
        <DialogDescription>
          您的仪器是{instrumentType[instrument]?.name}，系列是{series}，
          AI对话将会使用相关知识库。
        </DialogDescription>
      </DialogContent>
    </Dialog>
  );
} 