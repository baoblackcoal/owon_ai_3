'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { Button } from "@/components/ui/button";
import AuthDialog from './AuthDialog';
import UserMenu from './UserMenu';
import SettingsDialog from './SettingsDialog';

export default function Header() {
  const { data: session, status } = useSession();
  const [showAuthDialog, setShowAuthDialog] = useState(false);
  const [showSettingsDialog, setShowSettingsDialog] = useState(false);

  const handleAuthSuccess = () => {
    // 认证成功后刷新页面以获取最新的用户数据
    window.location.reload();
  };

  const handleOpenSettings = () => {
    setShowSettingsDialog(true);
  };

  return (
    <header className=" border-b bg-background px-4 flex items-center justify-between">
      <div className="flex items-center space-x-4">
        <h1 className="text-xl font-semibold">OWON AI</h1>
      </div>

      <div className="flex items-center space-x-4">
        {status === 'loading' ? (
          <div className="text-sm text-muted-foreground">加载中...</div>
        ) : session?.user ? (
          <UserMenu onOpenSettings={handleOpenSettings} />
        ) : (
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              onClick={() => setShowAuthDialog(true)}
            >
              登录
            </Button>
            <Button
              onClick={() => setShowAuthDialog(true)}
            >
              注册
            </Button>
          </div>
        )}
      </div>

      <AuthDialog
        isOpen={showAuthDialog}
        onClose={() => setShowAuthDialog(false)}
        onSuccess={handleAuthSuccess}
      />

      <SettingsDialog
        isOpen={showSettingsDialog}
        onClose={() => setShowSettingsDialog(false)}
      />
    </header>
  );
} 