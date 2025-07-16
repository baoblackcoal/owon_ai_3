import { NextRequest, NextResponse } from 'next/server';
import { getCloudflareContext } from '@opennextjs/cloudflare';
import { getCurrentUser } from '@/lib/user-utils';

// 获取历史对话列表
export async function GET(request: NextRequest) {
    try {
        const { env } = await getCloudflareContext();
        const db = (env as unknown as { DB?: D1Database }).DB;

        if (!db) {
            return NextResponse.json(
                { error: 'D1 数据库未绑定' },
                { status: 500 }
            );
        }

        // 获取当前用户
        const currentUser = await getCurrentUser(request);
        if (!currentUser) {
            return NextResponse.json([]);
        }

        const { results } = await db.prepare(`
            SELECT id, title, createdAt, updatedAt, messageCount 
            FROM Chat 
            WHERE user_id = ?
            ORDER BY updatedAt DESC 
            LIMIT 50
        `).bind(currentUser.id).all();

        return NextResponse.json(results);
    } catch (error) {
        console.error('获取历史对话失败:', error);
        return NextResponse.json(
            { error: '获取历史对话失败' },
            { status: 500 }
        );
    }
}

interface CreateChatRequest {
    title?: string;
}

// 创建新对话
export async function POST(request: NextRequest) {
    try {
        const { env } = await getCloudflareContext();
        const db = (env as unknown as { DB?: D1Database }).DB;

        if (!db) {
            return NextResponse.json(
                { error: 'D1 数据库未绑定' },
                { status: 500 }
            );
        }

        // 获取当前用户
        const currentUser = await getCurrentUser(request);
        if (!currentUser) {
            return NextResponse.json(
                { error: '用户未登录' },
                { status: 401 }
            );
        }

        const { title } = await request.json() as CreateChatRequest;
        const chatId = crypto.randomUUID();

        await db.prepare(`
            INSERT INTO Chat (id, title, user_id, createdAt, updatedAt, messageCount)
            VALUES (?, ?, ?, datetime('now'), datetime('now'), 0)
        `).bind(chatId, title || '新对话', currentUser.id).run();

        return NextResponse.json({ id: chatId, title: title || '新对话' });
    } catch (error) {
        console.error('创建新对话失败:', error);
        return NextResponse.json(
            { error: '创建新对话失败' },
            { status: 500 }
        );
    }
} 