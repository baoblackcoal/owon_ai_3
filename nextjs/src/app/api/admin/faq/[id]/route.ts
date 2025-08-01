import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getCloudflareContext } from '@opennextjs/cloudflare';
import type { FaqDeleteResponse } from '@/types/faq';

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

// GET: 获取单个FAQ详情
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 验证管理员权限
    const session = await auth();
    if (!session?.user?.role || session.user.role !== 'admin') {
      return NextResponse.json({ error: '无权限访问' }, { status: 403 });
    }

    const { env } = await getCloudflareContext();
    const db = (env as unknown as { DB?: D1Database }).DB;
    const { id } = await params;

    // 检查数据库连接
    if (!db) {
      console.error('数据库连接失败: DB not found in env');
      return NextResponse.json(
        { error: '数据库连接失败' },
        { status: 500 }
      );
    }

    // 查询FAQ详情
    const query = `
      SELECT 
        fq.id,
        fq.title,
        fq.content,
        fq.answer,
        fq.category_id,
        fq.product_model_id,
        fq.software_version,
        fq.views_count,
        fq.likes_count,
        fq.created_by,
        fq.created_at,
        fq.updated_at,
        fq.video_bilibili_bvid,
        fq.has_video,
        fc.name as category_name,
        fpm.name as product_model_name
      FROM faq_questions fq
      LEFT JOIN faq_categories fc ON fq.category_id = fc.id
      LEFT JOIN faq_product_models fpm ON fq.product_model_id = fpm.id
      WHERE fq.id = ?
    `;

    const faq = await db.prepare(query).bind(id).first();

    if (!faq) {
      return NextResponse.json({ error: 'FAQ不存在' }, { status: 404 });
    }

    // 查询标签
    const tagsQuery = `
      SELECT ft.name
      FROM faq_question_tags fqt
      JOIN faq_tags ft ON fqt.tag_id = ft.id
      WHERE fqt.question_id = ?
    `;

    const tagsResult = await db.prepare(tagsQuery).bind(id).all();
    const tags = tagsResult.results.map((row: Record<string, unknown>) => ({ name: row.name as string }));

    const result = {
      id: faq.id as string,
      title: faq.title as string,
      content: faq.content as string,
      answer: faq.answer as string,
      category_id: faq.category_id as string,
      product_model_id: faq.product_model_id as string,
      software_version: faq.software_version as string,
      views_count: faq.views_count as number,
      likes_count: faq.likes_count as number,
      created_by: faq.created_by as string,
      created_at: faq.created_at as string,
      updated_at: faq.updated_at as string,
      video_bilibili_bvid: faq.video_bilibili_bvid as string,
      has_video: Boolean(faq.has_video),
      category: faq.category_name ? {
        id: faq.category_id as string,
        name: faq.category_name as string
      } : null,
      product_model: faq.product_model_name ? {
        id: faq.product_model_id as string,
        name: faq.product_model_name as string
      } : null,
      tags
    };

    return NextResponse.json({ faq: result });
  } catch (error) {
    console.error('获取FAQ详情失败:', error);
    return NextResponse.json(
      { error: '获取FAQ详情失败' },
      { status: 500 }
    );
  }
}

// DELETE: 删除FAQ
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 验证管理员权限
    const session = await auth();
    if (!session?.user?.role || session.user.role !== 'admin') {
      return NextResponse.json({ error: '无权限访问' }, { status: 403 });
    }

    const { env } = await getCloudflareContext();
    const db = (env as unknown as { DB?: D1Database }).DB;
    const { id } = await params;

    // 检查数据库连接
    if (!db) {
      console.error('数据库连接失败: DB not found in env');
      return NextResponse.json(
        { error: '数据库连接失败' },
        { status: 500 }
      );
    }

    // 检查FAQ是否存在
    const existingFaq = await db.prepare('SELECT id FROM faq_questions WHERE id = ?').bind(id).first();
    if (!existingFaq) {
      return NextResponse.json({ error: 'FAQ不存在' }, { status: 404 });
    }

    // 删除FAQ（级联删除标签关联）
    await db.prepare('DELETE FROM faq_questions WHERE id = ?').bind(id).run();

    return NextResponse.json({
      success: true,
      message: 'FAQ删除成功'
    } as FaqDeleteResponse);

  } catch (error) {
    console.error('删除FAQ失败:', error);
    return NextResponse.json(
      { error: '删除FAQ失败' },
      { status: 500 }
    );
  }
} 