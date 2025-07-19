'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { instrumentType } from '@/lib/instrument-config';
import { Settings, ChevronDown } from 'lucide-react';

// 修改密码表单验证schema
const changePasswordSchema = z.object({
  currentPassword: z.string().min(6, "当前密码至少6位"),
  newPassword: z.string().min(6, "新密码至少6位"),
  confirmPassword: z.string().min(6, "确认密码至少6位"),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "两次输入的新密码不一致",
  path: ["confirmPassword"],
});

type ChangePasswordFormData = z.infer<typeof changePasswordSchema>;

interface SettingsDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

interface UserChatInfo {
  chatCount: number;
  dailyLimit: number;
  remainingCount: number;
  isGuest: boolean;
}

// 仪器选择器组件
interface InstrumentSelectorProps {
  value: string;
  onChange: (value: string) => void;
}

function InstrumentSelector({ value, onChange }: InstrumentSelectorProps) {
  const [showDialog, setShowDialog] = useState(false);
  const [selectedInstrument, setSelectedInstrument] = useState('');
  const [selectedSeries, setSelectedSeries] = useState('');

  // 解析当前值
  useEffect(() => {
    if (value) {
      // 查找对应的仪器和系列
      for (const [instKey, instValue] of Object.entries(instrumentType)) {
        if (Object.keys(instValue.pipelineIds).includes(value)) {
          setSelectedInstrument(instKey);
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
    
    for (const [instKey, instValue] of Object.entries(instrumentType)) {
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

export default function SettingsDialog({ isOpen, onClose }: SettingsDialogProps) {
  const { data: session } = useSession();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [chatInfo, setChatInfo] = useState<UserChatInfo | null>(null);
  const [defaultModel, setDefaultModel] = useState('ADS800A');

  const changePasswordForm = useForm<ChangePasswordFormData>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  });

  // 获取用户聊天信息
  const fetchChatInfo = useCallback(async () => {
    if (!session?.user?.id) return;
    
    try {
      const response = await fetch('/api/user/chat-info');
      if (response.ok) {
        const data = await response.json() as UserChatInfo;
        setChatInfo(data);
      }
    } catch (error) {
      console.error('获取聊天信息失败:', error);
    }
  }, [session?.user?.id]);

  useEffect(() => {
    if (isOpen && session?.user) {
      fetchChatInfo();
    }
  }, [isOpen, session, fetchChatInfo]);

  const handleChangePassword = async (data: ChangePasswordFormData) => {
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result = await response.json() as { error?: string };

      if (!response.ok) {
        setError(result.error || '修改密码失败');
        return;
      }

      setSuccess('密码修改成功');
      changePasswordForm.reset();
    } catch {
      setError('修改密码失败，请稍后重试');
    } finally {
      setIsLoading(false);
    }
  };

  const handleModelChange = (value: string) => {
    setDefaultModel(value);
    // 这里可以添加保存到本地存储或后端的逻辑
    localStorage.setItem('defaultModel', value);
  };

  // 加载默认机型设置
  useEffect(() => {
    const savedModel = localStorage.getItem('defaultModel');
    if (savedModel) {
      setDefaultModel(savedModel);
    }
  }, []);

  if (!session?.user) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>设置</DialogTitle>
        </DialogHeader>
        
        <Tabs defaultValue="account" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="account">账户</TabsTrigger>
            <TabsTrigger value="general">通用</TabsTrigger>
          </TabsList>
          
          <TabsContent value="account" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>账户信息</CardTitle>
                <CardDescription>
                  您的账户基本信息
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 min-h-[200px]">
                <div className="space-y-2">
                  <Label>邮箱</Label>
                  <Input
                    value={session.user.email || ''}
                    disabled
                    className="bg-muted"
                  />
                </div>
                
                {chatInfo && (
                  <div className="space-y-2">
                    <Label>对话次数</Label>
                    <div className="text-sm text-muted-foreground">
                      今日已使用：{chatInfo.chatCount} / {chatInfo.dailyLimit} 次
                      <br />
                      剩余次数：{chatInfo.remainingCount} 次
                      <br />
                      重置时间：每日 00:00 (UTC+8)
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {!(session.user as { is_guest?: number }).is_guest && (
              <Card>
                <CardHeader>
                  <CardTitle>修改密码</CardTitle>
                  <CardDescription>
                    更改您的账户密码
                  </CardDescription>
                </CardHeader>
                <CardContent className="min-h-[200px]">
                  <form onSubmit={changePasswordForm.handleSubmit(handleChangePassword)} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="current-password">当前密码</Label>
                      <Input
                        id="current-password"
                        type="password"
                        placeholder="请输入当前密码"
                        {...changePasswordForm.register('currentPassword')}
                      />
                      {changePasswordForm.formState.errors.currentPassword && (
                        <p className="text-sm text-red-500">
                          {changePasswordForm.formState.errors.currentPassword.message}
                        </p>
                      )}
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="new-password">新密码</Label>
                      <Input
                        id="new-password"
                        type="password"
                        placeholder="请输入新密码"
                        {...changePasswordForm.register('newPassword')}
                      />
                      {changePasswordForm.formState.errors.newPassword && (
                        <p className="text-sm text-red-500">
                          {changePasswordForm.formState.errors.newPassword.message}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="confirm-new-password">确认新密码</Label>
                      <Input
                        id="confirm-new-password"
                        type="password"
                        placeholder="请再次输入新密码"
                        {...changePasswordForm.register('confirmPassword')}
                      />
                      {changePasswordForm.formState.errors.confirmPassword && (
                        <p className="text-sm text-red-500">
                          {changePasswordForm.formState.errors.confirmPassword.message}
                        </p>
                      )}
                    </div>

                    {error && (
                      <p className="text-sm text-red-500">{error}</p>
                    )}

                    {success && (
                      <p className="text-sm text-green-500">{success}</p>
                    )}

                    <Button type="submit" disabled={isLoading}>
                      {isLoading ? '修改中...' : '修改密码'}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            )}
          </TabsContent>
          
          <TabsContent value="general" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>通用设置</CardTitle>
                <CardDescription>
                  应用的通用配置选项
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 min-h-[200px]">
                <div className="space-y-2">
                  <Label>新建对话默认机型</Label>
                  <InstrumentSelector
                    value={defaultModel}
                    onChange={handleModelChange}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
} 