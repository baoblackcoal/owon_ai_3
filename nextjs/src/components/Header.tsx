'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { Button } from "@/components/ui/button";
import { Menu, Settings } from 'lucide-react';
import AuthDialog from './AuthDialog';
import UserMenu from './UserMenu';
import SettingsDialog from './SettingsDialog';
import { useUI } from '@/contexts/UIContext';

export default function Header() {
  const { data: session, status } = useSession();
  const [showAuthDialog, setShowAuthDialog] = useState(false);
  const [showSettingsDialog, setShowSettingsDialog] = useState(false);
  
  const { deviceType, toggleMobileSidebar, toggleSidebar } = useUI();

  const handleAuthSuccess = () => {
    // 认证成功后刷新页面以获取最新的用户数据
    window.location.reload();
  };

  const handleOpenSettings = () => {
    setShowSettingsDialog(true);
  };

  return (
    <header className="h-16 border-b bg-background px-4 flex items-center justify-between">
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
        
        {/* 桌面端侧边栏折叠按钮（可选，也可以只用侧边栏上的按钮） */}
        {deviceType === 'desktop' && (
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleSidebar}
            className="h-9 w-9 p-0"
            aria-label="切换侧边栏"
          >
            <Menu className="h-4 w-4" />
          </Button>
        )}
        
        <h1 className="text-xl font-semibold text-primary">OWON AI</h1>
      </div>

      <div className="flex items-center space-x-2">
        {status === 'loading' ? (
          <div className="text-sm text-muted-foreground">加载中...</div>
        ) : session?.user ? (
          <div className="flex items-center space-x-2">
            {/* 移动端简化的设置按钮 */}
            {deviceType === 'mobile' && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleOpenSettings}
                className="h-9 w-9 p-0"
                aria-label="设置"
              >
                <Settings className="h-4 w-4" />
              </Button>
            )}
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