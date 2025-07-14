import { NextResponse } from 'next/server';
import { getCloudflareContext } from '@opennextjs/cloudflare';

// 获取特定对话的消息历史
export async function GET(
    request: Request,
    { params }: { params: { chatId: string } }
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

        const { chatId } = params;

        // 获取对话信息
        const chatResult = await db.prepare(`
            SELECT id, title, chatId, createdAt, updatedAt
            FROM Chat 
            WHERE id = ?
        `).bind(chatId).first();

        if (!chatResult) {
            return NextResponse.json(
                { error: '对话不存在' },
                { status: 404 }
            );
        }

        // 获取消息历史
        const { results: messages } = await db.prepare(`
            SELECT id, role, userPrompt, aiResponse, dashscopeSessionId, timestamp
            FROM ChatMessage 
            WHERE chatId = ? 
            ORDER BY timestamp ASC
        `).bind(chatId).all();

        return NextResponse.json({
            chat: chatResult,
            messages: messages
        });
    } catch (error) {
        console.error('获取对话消息失败:', error);
        return NextResponse.json(
            { error: '获取对话消息失败' },
            { status: 500 }
        );
    }
}

// 删除特定对话
export async function DELETE(
    request: Request,
    { params }: { params: { chatId: string } }
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

        const { chatId } = params;

        // 删除消息
        await db.prepare(`DELETE FROM ChatMessage WHERE chatId = ?`).bind(chatId).run();
        
        // 删除对话
        await db.prepare(`DELETE FROM Chat WHERE id = ?`).bind(chatId).run();

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('删除对话失败:', error);
        return NextResponse.json(
            { error: '删除对话失败' },
            { status: 500 }
        );
    }
} 