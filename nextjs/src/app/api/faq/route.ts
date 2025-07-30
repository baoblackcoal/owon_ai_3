import { NextRequest, NextResponse } from 'next/server';
import { FaqListParams, FaqListResponse } from '@/types/faq';
import { getCloudflareContext } from '@opennextjs/cloudflare';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const { env } = await getCloudflareContext();

    // 解析查询参数
    const params: FaqListParams = {
      q: searchParams.get('q') || undefined,
      category_id: searchParams.get('category_id') ? parseInt(searchParams.get('category_id')!) : undefined,
      product_model_id: searchParams.get('product_model_id') ? parseInt(searchParams.get('product_model_id')!) : undefined,
      tag_id: searchParams.get('tag_id') ? parseInt(searchParams.get('tag_id')!) : undefined,
      has_video: searchParams.get('has_video') === 'true' ? true : undefined,
      sort: (searchParams.get('sort') as FaqListParams['sort']) || 'latest',
      period: (searchParams.get('period') as FaqListParams['period']) || 'all',
      limit: parseInt(searchParams.get('limit') || '20'),
      cursor: searchParams.get('cursor') || undefined,
    };

    // TODO: 后续添加用户认证
    const userId: string | null = null;

    // 构建基础查询
    let baseQuery = `
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
        q.video_bilibili_bvid,
        q.has_video,
        c.name as category_name,
        pm.name as product_model_name,
        CASE WHEN l.id IS NOT NULL THEN 1 ELSE 0 END as is_liked
      FROM faq_questions q
      LEFT JOIN faq_categories c ON q.category_id = c.id
      LEFT JOIN faq_product_models pm ON q.product_model_id = pm.id
      LEFT JOIN faq_likes l ON q.id = l.question_id AND l.user_id = ?
    `;

    const queryParams: (string | number)[] = [userId || 0];

    // 添加WHERE条件
    const whereConditions: string[] = [];

    // 搜索条件
    if (params.q) {
      whereConditions.push('(q.title LIKE ? OR q.content LIKE ? OR q.answer LIKE ?)');
      const searchPattern = `%${params.q}%`;
      queryParams.push(searchPattern, searchPattern, searchPattern);
    }

    // 分类筛选
    if (params.category_id) {
      whereConditions.push('q.category_id = ?');
      queryParams.push(params.category_id);
    }

    // 产品型号筛选
    if (params.product_model_id) {
      whereConditions.push('q.product_model_id = ?');
      queryParams.push(params.product_model_id);
    }

    // 视频筛选
    if (params.has_video) {
      whereConditions.push('q.has_video = 1');
    }

    // 标签筛选
    if (params.tag_id) {
      baseQuery = `
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
          q.video_bilibili_bvid,
          q.has_video,
          c.name as category_name,
          pm.name as product_model_name,
          CASE WHEN l.id IS NOT NULL THEN 1 ELSE 0 END as is_liked
        FROM faq_questions q
        LEFT JOIN faq_categories c ON q.category_id = c.id
        LEFT JOIN faq_product_models pm ON q.product_model_id = pm.id
        LEFT JOIN faq_likes l ON q.id = l.question_id AND l.user_id = ?
        INNER JOIN faq_question_tags qt ON q.id = qt.question_id
      `;
      whereConditions.push('qt.tag_id = ?');
      queryParams.push(params.tag_id);
    }

    // 我的分享筛选（仅登录用户）
    if (params.sort === 'my-share' && userId) {
      whereConditions.push('q.created_by = ?');
      queryParams.push(userId);
    }

    // 时间范围筛选（仅在ranking排序时生效）
    if (params.sort === 'ranking' && params.period && params.period !== 'all') {
      const periodMap: Record<string, string> = {
        week: "datetime('now', '-7 days')",
        month: "datetime('now', '-1 month')",
        quarter: "datetime('now', '-3 months')",
        year: "datetime('now', '-1 year')",
      };
      if (periodMap[params.period]) {
        whereConditions.push(`q.created_at >= ${periodMap[params.period]}`);
      }
    }

    // 分页条件
    if (params.cursor) {
      whereConditions.push('q.created_at < ?');
      queryParams.push(params.cursor);
    }

    // 添加WHERE子句
    if (whereConditions.length > 0) {
      baseQuery += ' WHERE ' + whereConditions.join(' AND ');
    }

    // 添加排序
    const sortMap = {
      latest: 'q.created_at DESC',
      best: 'q.likes_count DESC, q.created_at DESC',
      ranking: 'q.views_count DESC, q.created_at DESC',
      'my-share': 'q.created_at DESC',
    };
    baseQuery += ` ORDER BY ${sortMap[params.sort as keyof typeof sortMap]}`;

    // 添加限制
    const limit = params.limit || 20;
    baseQuery += ` LIMIT ${limit + 1}`;

    // 执行查询
    const result = await env.DB.prepare(baseQuery).bind(...queryParams).all();
    const questions = (result.results as Array<{
      id: number;
      title: string;
      content: string;
      answer: string;
      category_id: number;
      product_model_id: number;
      software_version: string;
      views_count: number;
      likes_count: number;
      created_by: number;
      created_at: string;
      updated_at: string;
      video_bilibili_bvid: string;
      has_video: number;
      is_liked: number;
      category_name?: string;
      product_model_name?: string;
    }>) || [];

    // 处理分页
    let nextCursor: string | undefined;
    if (questions.length > limit) {
      const lastItem = questions.pop();
      nextCursor = (lastItem as { created_at: string })?.created_at;
    }

    // 获取每个问题的标签
    const questionIds = questions.map((q) => q.id);
    const tagsMap: Record<string, { id: number; name: string; created_at: string }[]> = {};

    if (questionIds.length > 0) {
      const tagsQuery = `
        SELECT qt.question_id, t.id, t.name, t.created_at
        FROM faq_question_tags qt
        INNER JOIN faq_tags t ON qt.tag_id = t.id
        WHERE qt.question_id IN (${questionIds.map(() => '?').join(',')})
      `;
      const tagsResult = await env.DB.prepare(tagsQuery).bind(...questionIds).all();
      
      (tagsResult.results as Array<{ question_id: number; id: number; name: string; created_at: string }> || []).forEach((tag) => {
        if (!tagsMap[tag.question_id]) {
          tagsMap[tag.question_id] = [];
        }
        tagsMap[tag.question_id].push({
          id: tag.id,
          name: tag.name,
          created_at: tag.created_at,
        });
      });
    }

    // 格式化响应数据
    const formattedQuestions = questions.map((q: { 
      id: number; 
      title: string; 
      content: string; 
      answer: string; 
      category_id: number; 
      product_model_id: number; 
      software_version: string; 
      views_count: number; 
      likes_count: number; 
      created_by: number; 
      created_at: string; 
      updated_at: string; 
      video_bilibili_bvid: string; 
      has_video: number; 
      is_liked: number; 
      category_name?: string; 
      product_model_name?: string; 
    }) => ({
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
      video_bilibili_bvid: q.video_bilibili_bvid,
      has_video: Boolean(q.has_video),
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
      tags: (q.id && tagsMap[q.id]) || [],
    }));

    const response: FaqListResponse = {
      data: formattedQuestions,
      nextCursor,
      total: undefined, // 可选：如果需要总数可以单独查询
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('FAQ list API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 