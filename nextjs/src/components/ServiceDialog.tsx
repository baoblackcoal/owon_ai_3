'use client';

import { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useSession } from 'next-auth/react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getInstrumentTypeOptions, getInstrumentSeriesOptions, isValidInstrumentCombination } from '@/lib/instrument-config';
import { useChatContext } from '@/contexts/ChatContext';
import type { CreateSupportTicketResponse } from '@/types/support';

// 表单验证schema
const supportTicketSchema = z.object({
  company: z.string().optional(),
  lastName: z.string().min(1, '姓氏不能为空').max(30, '姓氏不能超过30个字符'),
  email: z.string().email('请输入有效的邮箱地址'),
  deviceType: z.string().min(1, '请选择设备类型'),
  deviceSeries: z.string().min(1, '请选择设备系列'),
  softwareVersion: z.string().min(1, '软件版本号不能为空').max(50, '软件版本号不能超过50个字符'),
  instrumentModel: z.string().min(1, '仪器型号不能为空').max(50, '仪器型号不能超过50个字符'),
  detail: z.string().min(1, '问题详情不能为空').max(1000, '问题详情不能超过1000个字符'),
}).refine((data) => isValidInstrumentCombination(data.deviceType, data.deviceSeries), {
  message: '设备类型和系列组合无效',
  path: ['deviceSeries'],
});

type ServiceFormData = z.infer<typeof supportTicketSchema>;

interface ServiceDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function ServiceDialog({ isOpen, onClose, onSuccess }: ServiceDialogProps) {
  const { data: session } = useSession();
  const { instrument, series } = useChatContext();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);

  const form = useForm<ServiceFormData>({
    resolver: zodResolver(supportTicketSchema),
    defaultValues: {
      company: '',
      lastName: '',
      email: '',
      deviceType: instrument || '',
      deviceSeries: series || '',
      softwareVersion: '',
      instrumentModel: '',
      detail: '',
    },
  });

  const watchedDeviceType = form.watch('deviceType');

  // 当设备类型改变时，重置设备系列
  useEffect(() => {
    if (watchedDeviceType) {
      const availableSeries = getInstrumentSeriesOptions(watchedDeviceType);
      if (availableSeries.length > 0) {
        // 如果当前选中的系列在新类型中不存在，选择第一个可用的
        const currentSeries = form.getValues('deviceSeries');
        if (!availableSeries.find(s => s.value === currentSeries)) {
          form.setValue('deviceSeries', availableSeries[0].value);
        }
      } else {
        form.setValue('deviceSeries', '');
      }
    }
  }, [watchedDeviceType, form]);

  // 预填用户邮箱和当前仪器配置
  const resetForm = useCallback(() => {
    form.reset({
      company: '',
      lastName: '',
      email: session?.user?.email || '',
      deviceType: instrument || '',
      deviceSeries: series || '',
      softwareVersion: '',
      instrumentModel: '',
      detail: '',
    });
    setError(null);
  }, [form, session?.user?.email, instrument, series]);

  useEffect(() => {
    if (isOpen) {
      resetForm();
    }
  }, [isOpen, resetForm]);

  const handleSubmit = async (data: ServiceFormData) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/support/tickets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result = await response.json() as CreateSupportTicketResponse;

      if (!response.ok || !result.success) {
        setError(result.error || '提交失败，请稍后重试');
        return;
      }

      // 提交成功，显示成功对话框
      setShowSuccessDialog(true);
      onClose(); // 关闭服务对话框

    } catch {
      setError('提交失败，请稍后重试');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuccessDialogClose = () => {
    setShowSuccessDialog(false);
    onSuccess?.();
  };

  const instrumentTypeOptions = getInstrumentTypeOptions();
  const seriesOptions = watchedDeviceType ? getInstrumentSeriesOptions(watchedDeviceType) : [];

  return (
    <>
      {/* 人工服务表单对话框 */}
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>人工服务 🛎️</DialogTitle>
          </DialogHeader>
          
          <Card className="border-0 shadow-none">
            <CardHeader className="px-0">
              <CardDescription>
                请填写以下信息，我们将在3个工作日内回复您
              </CardDescription>
            </CardHeader>
            <CardContent className="px-0">
              <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                {/* 公司名称（选填） */}
                <div className="space-y-2">
                  <Label htmlFor="company">公司名称（选填）</Label>
                  <Input
                    id="company"
                    placeholder="请输入公司名称"
                    {...form.register('company')}
                  />
                  {form.formState.errors.company && (
                    <p className="text-sm text-red-500">
                      {form.formState.errors.company.message}
                    </p>
                  )}
                </div>

                {/* 姓氏（必填） */}
                <div className="space-y-2">
                  <Label htmlFor="lastName">姓氏 *</Label>
                  <Input
                    id="lastName"
                    placeholder="请输入您的姓氏"
                    {...form.register('lastName')}
                  />
                  {form.formState.errors.lastName && (
                    <p className="text-sm text-red-500">
                      {form.formState.errors.lastName.message}
                    </p>
                  )}
                </div>

                {/* 邮箱（必填） */}
                <div className="space-y-2">
                  <Label htmlFor="email">邮箱 *</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="请输入邮箱地址"
                    {...form.register('email')}
                  />
                  {form.formState.errors.email && (
                    <p className="text-sm text-red-500">
                      {form.formState.errors.email.message}
                    </p>
                  )}
                </div>

                {/* 设备类型（必填） */}
                <div className="space-y-2">
                  <Label htmlFor="deviceType">设备类型 *</Label>
                  <Select 
                    value={form.watch('deviceType')} 
                    onValueChange={(value) => form.setValue('deviceType', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="请选择设备类型" />
                    </SelectTrigger>
                    <SelectContent>
                      {instrumentTypeOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {form.formState.errors.deviceType && (
                    <p className="text-sm text-red-500">
                      {form.formState.errors.deviceType.message}
                    </p>
                  )}
                </div>

                {/* 设备系列（必填） */}
                <div className="space-y-2">
                  <Label htmlFor="deviceSeries">设备系列 *</Label>
                  <Select 
                    value={form.watch('deviceSeries')} 
                    onValueChange={(value) => form.setValue('deviceSeries', value)}
                    disabled={!watchedDeviceType}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="请选择设备系列" />
                    </SelectTrigger>
                    <SelectContent>
                      {seriesOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {form.formState.errors.deviceSeries && (
                    <p className="text-sm text-red-500">
                      {form.formState.errors.deviceSeries.message}
                    </p>
                  )}
                </div>

                {/* 软件版本号（必填） */}
                <div className="space-y-2">
                  <Label htmlFor="softwareVersion">软件版本号 *</Label>
                  <Input
                    id="softwareVersion"
                    placeholder="例如：v1.2.3"
                    {...form.register('softwareVersion')}
                  />
                  {form.formState.errors.softwareVersion && (
                    <p className="text-sm text-red-500">
                      {form.formState.errors.softwareVersion.message}
                    </p>
                  )}
                </div>

                {/* 仪器型号（必填） */}
                <div className="space-y-2">
                  <Label htmlFor="instrumentModel">仪器型号 *</Label>
                  <Input
                    id="instrumentModel"
                    placeholder="请输入具体的仪器型号"
                    {...form.register('instrumentModel')}
                  />
                  {form.formState.errors.instrumentModel && (
                    <p className="text-sm text-red-500">
                      {form.formState.errors.instrumentModel.message}
                    </p>
                  )}
                </div>

                {/* 问题详情（必填） */}
                <div className="space-y-2">
                  <Label htmlFor="detail">问题详情 *</Label>
                  <Textarea
                    id="detail"
                    placeholder="请详细描述您遇到的问题..."
                    className="min-h-[100px]"
                    {...form.register('detail')}
                  />
                  {form.formState.errors.detail && (
                    <p className="text-sm text-red-500">
                      {form.formState.errors.detail.message}
                    </p>
                  )}
                </div>

                {error && (
                  <p className="text-sm text-red-500">{error}</p>
                )}

                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? '提交中...' : '提交'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </DialogContent>
      </Dialog>

      {/* 成功提示对话框 */}
      <Dialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>提交成功</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-center text-muted-foreground">
              问题反馈已提交，感谢您的支持！我们将会在3个工作日内回复您，请留意您的邮箱。
            </p>
          </div>
          <div className="flex justify-center">
            <Button onClick={handleSuccessDialogClose}>
              关闭
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
} 