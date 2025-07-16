import { NextRequest, NextResponse } from 'next/server';
import { getCloudflareContext } from '@opennextjs/cloudflare';
import bcrypt from 'bcrypt';
import { z } from 'zod';

// 注册表单验证schema
const registerSchema = z.object({
  email: z.string().email("请输入有效的邮箱地址"),
  password: z.string().min(6, "密码至少6位"),
  confirmPassword: z.string().min(6, "确认密码至少6位"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "两次输入的密码不一致",
  path: ["confirmPassword"],
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // 验证输入
    const validatedData = registerSchema.parse(body);
    const { email, password } = validatedData;
    
    // 获取数据库连接
    const { env } = await getCloudflareContext();
    const db = (env as unknown as { DB?: D1Database }).DB;
    
    if (!db) {
      return NextResponse.json(
        { error: '数据库未绑定' },
        { status: 500 }
      );
    }

    // 检查邮箱是否已注册
    const existingUser = await db.prepare(`
      SELECT id FROM User WHERE email = ?
    `).bind(email).first();

    if (existingUser) {
      return NextResponse.json(
        { error: '邮箱已注册' },
        { status: 400 }
      );
    }

    // 加密密码
    const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS || '12');
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // 创建用户
    const userId = crypto.randomUUID();
    const currentDate = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    
    await db.prepare(`
      INSERT INTO User (id, email, password_hash, is_guest, chat_count, last_chat_date, created_at, updated_at)
      VALUES (?, ?, ?, 0, 0, ?, datetime('now'), datetime('now'))
    `).bind(userId, email, passwordHash, currentDate).run();

    // 获取游客用户ID（从cookie）
    const guestUserId = request.cookies.get('guest_user_id')?.value;
    
    // 如果有游客聊天记录，转移到新用户
    if (guestUserId) {
      await db.prepare(`
        UPDATE Chat SET user_id = ? WHERE user_id = ?
      `).bind(userId, guestUserId).run();
      
      await db.prepare(`
        UPDATE ChatMessage SET user_id = ? WHERE user_id = ?
      `).bind(userId, guestUserId).run();
      
      // 删除游客用户
      await db.prepare(`
        DELETE FROM User WHERE id = ?
      `).bind(guestUserId).run();
    }

    return NextResponse.json(
      { message: '注册成功', userId },
      { status: 201 }
    );
    
  } catch (error) {
    console.error('注册失败:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0].message },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: '注册失败，请稍后重试' },
      { status: 500 }
    );
  }
} 