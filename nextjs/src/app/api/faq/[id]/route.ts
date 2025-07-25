import { NextRequest, NextResponse } from 'next/server';
import { getCloudflareContext } from '@/lib/env';
import type { FaqDetailResponse } from '@/types/faq';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { env } = await getCloudflareContext();
    const questionId = params.id;

    // 获取问题详情
    const questionResult = await env.DB.prepare(`
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
        c.description as category_description,
        pm.name as product_model_name
      FROM faq_questions q
      LEFT JOIN faq_categories c ON q.category_id = c.id
      LEFT JOIN faq_product_models pm ON q.product_model_id = pm.id
      WHERE q.id = ?
    `).bind(questionId).first();

    if (!questionResult) {
      return NextResponse.json(
        { error: '问题不存在' },
        { status: 404 }
      );
    }

    // 获取问题的标签
    const tagsResult = await env.DB.prepare(`
      SELECT 
        t.id,
        t.name,
        t.created_at
      FROM faq_question_tags qt
      INNER JOIN faq_tags t ON qt.tag_id = t.id
      WHERE qt.question_id = ?
      ORDER BY t.name ASC
    `).bind(questionId).all();

    // 获取答案列表
    const answersResult = await env.DB.prepare(`
      SELECT 
        a.id,
        a.question_id,
        a.content,
        a.software_version,
        a.product_model_id,
        a.likes_count,
        a.created_by,
        a.created_at,
        pm.name as product_model_name
      FROM faq_answers a
      LEFT JOIN faq_product_models pm ON a.product_model_id = pm.id
      WHERE a.question_id = ?
      ORDER BY a.likes_count DESC, a.created_at ASC
    `).bind(questionId).all();

    // 获取相关推荐问题（相同标签的其他问题）
    let relatedQuestions: any[] = [];
    if (tagsResult.results.length > 0) {
      const tagIds = (tagsResult.results as any[]).map(tag => tag.id);
      const relatedResult = await env.DB.prepare(`
        SELECT DISTINCT
          q.id,
          q.title,
          q.views_count,
          q.likes_count,
          q.created_at,
          c.name as category_name,
          pm.name as product_model_name
        FROM faq_questions q
        LEFT JOIN faq_categories c ON q.category_id = c.id
        LEFT JOIN faq_product_models pm ON q.product_model_id = pm.id
        INNER JOIN faq_question_tags qt ON q.id = qt.question_id
        WHERE qt.tag_id IN (${tagIds.map(() => '?').join(',')})
          AND q.id != ?
        ORDER BY q.likes_count DESC, q.views_count DESC
        LIMIT 6
      `).bind(...tagIds, questionId).all();
      
      relatedQuestions = relatedResult.results as any[];
    }

    // 更新浏览量（简单实现，生产环境可考虑防刷机制）
    await env.DB.prepare(`
      UPDATE faq_questions 
      SET views_count = views_count + 1 
      WHERE id = ?
    `).bind(questionId).run();

    // 组装返回数据
    const question = {
      ...questionResult,
      category: questionResult.category_name ? {
        id: questionResult.category_id,
        name: questionResult.category_name,
        description: questionResult.category_description
      } : null,
      product_model: questionResult.product_model_name ? {
        id: questionResult.product_model_id,
        name: questionResult.product_model_name
      } : null,
      tags: (tagsResult.results as any[]).map(tag => ({
        id: tag.id,
        name: tag.name,
        created_at: tag.created_at
      })),
      views_count: questionResult.views_count + 1 // 显示更新后的浏览量
    };

    const answers = (answersResult.results as any[]).map(answer => ({
      ...answer,
      product_model: answer.product_model_name ? {
        id: answer.product_model_id,
        name: answer.product_model_name
      } : null
    }));

    const relatedQuestionsWithTags = relatedQuestions.map(q => ({
      ...q,
      category: q.category_name ? {
        id: q.category_id,
        name: q.category_name
      } : null,
      product_model: q.product_model_name ? {
        id: q.product_model_id,
        name: q.product_model_name
      } : null
    }));

    const response: FaqDetailResponse = {
      question: question as any,
      answers: answers as any,
      related_questions: relatedQuestionsWithTags as any
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('[FAQ Detail API Error]:', error);
    return NextResponse.json(
      { error: '获取问题详情失败' },
      { status: 500 }
    );
  }
} 