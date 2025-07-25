import { NextRequest, NextResponse } from 'next/server';
import { getCloudflareContext } from '@opennextjs/cloudflare';
import type { FaqQuestion } from '@/types/faq';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { env } = await getCloudflareContext();
    // 移除所有q_前缀，只保留数字部分
    const questionId = params.id;
    console.log('Fetching FAQ question:', questionId);

    // 通过类型断言解决 linter 对 env.DB 的类型提示
    const db = (env as unknown as { DB?: D1Database }).DB;

    if (!db) {
      console.log('D1 database not bound');
      return NextResponse.json(
        { error: 'D1 数据库未绑定，请使用 `npm run preview` 或部署到 Cloudflare 后再访问此接口' },
        { status: 500 }
      );
    }

    // 获取问题详情
    const questionQuery = `
      SELECT 
        q.id,
        q.title,
        q.content,
        q.category_id,
        q.product_model_id,
        q.software_version,
        q.views_count,
        q.likes_count,
        q.created_by,
        q.created_at,
        q.updated_at,
        c.name as category_name,
        pm.name as product_model_name
      FROM faq_questions q
      LEFT JOIN faq_categories c ON q.category_id = c.id
      LEFT JOIN faq_product_models pm ON q.product_model_id = pm.id
      WHERE q.id = ?
    `;

    console.log('Executing question query with ID:', questionId);
    const questionResult = await db.prepare(questionQuery).bind(questionId).first();
    console.log('Question result:', questionResult);

    if (!questionResult) {
      console.log('Question not found');
      return NextResponse.json(
        { error: '问题未找到' },
        { status: 404 }
      );
    }

    // 获取问题的标签
    const tagsQuery = `
      SELECT 
        t.id,
        t.name
      FROM faq_question_tags qt
      INNER JOIN faq_tags t ON qt.tag_id = t.id
      WHERE qt.question_id = ?
      ORDER BY t.name ASC
    `;

    const tagsResult = await db.prepare(tagsQuery).bind(questionId).all();
    const tags = tagsResult.results as any[];

    // 获取问题的答案
    const answersQuery = `
      SELECT 
        a.id,
        a.question_id,
        a.content,
        a.software_version,
        a.likes_count,
        a.created_at,
        pm.name as product_model_name
      FROM faq_answers a
      LEFT JOIN faq_product_models pm ON a.product_model_id = pm.id
      WHERE a.question_id = ?
      ORDER BY a.created_at ASC
    `;

    const answersResult = await db.prepare(answersQuery).bind(questionId).all();
    const answers = answersResult.results as any[];

    // 组装返回数据
    const question: FaqQuestion = {
      ...(questionResult as any),
      category: (questionResult as any).category_name ? {
        id: (questionResult as any).category_id,
        name: (questionResult as any).category_name,
        created_at: (questionResult as any).created_at
      } : undefined,
      product_model: (questionResult as any).product_model_name ? {
        id: (questionResult as any).product_model_id,
        name: (questionResult as any).product_model_name,
        created_at: (questionResult as any).created_at
      } : undefined,
      tags: tags.map(tag => ({
        id: tag.id,
        name: tag.name,
        created_at: tag.created_at
      })),
      answers: answers.map(answer => ({
        id: answer.id,
        question_id: answer.question_id,
        content: answer.content,
        software_version: answer.software_version,
        likes_count: answer.likes_count,
        created_at: answer.created_at,
        product_model: answer.product_model_name ? {
          id: answer.product_model_id,
          name: answer.product_model_name,
          created_at: answer.created_at
        } : undefined
      }))
    };

    // 增加浏览次数
    await db.prepare(`
      UPDATE faq_questions 
      SET views_count = views_count + 1 
      WHERE id = ?
    `).bind(questionId).run();

    return NextResponse.json({
      question,
      answers: question.answers,
      related_questions: [] // 暂时不返回相关问题
    });

  } catch (error) {
    console.error('[FAQ Detail API Error]:', error);
    return NextResponse.json(
      { error: '获取问题详情失败' },
      { status: 500 }
    );
  }
} 