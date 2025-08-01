import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getCloudflareContext } from '@/lib/env';

// 数据库类型定义
interface D1Database {
  prepare(query: string): D1PreparedStatement;
}

interface D1PreparedStatement {
  bind(...values: unknown[]): D1PreparedStatement;
  first(): Promise<Record<string, unknown> | null>;
  all(): Promise<{ results: Record<string, unknown>[] }>;
  run(): Promise<{ meta: { last_row_id: string } }>;
}

// GET: 获取所有分类
export async function GET() {
  try {
    // 验证管理员权限
    const session = await auth();
    if (!session?.user?.role || session.user.role !== 'admin') {
      return NextResponse.json({ error: '无权限访问' }, { status: 403 });
    }

    const { env } = await getCloudflareContext();
    const db = env.DB as D1Database;

    const query = `
      SELECT id, name, description, created_at
      FROM faq_categories
      ORDER BY name ASC
    `;

    const result = await db.prepare(query).all();
    const categories = result.results.map((row: Record<string, unknown>) => ({
      id: row.id as string,
      name: row.name as string,
      description: row.description as string,
      created_at: row.created_at as string
    }));

    return NextResponse.json({ categories });
  } catch (error) {
    console.error('获取分类列表失败:', error);
    return NextResponse.json(
      { error: '获取分类列表失败' },
      { status: 500 }
    );
  }
}

// POST: 创建新分类
export async function POST(request: NextRequest) {
  try {
    // 验证管理员权限
    const session = await auth();
    if (!session?.user?.role || session.user.role !== 'admin') {
      return NextResponse.json({ error: '无权限访问' }, { status: 403 });
    }

    const { env } = await getCloudflareContext();
    const db = env.DB as D1Database;
    const body = await request.json();

    const { name, description } = body;

    if (!name?.trim()) {
      return NextResponse.json(
        { error: '分类名称为必填字段' },
        { status: 400 }
      );
    }

    // 检查分类名称是否已存在
    const existingCategory = await db.prepare('SELECT id FROM faq_categories WHERE name = ?').bind(name.trim()).first();
    if (existingCategory) {
      return NextResponse.json(
        { error: '分类名称已存在' },
        { status: 400 }
      );
    }

    // 创建新分类
    const result = await db.prepare(`
      INSERT INTO faq_categories (name, description)
      VALUES (?, ?)
    `).bind(name.trim(), description?.trim() || null).run();

    const newCategory = {
      id: result.meta.last_row_id,
      name: name.trim(),
      description: description?.trim() || null,
      created_at: new Date().toISOString()
    };

    return NextResponse.json({
      success: true,
      message: '分类创建成功',
      category: newCategory
    });

  } catch (error) {
    console.error('创建分类失败:', error);
    return NextResponse.json(
      { error: '创建分类失败' },
      { status: 500 }
    );
  }
} 