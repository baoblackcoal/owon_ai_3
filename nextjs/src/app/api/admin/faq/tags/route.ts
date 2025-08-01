import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getCloudflareContext } from '@opennextjs/cloudflare';

// 数据库类型定义
interface D1Database {
  prepare(query: string): D1PreparedStatement;
}

interface D1PreparedStatement {
  bind(...values: unknown[]): D1PreparedStatement;
  first(): Promise<Record<string, unknown> | null>;
  all(): Promise<{ results: Record<string, unknown>[] }>;
  run(): Promise<{ meta: { last_row_id: number } }>;
}

// GET: 获取所有标签
export async function GET() {
  try {
    // 验证管理员权限
    const session = await auth();
    if (!session?.user?.role || session.user.role !== 'admin') {
      return NextResponse.json({ error: '无权限访问' }, { status: 403 });
    }

    const { env } = await getCloudflareContext();
    const db = (env as unknown as { DB?: D1Database }).DB;

    // 检查数据库连接
    if (!db) {
      console.error('数据库连接失败: DB not found in env');
      return NextResponse.json(
        { error: '数据库连接失败' },
        { status: 500 }
      );
    }

    const query = `
      SELECT id, name, created_at
      FROM faq_tags
      ORDER BY name ASC
    `;

    const result = await db.prepare(query).all();
    const tags = result.results.map((row: Record<string, unknown>) => ({
      id: row.id as string,
      name: row.name as string,
      created_at: row.created_at as string
    }));

    return NextResponse.json({ tags });
  } catch (error) {
    console.error('获取标签列表失败:', error);
    return NextResponse.json(
      { error: '获取标签列表失败' },
      { status: 500 }
    );
  }
}

// POST: 创建新标签
export async function POST(request: NextRequest) {
  try {
    // 验证管理员权限
    const session = await auth();
    if (!session?.user?.role || session.user.role !== 'admin') {
      return NextResponse.json({ error: '无权限访问' }, { status: 403 });
    }

    const { env } = await getCloudflareContext();
    const db = (env as unknown as { DB?: D1Database }).DB;

    // 检查数据库连接
    if (!db) {
      console.error('数据库连接失败: DB not found in env');
      return NextResponse.json(
        { error: '数据库连接失败' },
        { status: 500 }
      );
    }

    const body = await request.json();

    const { name } = body as { name?: string };

    if (!name?.trim()) {
      return NextResponse.json(
        { error: '标签名称为必填字段' },
        { status: 400 }
      );
    }

    // 检查标签名称是否已存在
    const existingTag = await db.prepare('SELECT id FROM faq_tags WHERE name = ?').bind(name.trim()).first();
    if (existingTag) {
      return NextResponse.json({
        success: true,
        message: '标签已存在',
        tag: {
          id: existingTag.id as string,
          name: name.trim(),
          created_at: new Date().toISOString()
        }
      });
    }

    // 创建新标签
    const result = await db.prepare(`
      INSERT INTO faq_tags (name)
      VALUES (?)
    `).bind(name.trim()).run();

    const newTag = {
      id: result.meta.last_row_id.toString(),
      name: name.trim(),
      created_at: new Date().toISOString()
    };

    return NextResponse.json({
      success: true,
      message: '标签创建成功',
      tag: newTag
    });

  } catch (error) {
    console.error('创建标签失败:', error);
    return NextResponse.json(
      { error: '创建标签失败' },
      { status: 500 }
    );
  }
} 