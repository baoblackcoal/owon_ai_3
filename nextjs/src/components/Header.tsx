'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { Button } from "@/components/ui/button";
import { Menu, Settings } from 'lucide-react';
import AuthDialog from './AuthDialog';
import UserMenu from './UserMenu';
import SettingsDialog from './SettingsDialog';
import { useUI } from '@/contexts/UIContext';
import Image from 'next/image';

export default function Header() {
  const { data: session, status } = useSession();
  const [showAuthDialog, setShowAuthDialog] = useState(false);
  const [showSettingsDialog, setShowSettingsDialog] = useState(false);
  
  const { deviceType, toggleMobileSidebar } = useUI();

  const handleAuthSuccess = () => {
    // 认证成功后刷新页面以获取最新的用户数据
    window.location.reload();
  };

  const handleOpenSettings = () => {
    setShowSettingsDialog(true);
  };

  return (
    <header className="h-16 bg-background px-4 flex items-center justify-between">
      <div className="flex items-center space-x-4">
        {/* 移动端汉堡菜单按钮 */}
        {deviceType === 'mobile' && (
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleMobileSidebar}
            className="h-9 w-9 p-0"
            aria-label="打开菜单"
          >
            <Menu className="h-5 w-5" />
          </Button>
        )}
        
        {/* Logo 和标题 */}
        <div className="flex items-center space-x-3">
          <Image
            src="/logo.png"
            alt="OWON Logo"
            width={48}
            height={32}
            className="h-8 w-auto"
          />
          {/* <h1 className="text-xl font-semibold text-primary">OWON AI 助手</h1> */}
        </div>
      </div>

      <div className="flex items-center space-x-2">
        {status === 'loading' ? (
          <div className="text-sm text-muted-foreground">加载中...</div>
        ) : session?.user ? (
          <div className="flex items-center space-x-2">            
            <UserMenu onOpenSettings={handleOpenSettings} />
          </div>
        ) : (
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              onClick={() => setShowAuthDialog(true)}
              className={deviceType === 'mobile' ? 'text-sm px-3' : ''}
            >
              登录
            </Button>
            <Button
              onClick={() => setShowAuthDialog(true)}
              className={deviceType === 'mobile' ? 'text-sm px-3' : ''}
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