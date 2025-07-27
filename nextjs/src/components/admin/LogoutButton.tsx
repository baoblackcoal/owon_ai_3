'use client';

import { signOut } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export default function LogoutButton() {
  const handleLogout = async () => {
    try {
      await signOut({ redirect: false });
      window.location.href = '/admin/login';
      toast.success('已退出登录');
    } catch (error) {
      console.error('退出失败:', error);
      toast.error('退出失败，请重试');
    }
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleLogout}
      className="text-sm font-medium transition-colors hover:text-primary"
    >
      退出登录
    </Button>
  );
} 