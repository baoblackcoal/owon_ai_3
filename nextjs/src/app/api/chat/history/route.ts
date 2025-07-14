import { NextResponse } from 'next/server';
import { getCloudflareContext } from '@opennextjs/cloudflare';

// 获取历史对话列表
export async function GET() {
    try {
        const { env } = await getCloudflareContext();
        const db = (env as unknown as { DB?: D1Database }).DB;

        if (!db) {
            return NextResponse.json(
                { error: 'D1 数据库未绑定' },
                { status: 500 }
            );
        }

        const { results } = await db.prepare(`
            SELECT id, title, createdAt, updatedAt, messageCount 
            FROM Chat 
            ORDER BY updatedAt DESC 
            LIMIT 50
        `).all();

        return NextResponse.json(results);
    } catch (error) {
        console.error('获取历史对话失败:', error);
        return NextResponse.json(
            { error: '获取历史对话失败' },
            { status: 500 }
        );
    }
}

// 创建新对话
export async function POST(request: Request) {
    try {
        const { env } = await getCloudflareContext();
        const db = (env as unknown as { DB?: D1Database }).DB;

        if (!db) {
            return NextResponse.json(
                { error: 'D1 数据库未绑定' },
                { status: 500 }
            );
        }

        const { title } = await request.json();
        const chatId = crypto.randomUUID();

        await db.prepare(`
            INSERT INTO Chat (id, title, createdAt, updatedAt, messageCount)
            VALUES (?, ?, datetime('now'), datetime('now'), 0)
        `).bind(chatId, title || '新对话').run();

        return NextResponse.json({ id: chatId, title: title || '新对话' });
    } catch (error) {
        console.error('创建新对话失败:', error);
        return NextResponse.json(
            { error: '创建新对话失败' },
            { status: 500 }
        );
    }
} 