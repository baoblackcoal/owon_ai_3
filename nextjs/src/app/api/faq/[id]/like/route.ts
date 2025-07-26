import { NextRequest } from 'next/server';
import { getCloudflareContext } from '@/lib/cloudflare';
import { getServerSession } from '@/lib/auth';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession();
    if (!session?.user) {
      return Response.json({ error: '请先登录' }, { status: 401 });
    }

    const { env } = await getCloudflareContext();
    const { id } = params;

    // 检查是否已点赞
    const existingLike = await env.DB.prepare(
      'SELECT * FROM faq_likes WHERE user_id = ? AND question_id = ?'
    ).bind(session.user.id, id).first();

    if (existingLike) {
      // 取消点赞
      await env.DB.prepare(
        'DELETE FROM faq_likes WHERE user_id = ? AND question_id = ?'
      ).bind(session.user.id, id).run();

      await env.DB.prepare(
        'UPDATE faq_questions SET likes_count = likes_count - 1 WHERE id = ?'
      ).bind(id).run();

      return Response.json({ liked: false });
    } else {
      // 添加点赞
      await env.DB.prepare(
        'INSERT INTO faq_likes (user_id, question_id) VALUES (?, ?)'
      ).bind(session.user.id, id).run();

      await env.DB.prepare(
        'UPDATE faq_questions SET likes_count = likes_count + 1 WHERE id = ?'
      ).bind(id).run();

      return Response.json({ liked: true });
    }
  } catch (error) {
    console.error('点赞失败:', error);
    return Response.json({ error: '操作失败' }, { status: 500 });
  }
} 