import { NextRequest, NextResponse } from 'next/server';
import { getCloudflareContext } from '@opennextjs/cloudflare';
import { auth } from '@/lib/auth';
import bcrypt from 'bcryptjs';
import { z } from 'zod';

// 修改密码表单验证schema
const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "请输入当前密码"),
  newPassword: z.string().min(6, "新密码至少6位"),
  confirmPassword: z.string().min(6, "确认密码至少6位"),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "两次输入的新密码不一致",
  path: ["confirmPassword"],
});

export async function POST(request: NextRequest) {
  try {
    // 验证用户登录状态
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: '请先登录' },
        { status: 401 }
      );
    }

    const body = await request.json();
    
    // 验证输入
    const validatedData = changePasswordSchema.parse(body);
    const { currentPassword, newPassword } = validatedData;
    
    // 获取数据库连接
    const { env } = await getCloudflareContext();
    const db = (env as unknown as { DB?: D1Database }).DB;
    
    if (!db) {
      return NextResponse.json(
        { error: '数据库未绑定' },
        { status: 500 }
      );
    }

    // 获取用户信息（支持admin用户）
    const user = await db.prepare(`
      SELECT id, password_hash, role, requires_password_change FROM User WHERE id = ?
    `).bind(session.user.id).first() as { 
      id: string; 
      password_hash: string; 
      role: string;
      requires_password_change: number;
    } | null;

    if (!user || !user.password_hash) {
      return NextResponse.json(
        { error: '用户不存在' },
        { status: 404 }
      );
    }

    // 验证当前密码
    const isCurrentPasswordValid = bcrypt.compareSync(currentPassword, user.password_hash);
    if (!isCurrentPasswordValid) {
      return NextResponse.json(
        { error: '当前密码不正确' },
        { status: 400 }
      );
    }

    // 加密新密码
    const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS || '12');
    const newPasswordHash = bcrypt.hashSync(newPassword, saltRounds);

    // 更新密码（如果是admin用户首次修改密码，则更新requires_password_change字段）
    if (user.role === 'admin' && user.requires_password_change === 1) {
      // admin用户首次修改密码，同时更新requires_password_change为0
      await db.prepare(`
        UPDATE User SET 
          password_hash = ?, 
          requires_password_change = 0,
          updated_at = datetime('now') 
        WHERE id = ?
      `).bind(newPasswordHash, session.user.id).run();
    } else {
      // 普通密码修改
      await db.prepare(`
        UPDATE User SET password_hash = ?, updated_at = datetime('now') WHERE id = ?
      `).bind(newPasswordHash, session.user.id).run();
    }

    return NextResponse.json(
      { message: '密码修改成功' },
      { status: 200 }
    );
    
  } catch (error) {
    console.error('修改密码失败:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0].message },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: '修改密码失败，请稍后重试' },
      { status: 500 }
    );
  }
} 