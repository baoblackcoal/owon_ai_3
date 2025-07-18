'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

interface UIState {
  // 侧边栏状态
  sidebarCollapsed: boolean;
  // 移动端侧边栏显示状态
  mobileSidebarOpen: boolean;
  // 当前设备类型
  deviceType: 'mobile' | 'tablet' | 'desktop';
}

interface UIContextType extends UIState {
  // 侧边栏操作
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  // 移动端侧边栏操作
  toggleMobileSidebar: () => void;
  setMobileSidebarOpen: (open: boolean) => void;
  // 设备检测
  setDeviceType: (type: 'mobile' | 'tablet' | 'desktop') => void;
}

const UIContext = createContext<UIContextType | undefined>(undefined);

interface UIProviderProps {
  children: ReactNode;
}

export function UIProvider({ children }: UIProviderProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [deviceType, setDeviceType] = useState<'mobile' | 'tablet' | 'desktop'>('desktop');

  // 从 localStorage 加载用户偏好
  useEffect(() => {
    const savedCollapsed = localStorage.getItem('sidebar-collapsed');
    if (savedCollapsed !== null) {
      setSidebarCollapsed(JSON.parse(savedCollapsed));
    }
  }, []);

  // 保存用户偏好到 localStorage
  useEffect(() => {
    localStorage.setItem('sidebar-collapsed', JSON.stringify(sidebarCollapsed));
  }, [sidebarCollapsed]);

  // 响应式检测
  useEffect(() => {
    const checkDeviceType = () => {
      const width = window.innerWidth;
      if (width < 768) {
        setDeviceType('mobile');
        // 移动端默认收起侧边栏
        setSidebarCollapsed(true);
      } else if (width < 1024) {
        setDeviceType('tablet');
      } else {
        setDeviceType('desktop');
        // 桌面端关闭移动端侧边栏
        setMobileSidebarOpen(false);
      }
    };

    checkDeviceType();
    window.addEventListener('resize', checkDeviceType);
    return () => window.removeEventListener('resize', checkDeviceType);
  }, []);

  // 键盘快捷键支持 (Ctrl+B 切换侧边栏)
  useEffect(() => {
    const handleKeyboard = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === 'b') {
        e.preventDefault();
        toggleSidebar();
      }
    };

    window.addEventListener('keydown', handleKeyboard);
    return () => window.removeEventListener('keydown', handleKeyboard);
  }, []);

  const toggleSidebar = () => {
    setSidebarCollapsed(prev => !prev);
  };

  const toggleMobileSidebar = () => {
    setMobileSidebarOpen(prev => !prev);
  };

  const value: UIContextType = {
    sidebarCollapsed,
    mobileSidebarOpen,
    deviceType,
    toggleSidebar,
    setSidebarCollapsed,
    toggleMobileSidebar,
    setMobileSidebarOpen,
    setDeviceType,
  };

  return (
    <UIContext.Provider value={value}>
      {children}
    </UIContext.Provider>
  );
}

export function useUI() {
  const context = useContext(UIContext);
  if (context === undefined) {
    throw new Error('useUI must be used within a UIProvider');
  }
  return context;
} 