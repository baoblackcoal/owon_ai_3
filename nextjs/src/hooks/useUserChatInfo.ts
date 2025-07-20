import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import type { UserChatInfo } from '@/components/settings/types';

export function useUserChatInfo() {
  const { data: session } = useSession();
  const [chatInfo, setChatInfo] = useState<UserChatInfo | null>(null);

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
    if (session?.user) {
      fetchChatInfo();
    }
  }, [session, fetchChatInfo]);

  return { chatInfo, refreshChatInfo: fetchChatInfo };
} 