import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { changePasswordSchema, type ChangePasswordFormData } from './types';

export function ChangePasswordForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const form = useForm<ChangePasswordFormData>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  });

  const handleSubmit = async (data: ChangePasswordFormData) => {
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
      form.reset();
    } catch {
      setError('修改密码失败，请稍后重试');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="current-password">当前密码</Label>
        <Input
          id="current-password"
          type="password"
          placeholder="请输入当前密码"
          {...form.register('currentPassword')}
        />
        {form.formState.errors.currentPassword && (
          <p className="text-sm text-red-500">
            {form.formState.errors.currentPassword.message}
          </p>
        )}
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="new-password">新密码</Label>
        <Input
          id="new-password"
          type="password"
          placeholder="请输入新密码"
          {...form.register('newPassword')}
        />
        {form.formState.errors.newPassword && (
          <p className="text-sm text-red-500">
            {form.formState.errors.newPassword.message}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="confirm-new-password">确认新密码</Label>
        <Input
          id="confirm-new-password"
          type="password"
          placeholder="请再次输入新密码"
          {...form.register('confirmPassword')}
        />
        {form.formState.errors.confirmPassword && (
          <p className="text-sm text-red-500">
            {form.formState.errors.confirmPassword.message}
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
  );
} 