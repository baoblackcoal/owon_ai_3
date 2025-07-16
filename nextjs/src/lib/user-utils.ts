import { NextRequest, NextResponse } from 'next/server';
import { getCloudflareContext } from '@opennextjs/cloudflare';
import { auth } from '@/lib/auth';

export interface UserInfo {
  id: string;
  email: string | null;
  is_guest: number;
  chat_count: number;
  last_chat_date: string | null;
  daily_limit: number;
}

/**
 * 获取当前用户信息（包含游客用户）
 */
export async function getCurrentUser(request: NextRequest): Promise<UserInfo | null> {
  try {
    // 首先尝试获取登录用户
    const session = await auth();
    if (session?.user?.id) {
      const { env } = await getCloudflareContext();
      const db = (env as unknown as { DB?: D1Database }).DB;
      
      if (!db) return null;
      
      const user = await db.prepare(`
        SELECT id, email, is_guest, chat_count, last_chat_date
        FROM User WHERE id = ?
      `).bind(session.user.id).first() as UserInfo | null;
      
      if (user) {
        return {
          ...user,
          daily_limit: user.is_guest ? 20 : 100
        };
      }
    }
    
    // 如果没有登录用户，检查游客用户
    const guestUserId = request.cookies.get('guest_user_id')?.value;
    if (guestUserId) {
      const { env } = await getCloudflareContext();
      const db = (env as unknown as { DB?: D1Database }).DB;
      
      if (!db) return null;
      
      const guestUser = await db.prepare(`
        SELECT id, email, is_guest, chat_count, last_chat_date
        FROM User WHERE id = ? AND is_guest = 1
      `).bind(guestUserId).first() as UserInfo | null;
      
      if (guestUser) {
        return {
          ...guestUser,
          daily_limit: 20
        };
      }
    }
    
    return null;
  } catch (error) {
    console.error('获取用户信息失败:', error);
    return null;
  }
}

/**
 * 创建游客用户
 */
export async function createGuestUser(): Promise<{ userId: string; response: NextResponse }> {
  try {
    const { env } = await getCloudflareContext();
    const db = (env as unknown as { DB?: D1Database }).DB;
    
    if (!db) {
      throw new Error('数据库未绑定');
    }
    
    // 生成10位随机字符串作为游客ID
    const guestUserId = generateRandomString(10);
    const currentDate = new Date().toISOString().split('T')[0];
    
    await db.prepare(`
      INSERT INTO User (id, email, password_hash, is_guest, chat_count, last_chat_date, created_at, updated_at)
      VALUES (?, NULL, NULL, 1, 0, ?, datetime('now'), datetime('now'))
    `).bind(guestUserId, currentDate).run();
    
    // 创建响应并设置cookie
    const response = NextResponse.json({ userId: guestUserId });
    response.cookies.set('guest_user_id', guestUserId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30天
      path: '/'
    });
    
    return { userId: guestUserId, response };
  } catch (error) {
    console.error('创建游客用户失败:', error);
    throw error;
  }
}

/**
 * 检查并更新用户聊天次数
 */
export async function checkAndUpdateChatCount(userId: string): Promise<{
  canChat: boolean;
  remainingCount: number;
  isGuest: boolean;
  message?: string;
}> {
  try {
    const { env } = await getCloudflareContext();
    const db = (env as unknown as { DB?: D1Database }).DB;
    
    if (!db) {
      throw new Error('数据库未绑定');
    }
    
    const currentDate = new Date().toISOString().split('T')[0];
    
    // 获取用户信息
    const user = await db.prepare(`
      SELECT id, is_guest, chat_count, last_chat_date
      FROM User WHERE id = ?
    `).bind(userId).first() as {
      id: string;
      is_guest: number;
      chat_count: number;
      last_chat_date: string | null;
    } | null;
    
    if (!user) {
      throw new Error('用户不存在');
    }
    
    const isGuest = user.is_guest === 1;
    const dailyLimit = isGuest ? 20 : 100;
    
    // 检查是否需要重置聊天次数
    let chatCount = user.chat_count;
    if (user.last_chat_date !== currentDate) {
      chatCount = 0;
    }
    
    // 检查是否超过限制
    if (chatCount >= dailyLimit) {
      const message = isGuest 
        ? "游客只能每天进行20次对话，您已达到20次聊天次数，请登录或注册账号从而获得每天100次对话次数"
        : "您已达到100次对话次数，请明天再来";
      
      return {
        canChat: false,
        remainingCount: 0,
        isGuest,
        message
      };
    }
    
    // 更新聊天次数
    const newChatCount = chatCount + 1;
    await db.prepare(`
      UPDATE User 
      SET chat_count = ?, last_chat_date = ?, updated_at = datetime('now')
      WHERE id = ?
    `).bind(newChatCount, currentDate, userId).run();
    
    return {
      canChat: true,
      remainingCount: dailyLimit - newChatCount,
      isGuest
    };
    
  } catch (error) {
    console.error('检查聊天次数失败:', error);
    throw error;
  }
}

/**
 * 获取用户聊天次数信息
 */
export async function getUserChatInfo(userId: string): Promise<{
  chatCount: number;
  dailyLimit: number;
  remainingCount: number;
  isGuest: boolean;
}> {
  try {
    const { env } = await getCloudflareContext();
    const db = (env as unknown as { DB?: D1Database }).DB;
    
    if (!db) {
      throw new Error('数据库未绑定');
    }
    
    const currentDate = new Date().toISOString().split('T')[0];
    
    const user = await db.prepare(`
      SELECT is_guest, chat_count, last_chat_date
      FROM User WHERE id = ?
    `).bind(userId).first() as {
      is_guest: number;
      chat_count: number;
      last_chat_date: string | null;
    } | null;
    
    if (!user) {
      throw new Error('用户不存在');
    }
    
    const isGuest = user.is_guest === 1;
    const dailyLimit = isGuest ? 20 : 100;
    
    // 如果不是今天，重置计数
    const chatCount = user.last_chat_date === currentDate ? user.chat_count : 0;
    const remainingCount = Math.max(0, dailyLimit - chatCount);
    
    return {
      chatCount,
      dailyLimit,
      remainingCount,
      isGuest
    };
    
  } catch (error) {
    console.error('获取用户聊天信息失败:', error);
    throw error;
  }
}

/**
 * 生成随机字符串
 */
function generateRandomString(length: number): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
} 