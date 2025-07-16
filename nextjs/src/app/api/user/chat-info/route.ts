import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getUserChatInfo } from '@/lib/user-utils';

export async function GET() {
  try {
    // 验证用户登录状态
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: '请先登录' },
        { status: 401 }
      );
    }

    // 获取用户聊天信息
    const chatInfo = await getUserChatInfo(session.user.id);
    
    return NextResponse.json(chatInfo);
    
  } catch (error) {
    console.error('获取用户聊天信息失败:', error);
    return NextResponse.json(
      { error: '获取用户聊天信息失败' },
      { status: 500 }
    );
  }
} 