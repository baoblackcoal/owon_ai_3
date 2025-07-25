import { NextRequest, NextResponse } from 'next/server';
import { getCloudflareContext } from '@/lib/env';
import type { FaqListParams, FaqListResponse } from '@/types/faq';

export async function GET(request: NextRequest) {
  try {
    const { env } = await getCloudflareContext();
    const { searchParams } = new URL(request.url);
    
    // 解析查询参数
    const params: FaqListParams = {
      q: searchParams.get('q') || undefined,
      category_id: searchParams.get('category_id') || undefined,
      product_model_id: searchParams.get('product_model_id') || undefined,
      tag_id: searchParams.get('tag_id') || undefined,
      sort: (searchParams.get('sort') as any) || 'latest',
      period: (searchParams.get('period') as any) || 'all',
      limit: parseInt(searchParams.get('limit') || '20'),
      cursor: searchParams.get('cursor') || undefined
    };

    // 构建基础 SQL 查询
    let baseQuery = `
      SELECT DISTINCT
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
    `;

    const conditions: string[] = [];
    const queryParams: any[] = [];

    // 标签关联查询
    if (params.tag_id) {
      baseQuery += ` 
        INNER JOIN faq_question_tags qt ON q.id = qt.question_id 
        INNER JOIN faq_tags t ON qt.tag_id = t.id
      `;
      conditions.push('t.id = ?');
      queryParams.push(params.tag_id);
    }

    // 搜索条件
    if (params.q) {
      conditions.push(`(
        q.title LIKE ? OR 
        q.content LIKE ? OR
        EXISTS (
          SELECT 1 FROM faq_question_tags qt2 
          INNER JOIN faq_tags t2 ON qt2.tag_id = t2.id 
          WHERE qt2.question_id = q.id AND t2.name LIKE ?
        )
      )`);
      const searchTerm = `%${params.q}%`;
      queryParams.push(searchTerm, searchTerm, searchTerm);
    }

    // 分类筛选
    if (params.category_id) {
      conditions.push('q.category_id = ?');
      queryParams.push(params.category_id);
    }

    // 机型筛选
    if (params.product_model_id) {
      conditions.push('q.product_model_id = ?');
      queryParams.push(params.product_model_id);
    }

    // 时间范围筛选（仅在排行模式下）
    if (params.sort === 'ranking' && params.period !== 'all') {
      const now = new Date();
      let timeLimit: Date;
      
      switch (params.period) {
        case 'week':
          timeLimit = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case 'month':
          timeLimit = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        case 'quarter':
          timeLimit = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
          break;
        case 'year':
          timeLimit = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
          break;
        default:
          timeLimit = new Date(0);
      }
      
      conditions.push('q.created_at >= ?');
      queryParams.push(timeLimit.toISOString().slice(0, 19).replace('T', ' '));
    }

    // 分页条件
    if (params.cursor) {
      conditions.push('q.id > ?');
      queryParams.push(params.cursor);
    }

    // 添加 WHERE 条件
    if (conditions.length > 0) {
      baseQuery += ' WHERE ' + conditions.join(' AND ');
    }

    // 排序
    let orderBy = '';
    switch (params.sort) {
      case 'latest':
        orderBy = 'ORDER BY q.created_at DESC';
        break;
      case 'best':
        orderBy = 'ORDER BY q.likes_count DESC, q.created_at DESC';
        break;
      case 'ranking':
        orderBy = 'ORDER BY q.views_count DESC, q.created_at DESC';
        break;
      case 'my-share':
        // TODO: 需要用户认证，暂时按创建时间排序
        orderBy = 'ORDER BY q.created_at DESC';
        break;
      default:
        orderBy = 'ORDER BY q.created_at DESC';
    }

    baseQuery += ` ${orderBy} LIMIT ?`;
    queryParams.push(params.limit! + 1); // 多取一条用于判断是否有下一页

    // 执行查询
    const result = await env.DB.prepare(baseQuery).bind(...queryParams).all();
    const questions = result.results as any[];

    // 判断是否有下一页
    const hasNextPage = questions.length > params.limit!;
    if (hasNextPage) {
      questions.pop(); // 移除多取的一条
    }

    // 获取每个问题的标签
    const questionIds = questions.map(q => q.id);
    let questionTags: any[] = [];
    
    if (questionIds.length > 0) {
      const tagsQuery = `
        SELECT 
          qt.question_id,
          t.id,
          t.name
        FROM faq_question_tags qt
        INNER JOIN faq_tags t ON qt.tag_id = t.id
        WHERE qt.question_id IN (${questionIds.map(() => '?').join(',')})
        ORDER BY t.name ASC
      `;
      const tagsResult = await env.DB.prepare(tagsQuery).bind(...questionIds).all();
      questionTags = tagsResult.results as any[];
    }

    // 组装返回数据
    const questionsWithTags = questions.map(question => ({
      ...question,
      category: question.category_name ? {
        id: question.category_id,
        name: question.category_name
      } : null,
      product_model: question.product_model_name ? {
        id: question.product_model_id,
        name: question.product_model_name
      } : null,
      tags: questionTags
        .filter(tag => tag.question_id === question.id)
        .map(tag => ({
          id: tag.id,
          name: tag.name
        }))
    }));

    const response: FaqListResponse = {
      data: questionsWithTags,
      nextCursor: hasNextPage ? questions[questions.length - 1]?.id : undefined
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('[FAQ List API Error]:', error);
    return NextResponse.json(
      { error: '获取问题列表失败' },
      { status: 500 }
    );
  }
} 