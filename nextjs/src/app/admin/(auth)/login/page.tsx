'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

export default function AdminLoginPage() {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!password) {
      toast.error('请输入密码');
      return;
    }

    setIsLoading(true);

    try {
      const result = await signIn('credentials', {
        username,
        password,
        redirect: false,
      });

      if (result?.error) {
        // 根据错误类型显示不同的提示
        if (result.error === 'CredentialsSignin') {
          toast.error('用户名或密码错误，请重试');
        } else {
          toast.error(result.error);
        }        
      } else if (result?.ok) {
        // 检查是否是首次登录（密码为空的情况）
        // 通过检查session中的requiresPasswordChange来判断
        const session = await fetch('/api/auth/session').then(res => res.json()) as any;
        
        if (session?.user?.requiresPasswordChange) {
          toast.success('首次登录，请修改密码');
          // 等待一下让toast显示
          await new Promise(resolve => setTimeout(resolve, 500));
          // 跳转到修改密码页面
          await router.replace('/admin/change-password');
        } else {
          toast.success('登录成功');
          // 等待一下让toast显示
          await new Promise(resolve => setTimeout(resolve, 500));
          // 使用replace替换掉历史记录中的登录页
          await router.replace('/admin');
        }
        router.refresh();
      }
    } catch (error) {
      console.error('登录失败:', error);
      toast.error('登录失败，请稍后重试');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">管理员登录</CardTitle>
          <CardDescription>
            请输入管理员密码访问后台管理系统
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">用户名</Label>
              <Input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled
                className="bg-muted"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">密码</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="请输入管理员密码"
                autoFocus
                required
              />
            </div>
            <Button 
              type="submit" 
              className="w-full" 
              disabled={isLoading}
            >
              {isLoading ? '登录中...' : '登录'}
            </Button>
          </form>
          
          <div className="mt-6 text-center text-sm text-muted-foreground">
            <p>首次登录密码为: admin</p>
            <p>登录后将要求修改密码</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 