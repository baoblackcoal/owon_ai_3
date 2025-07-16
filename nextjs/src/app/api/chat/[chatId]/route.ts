import { NextRequest, NextResponse } from 'next/server';
import { getCloudflareContext } from '@opennextjs/cloudflare';
import { getCurrentUser } from '@/lib/user-utils';

// 获取特定对话的消息历史
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ chatId: string }> }
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

        // 获取当前用户
        const currentUser = await getCurrentUser(request);
        if (!currentUser) {
            return NextResponse.json(
                { error: '用户未登录' },
                { status: 401 }
            );
        }

        const { chatId } = await params;

        // 获取对话信息（验证用户权限）
        const chatResult = await db.prepare(`
            SELECT id, chatId, title, dashscopeSessionId, createdAt, updatedAt
            FROM Chat 
            WHERE id = ? AND user_id = ?
        `).bind(chatId, currentUser.id).first();

        if (!chatResult) {
            return NextResponse.json(
                { error: '对话不存在或无权限访问' },
                { status: 404 }
            );
        }

        // 获取消息历史，按messageIndex排序
        const { results: messages } = await db.prepare(`
            SELECT id, messageIndex, role, userPrompt, aiResponse, dashscopeSessionId, feedback, timestamp
            FROM ChatMessage 
            WHERE chatId = ? AND user_id = ?
            ORDER BY messageIndex ASC
        `).bind(chatId, currentUser.id).all();

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
    request: NextRequest,
    { params }: { params: Promise<{ chatId: string }> }
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

        // 获取当前用户
        const currentUser = await getCurrentUser(request);
        if (!currentUser) {
            return NextResponse.json(
                { error: '用户未登录' },
                { status: 401 }
            );
        }

        const { chatId } = await params;

        // 验证用户权限
        const chatExists = await db.prepare(`
            SELECT id FROM Chat WHERE id = ? AND user_id = ?
        `).bind(chatId, currentUser.id).first();

        if (!chatExists) {
            return NextResponse.json(
                { error: '对话不存在或无权限删除' },
                { status: 404 }
            );
        }

        // 删除消息
        await db.prepare(`DELETE FROM ChatMessage WHERE chatId = ? AND user_id = ?`).bind(chatId, currentUser.id).run();
        
        // 删除对话
        await db.prepare(`DELETE FROM Chat WHERE id = ? AND user_id = ?`).bind(chatId, currentUser.id).run();

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('删除对话失败:', error);
        return NextResponse.json(
            { error: '删除对话失败' },
            { status: 500 }
        );
    }
} 