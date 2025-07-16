import { NextRequest, NextResponse } from 'next/server';
import { getCloudflareContext } from '@opennextjs/cloudflare';

interface FeedbackRequest {
  type: 'like' | 'dislike' | 'cancel';
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ messageId: string }> }
) {
  try {
    const { env } = await getCloudflareContext();
    const db = (env as unknown as { DB?: D1Database }).DB;

    if (!db) {
      return NextResponse.json(
        { error: 'D1 数据库未绑定' },
        { status: 500 }
      );
    }

    const { messageId } = await params;
    const { type } = await request.json() as FeedbackRequest;

    // 验证请求参数
    if (!['like', 'dislike', 'cancel'].includes(type)) {
      return NextResponse.json(
        { error: '无效的feedback类型' },
        { status: 400 }
      );
    }

    // 检查消息是否存在
    const message = await db.prepare(`
      SELECT id FROM ChatMessage WHERE id = ?
    `).bind(messageId).first();

    if (!message) {
      return NextResponse.json(
        { error: '消息不存在' },
        { status: 404 }
      );
    }

    // 更新feedback
    let feedbackValue: number | null = null;
    if (type === 'like') {
      feedbackValue = 1;
    } else if (type === 'dislike') {
      feedbackValue = -1;
    }
    // type === 'cancel' 时 feedbackValue 保持 null

    await db.prepare(`
      UPDATE ChatMessage 
      SET feedback = ? 
      WHERE id = ?
    `).bind(feedbackValue, messageId).run();

    return NextResponse.json({ 
      success: true, 
      feedback: type === 'cancel' ? null : type 
    });

  } catch (error) {
    console.error('更新feedback失败:', error);
    return NextResponse.json(
      { error: '更新feedback失败' },
      { status: 500 }
    );
  }
} 