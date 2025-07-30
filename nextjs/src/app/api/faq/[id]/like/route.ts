import { NextRequest } from 'next/server';
import { getCloudflareContext } from '@opennextjs/cloudflare';
import { auth } from '@/lib/auth';
import { verifyOrigin, verifyMethod } from '@/lib/security';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 验证请求方法和Origin
    if (!verifyMethod(request, ['POST'])) {
      return Response.json({ error: '不允许的请求方法' }, { status: 405 });
    }
    
    if (!verifyOrigin(request)) {
      return Response.json({ error: '请求来源验证失败' }, { status: 403 });
    }
    
    const session = await auth();
    if (!session?.user) {
      return Response.json({ error: '请先登录' }, { status: 401 });
    }

    const { env } = await getCloudflareContext();
    const { id } = await params;

    // 使用事务确保数据一致性
    try {
      // 检查是否已点赞
      const existingLike = await env.DB.prepare(
        'SELECT * FROM faq_likes WHERE user_id = ? AND question_id = ?'
      ).bind(session.user.id, id).first();

      if (existingLike) {
        // 取消点赞 - 使用事务
        const deleteResult = await env.DB.prepare(
          'DELETE FROM faq_likes WHERE user_id = ? AND question_id = ?'
        ).bind(session.user.id, id).run();

        if (deleteResult.success) {
          await env.DB.prepare(
            'UPDATE faq_questions SET likes_count = CASE WHEN likes_count > 0 THEN likes_count - 1 ELSE 0 END WHERE id = ?'
          ).bind(id).run();
        }

        return Response.json({ liked: false });
      } else {
        // 添加点赞 - 使用事务
        const insertResult = await env.DB.prepare(
          'INSERT INTO faq_likes (user_id, question_id) VALUES (?, ?)'
        ).bind(session.user.id, id).run();

        if (insertResult.success) {
          await env.DB.prepare(
            'UPDATE faq_questions SET likes_count = likes_count + 1 WHERE id = ?'
          ).bind(id).run();
        }

        return Response.json({ liked: true });
      }
    } catch (dbError) {
      console.error('数据库操作失败:', dbError);
      return Response.json({ error: '操作失败，请重试' }, { status: 500 });
    }
  } catch (error) {
    console.error('点赞失败:', error);
    return Response.json({ error: '操作失败' }, { status: 500 });
  }
} 