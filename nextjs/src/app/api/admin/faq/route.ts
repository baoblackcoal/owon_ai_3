import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getCloudflareContext } from '@opennextjs/cloudflare';
import type { FaqSaveResponse } from '@/types/faq';

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

// GET: 获取FAQ列表
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

    // 构建查询
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
      ORDER BY fq.created_at DESC
    `;

    const result = await db.prepare(query).all();
    const faqs = result.results.map((row: Record<string, unknown>) => ({
      id: row.id as string,
      title: row.title as string,
      content: row.content as string,
      answer: row.answer as string,
      category_id: row.category_id as string,
      product_model_id: row.product_model_id as string,
      software_version: row.software_version as string,
      views_count: row.views_count as number,
      likes_count: row.likes_count as number,
      created_by: row.created_by as string,
      created_at: row.created_at as string,
      updated_at: row.updated_at as string,
      video_bilibili_bvid: row.video_bilibili_bvid as string,
      has_video: Boolean(row.has_video),
      category: row.category_name ? {
        id: row.category_id as string,
        name: row.category_name as string
      } : null,
      product_model: row.product_model_name ? {
        id: row.product_model_id as string,
        name: row.product_model_name as string
      } : null,
      tags: [] // 暂时不加载标签，需要单独查询
    }));

    return NextResponse.json({ faqs });
  } catch (error) {
    console.error('获取FAQ列表失败:', error);
    return NextResponse.json(
      { error: '获取FAQ列表失败' },
      { status: 500 }
    );
  }
}

// POST: 创建或更新FAQ
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

    const {
      id,
      title,
      content,
      answer,
      category_id,
      product_model_id,
      software_version,
      video_bilibili_bvid,
      tags = []
    } = body as {
      id?: string;
      title?: string;
      content?: string;
      answer?: string;
      category_id?: string;
      product_model_id?: string;
      software_version?: string;
      video_bilibili_bvid?: string;
      tags?: string[];
    };

    // 验证必填字段
    if (!title?.trim() || !content?.trim() || !answer?.trim()) {
      return NextResponse.json(
        { error: '标题、问题内容和答案内容为必填字段' },
        { status: 400 }
      );
    }

    const hasVideo = Boolean(video_bilibili_bvid?.trim());
    const userId = session.user.id;

    if (id) {
      // 更新现有FAQ
      const updateQuery = `
        UPDATE faq_questions 
        SET 
          title = ?, 
          content = ?, 
          answer = ?, 
          category_id = ?, 
          product_model_id = ?, 
          software_version = ?, 
          video_bilibili_bvid = ?, 
          has_video = ?,
          updated_at = datetime('now', 'localtime')
        WHERE id = ?
      `;

      await db.prepare(updateQuery).bind(
        title.trim(),
        content.trim(),
        answer.trim(),
        category_id || null,
        product_model_id || null,
        software_version?.trim() || null,
        video_bilibili_bvid?.trim() || null,
        hasVideo ? 1 : 0,
        id
      ).run();

      // 更新标签关联
      await updateFaqTags(db, id, tags);

      return NextResponse.json({
        success: true,
        message: 'FAQ更新成功',
        faq: { id, title, content, answer }
      } as FaqSaveResponse);

    } else {
      // 创建新FAQ
      const insertQuery = `
        INSERT INTO faq_questions (
          title, content, answer, category_id, product_model_id, 
          software_version, video_bilibili_bvid, has_video, created_by
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      const result = await db.prepare(insertQuery).bind(
        title.trim(),
        content.trim(),
        answer.trim(),
        category_id || null,
        product_model_id || null,
        software_version?.trim() || null,
        video_bilibili_bvid?.trim() || null,
        hasVideo ? 1 : 0,
        userId
      ).run();

      const newId = result.meta.last_row_id.toString();

      // 创建标签关联
      await updateFaqTags(db, newId, tags);

      return NextResponse.json({
        success: true,
        message: 'FAQ创建成功',
        faq: { id: newId, title, content, answer }
      } as FaqSaveResponse);
    }

  } catch (error) {
    console.error('保存FAQ失败:', error);
    return NextResponse.json(
      { error: '保存FAQ失败' },
      { status: 500 }
    );
  }
}

// 更新FAQ标签关联
async function updateFaqTags(db: D1Database, faqId: string, tags: string[]) {
  // 删除现有标签关联
  await db.prepare('DELETE FROM faq_question_tags WHERE question_id = ?').bind(faqId).run();

  // 添加新标签关联
  for (const tagName of tags) {
    if (!tagName.trim()) continue;

    // 查找或创建标签
    const existingTag = await db.prepare('SELECT id FROM faq_tags WHERE name = ?').bind(tagName.trim()).first();
    let tagId: string;
    
    if (!existingTag) {
      const result = await db.prepare('INSERT INTO faq_tags (name) VALUES (?)').bind(tagName.trim()).run();
      tagId = result.meta.last_row_id.toString();
    } else {
      tagId = existingTag.id as string;
    }

    // 创建关联
    await db.prepare('INSERT INTO faq_question_tags (question_id, tag_id) VALUES (?, ?)').bind(faqId, tagId).run();
  }
} 