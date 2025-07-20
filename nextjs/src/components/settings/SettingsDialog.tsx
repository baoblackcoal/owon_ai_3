'use client';

import { useSession } from 'next-auth/react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { InstrumentSelector } from './InstrumentSelector';
import { ChangePasswordForm } from './ChangePasswordForm';
import { useUserChatInfo } from '@/hooks/useUserChatInfo';
import { useDefaultModel } from '@/hooks/useDefaultModel';
import type { SettingsDialogProps } from './types';

export default function SettingsDialog({ isOpen, onClose }: SettingsDialogProps) {
  const { data: session } = useSession();
  const { chatInfo } = useUserChatInfo();
  const { defaultModel, updateDefaultModel } = useDefaultModel();

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
                  <ChangePasswordForm />
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
                    onChange={updateDefaultModel}
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