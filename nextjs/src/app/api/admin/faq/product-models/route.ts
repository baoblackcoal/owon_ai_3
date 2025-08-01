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

// GET: 获取所有产品型号
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
      SELECT 
        fpm.id, 
        fpm.name, 
        fpm.category_id,
        fpm.created_at,
        fc.name as category_name
      FROM faq_product_models fpm
      LEFT JOIN faq_categories fc ON fpm.category_id = fc.id
      ORDER BY fpm.name ASC
    `;

    const result = await db.prepare(query).all();
    const productModels = result.results.map((row: Record<string, unknown>) => ({
      id: row.id as string,
      name: row.name as string,
      category_id: row.category_id as string,
      created_at: row.created_at as string,
      category: row.category_name ? {
        id: row.category_id as string,
        name: row.category_name as string
      } : null
    }));

    return NextResponse.json({ product_models: productModels });
  } catch (error) {
    console.error('获取产品型号列表失败:', error);
    return NextResponse.json(
      { error: '获取产品型号列表失败' },
      { status: 500 }
    );
  }
}

// POST: 创建新产品型号
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

    const { name, category_id } = body as { name?: string; category_id?: string };

    if (!name?.trim()) {
      return NextResponse.json(
        { error: '产品型号名称为必填字段' },
        { status: 400 }
      );
    }

    // 检查产品型号名称是否已存在
    const existingProductModel = await db.prepare('SELECT id FROM faq_product_models WHERE name = ?').bind(name.trim()).first();
    if (existingProductModel) {
      return NextResponse.json(
        { error: '产品型号名称已存在' },
        { status: 400 }
      );
    }

    // 创建新产品型号
    const result = await db.prepare(`
      INSERT INTO faq_product_models (name, category_id)
      VALUES (?, ?)
    `).bind(name.trim(), category_id || null).run();

    const newProductModel = {
      id: result.meta.last_row_id.toString(),
      name: name.trim(),
      category_id: category_id || null,
      created_at: new Date().toISOString()
    };

    return NextResponse.json({
      success: true,
      message: '产品型号创建成功',
      product_model: newProductModel
    });

  } catch (error) {
    console.error('创建产品型号失败:', error);
    return NextResponse.json(
      { error: '创建产品型号失败' },
      { status: 500 }
    );
  }
} 