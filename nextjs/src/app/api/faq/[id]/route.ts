import { NextRequest, NextResponse } from 'next/server';
import { FaqDetailResponse } from '@/types/faq';
import { getCloudflareContext } from '@opennextjs/cloudflare';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { env } = await getCloudflareContext();
    const questionId = params.id;

    // TODO: 后续添加用户认证
    const userId: string | null = null;

    // 获取问题详情
    const questionQuery = `
      SELECT 
        q.id,
        q.title,
        q.content,
        q.answer,
        q.category_id,
        q.product_model_id,
        q.software_version,
        q.views_count,
        q.likes_count,
        q.created_by,
        q.created_at,
        q.updated_at,
        c.name as category_name,
        c.description as category_description,
        c.created_at as category_created_at,
        pm.name as product_model_name,
        pm.created_at as product_model_created_at,
        CASE WHEN l.id IS NOT NULL THEN 1 ELSE 0 END as is_liked
      FROM faq_questions q
      LEFT JOIN faq_categories c ON q.category_id = c.id
      LEFT JOIN faq_product_models pm ON q.product_model_id = pm.id
      LEFT JOIN faq_likes l ON q.id = l.question_id AND l.user_id = ?
      WHERE q.id = ?
    `;

    const questionResult = await env.DB.prepare(questionQuery)
      .bind(userId, questionId)
      .first();

    if (!questionResult) {
      return NextResponse.json(
        { error: 'Question not found' },
        { status: 404 }
      );
    }

    // 获取问题的标签
    const tagsQuery = `
      SELECT t.id, t.name, t.created_at
      FROM faq_question_tags qt
      INNER JOIN faq_tags t ON qt.tag_id = t.id
      WHERE qt.question_id = ?
      ORDER BY t.name ASC
    `;
    const tagsResult = await env.DB.prepare(tagsQuery).bind(questionId).all();
    const tags = tagsResult.results || [];

    // 获取相关推荐问题（同标签的其他问题，最多6条）
    let relatedQuestions: any[] = [];
    if (tags.length > 0) {
      const tagIds = (tags as any[]).map(tag => tag.id);
      const relatedQuery = `
        SELECT DISTINCT
          q.id,
          q.title,
          q.content,
          q.answer,
          q.category_id,
          q.product_model_id,
          q.software_version,
          q.views_count,
          q.likes_count,
          q.created_by,
          q.created_at,
          q.updated_at,
          c.name as category_name,
          pm.name as product_model_name,
          CASE WHEN l.id IS NOT NULL THEN 1 ELSE 0 END as is_liked
        FROM faq_questions q
        LEFT JOIN faq_categories c ON q.category_id = c.id
        LEFT JOIN faq_product_models pm ON q.product_model_id = pm.id
        LEFT JOIN faq_likes l ON q.id = l.question_id AND l.user_id = ?
        INNER JOIN faq_question_tags qt ON q.id = qt.question_id
        WHERE qt.tag_id IN (${tagIds.map(() => '?').join(',')})
          AND q.id != ?
        ORDER BY q.views_count DESC, q.created_at DESC
        LIMIT 6
      `;
      const relatedResult = await env.DB.prepare(relatedQuery)
        .bind(userId, ...tagIds, questionId)
        .all();
      relatedQuestions = relatedResult.results || [];
    }

    // 更新浏览量（简单实现，生产环境可能需要防刷机制）
    await env.DB.prepare('UPDATE faq_questions SET views_count = views_count + 1 WHERE id = ?')
      .bind(questionId)
      .run();

    // 格式化响应数据
    const question = {
      id: questionResult.id,
      title: questionResult.title,
      content: questionResult.content,
      answer: questionResult.answer,
      category_id: questionResult.category_id,
      product_model_id: questionResult.product_model_id,
      software_version: questionResult.software_version,
      views_count: questionResult.views_count + 1, // 反映更新后的浏览量
      likes_count: questionResult.likes_count,
      created_by: questionResult.created_by,
      created_at: questionResult.created_at,
      updated_at: questionResult.updated_at,
      is_liked: Boolean(questionResult.is_liked),
      category: questionResult.category_name ? {
        id: questionResult.category_id,
        name: questionResult.category_name,
        description: questionResult.category_description,
        created_at: questionResult.category_created_at,
      } : undefined,
      product_model: questionResult.product_model_name ? {
        id: questionResult.product_model_id,
        name: questionResult.product_model_name,
        category_id: questionResult.category_id,
        created_at: questionResult.product_model_created_at,
      } : undefined,
      tags: tags.map((tag: any) => ({
        id: tag.id,
        name: tag.name,
        created_at: tag.created_at,
      })),
    };

    const related = relatedQuestions.map((q: any) => ({
      id: q.id,
      title: q.title,
      content: q.content,
      answer: q.answer,
      category_id: q.category_id,
      product_model_id: q.product_model_id,
      software_version: q.software_version,
      views_count: q.views_count,
      likes_count: q.likes_count,
      created_by: q.created_by,
      created_at: q.created_at,
      updated_at: q.updated_at,
      is_liked: Boolean(q.is_liked),
      category: q.category_name ? {
        id: q.category_id,
        name: q.category_name,
        description: undefined,
        created_at: '',
      } : undefined,
      product_model: q.product_model_name ? {
        id: q.product_model_id,
        name: q.product_model_name,
        category_id: q.category_id,
        created_at: '',
      } : undefined,
      tags: [], // 简化处理，不获取每个相关问题的标签
    }));

    const response: FaqDetailResponse = {
      question,
      related_questions: related,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('FAQ detail API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 