import { NextResponse } from 'next/server';
import path from 'path';
import dotenv from 'dotenv';
import { getCloudflareContext } from '@opennextjs/cloudflare';

// --- Configuration ---

// Immediately load environment variables.
dotenv.config({ path: path.resolve(__dirname, '../../../../.env.development.local') });

/**
 * Configuration object for the DashScope API.
 * It's good practice to centralize configuration and provide clear error messages
 * if essential variables are missing.
 */
const dashScopeConfig = {
    apiKey: process.env.DASHSCOPE_API_KEY,
    appId: process.env.DASHSCOPE_APP_ID,
    apiUrl: `https://dashscope.aliyuncs.com/api/v1/apps/${process.env.DASHSCOPE_APP_ID}/completion`,
    pipelineIds: ['he9rcpebc3', 'utmhvnxgey']
};

// --- Type Definitions ---

/**
 * Defines the structure for the DashScope API request body.
 * Using interfaces improves type safety and code readability.
 */
interface DashScopeRequest {
    input: {
        prompt: string;
        session_id?: string;
    };
    parameters: {
        incremental_output?: string;
        has_thoughts?: string;
        rag_options?: {
            pipeline_ids: string[];
        };
    };
    debug: Record<string, unknown>;
}

/**
 * Defines the expected structure of the incoming request body from the client.
 */
interface ClientRequestBody {
    message: string;
    dashscopeSessionId?: string;
    chatId?: string;
}

// --- API Interaction Logic ---

/**
 * Creates the request body for the DashScope API call.
 * This function encapsulates the logic for building the request payload.
 * @param message The user's prompt.
 * @param dashscopeSessionId Optional session ID for conversational context.
 * @returns A fully formed DashScopeRequest object.
 */
function createApiRequestBody(message: string, dashscopeSessionId?: string): DashScopeRequest {
    return {
        input: {
            prompt: message,
            ...(dashscopeSessionId && { session_id: dashscopeSessionId })
        },
        parameters: {
            incremental_output: 'true',
            has_thoughts: 'true',
            rag_options: {
                pipeline_ids: dashScopeConfig.pipelineIds
            }
        },
        debug: {}
    };
}

/**
 * Initiates a streaming API call to DashScope.
 * This function is responsible for the fetch request and returns the response body.
 * @param requestBody The data to be sent to the API.
 * @returns The readable stream from the API response.
 * @throws An error if the API key is missing or the request fails.
 */
async function fetchDashScopeStream(requestBody: DashScopeRequest): Promise<ReadableStream<Uint8Array>> {
    if (!dashScopeConfig.apiKey) {
        throw new Error("DASHSCOPE_API_KEY is not configured.");
    }

    const response = await fetch(dashScopeConfig.apiUrl, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${dashScopeConfig.apiKey}`,
            'Content-Type': 'application/json',
            'Accept': 'text/event-stream',
            'X-DashScope-SSE': 'enable'
        },
        body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }

    if (!response.body) {
        throw new Error('Response body is null');
    }

    return response.body;
}

// --- Database Operations ---

/**
 * Creates a new chat session in the database.
 * @returns The ID of the newly created chat session.
 */
async function createNewChatSession(): Promise<string> {
    try {
        const { env } = await getCloudflareContext();
        const db = (env as unknown as { DB?: D1Database }).DB;

        if (!db) {
            throw new Error('数据库未绑定');
        }

        const chatId = crypto.randomUUID();
        
        await db.prepare(`
            INSERT INTO Chat (id, chatId, title, createdAt, updatedAt, messageCount)
            VALUES (?, ?, ?, datetime('now'), datetime('now'), 0)
        `).bind(chatId, chatId, '新对话').run();

        return chatId;
    } catch (error) {
        console.error('创建新对话会话失败:', error);
        throw error;
    }
}

/**
 * Saves a message pair (user prompt and AI response) to the database.
 * @param chatId The chat session ID.
 * @param userPrompt The user's input message.
 * @param aiResponse The AI's response.
 * @param dashscopeSessionId The DashScope session ID.
 * @returns The messageId of the saved message.
 */
async function saveMessageToDatabase(
    chatId: string, 
    userPrompt: string, 
    aiResponse: string, 
    dashscopeSessionId: string
): Promise<string> {
    try {
        const { env } = await getCloudflareContext();
        const db = (env as unknown as { DB?: D1Database }).DB;

        if (!db) {
            console.error('数据库未绑定，无法保存消息');
            throw new Error('数据库未绑定');
        }

        // 获取当前聊天的消息数量，用作messageIndex
        const chatInfo = await db.prepare(`
            SELECT messageCount FROM Chat WHERE id = ?
        `).bind(chatId).first();

        const messageIndex = chatInfo ? chatInfo.messageCount : 0;
        const messageId = crypto.randomUUID();
        
        // 保存消息
        await db.prepare(`
            INSERT INTO ChatMessage (id, chatId, messageIndex, role, userPrompt, aiResponse, dashscopeSessionId, feedback, timestamp)
            VALUES (?, ?, ?, 'user', ?, ?, ?, NULL, datetime('now'))
        `).bind(messageId, chatId, messageIndex, userPrompt, aiResponse, dashscopeSessionId).run();

        // 更新对话的最后更新时间、消息数量和dashscopeSessionId
        await db.prepare(`
            UPDATE Chat 
            SET updatedAt = datetime('now'), 
                messageCount = messageCount + 1,
                dashscopeSessionId = ?
            WHERE id = ?
        `).bind(dashscopeSessionId, chatId).run();

        // 如果是第一条消息，生成对话标题
        if (messageIndex === 0) {
            const title = userPrompt.length > 20 ? userPrompt.substring(0, 20) + '...' : userPrompt;
            await db.prepare(`
                UPDATE Chat SET title = ? WHERE id = ?
            `).bind(title, chatId).run();
        }
        
        return messageId;
    } catch (error) {
        console.error('保存消息到数据库失败:', error);
        throw error;
    }
}

// --- Stream Processing Logic ---

/**
 * Processes the Server-Sent Events (SSE) stream from the DashScope API.
 * This function handles parsing the event stream and extracting relevant data.
 * @param responseBody The readable stream from the fetch response.
 * @param chatId The chat ID for database operations.
 * @param userPrompt The user's prompt for database storage.
 * @returns A new ReadableStream that outputs processed text and session ID.
 */
function processSseStream(
    responseBody: ReadableStream<Uint8Array>, 
    chatId: string, 
    userPrompt: string
): ReadableStream<Uint8Array> {
    const reader = responseBody.getReader();
    const decoder = new TextDecoder();
    const encoder = new TextEncoder();
    let buffer = '';
    let newDashscopeSessionId = '';
    let aiResponse = '';
    let savedMessageId = '';

    return new ReadableStream({
        async start(controller) {
            try {
                while (true) {
                    const { done, value } = await reader.read();
                    if (done) {
                        // 保存消息到数据库
                        savedMessageId = await saveMessageToDatabase(chatId, userPrompt, aiResponse, newDashscopeSessionId);
                        
                        // Send final metadata
                        controller.enqueue(encoder.encode(JSON.stringify({
                            type: 'metadata',
                            session_id: newDashscopeSessionId,
                            chat_id: chatId,
                            message_id: savedMessageId
                        })));
                        controller.close();
                        break;
                    }

                    buffer += decoder.decode(value, { stream: true });
                    
                    // 按SSE事件分割（两个换行符）
                    const events = buffer.split(/\n\n/);
                    buffer = events.pop() || ''; // 保留未完成部分

                    events.forEach(eventData => {
                        const lines = eventData.split('\n');
                        
                        // 解析事件内容
                        lines.forEach(line => {
                            if (line.startsWith('data:')) {
                                try {
                                    const jsonStr = line.slice(5).trim();
                                    if (jsonStr && jsonStr.startsWith('{') && jsonStr.endsWith('}')) {
                                        const jsonData = JSON.parse(jsonStr);
                                        if (jsonData.output?.text) {
                                            aiResponse += jsonData.output.text;
                                        }
                                        if (jsonData.output?.session_id) {
                                            newDashscopeSessionId = jsonData.output.session_id;
                                        }
                                        // 直接发送整个jsonData对象
                                        controller.enqueue(encoder.encode(jsonStr));
                                    }
                                } catch (e) {
                                    console.error('JSON parsing error:', e);
                                }
                            }
                        });
                    });
                }
            } catch (error) {
                console.error('Stream processing error:', error);
                controller.error(error);
            }
        }
    });
}

// --- Main Request Handler ---

/**
 * The main Next.js API route handler for the POST request.
 * It orchestrates the process: configuration check, request handling, API call, and streaming response.
 * @param request The incoming Next.js request object.
 * @returns A streaming response or a JSON error response.
 */
export async function POST(request: Request) {
    // 1. Configuration Validation
    if (!dashScopeConfig.apiKey || !dashScopeConfig.appId) {
        return NextResponse.json(
            { error: 'Server not configured: DASHSCOPE_API_KEY or DASHSCOPE_APP_ID is missing.' },
            { status: 500 }
        );
    }

    try {
        // 2. Parse Incoming Request
        const { message, dashscopeSessionId, chatId } = await request.json() as ClientRequestBody;
        const userPrompt = message;

        // 3. Ensure Chat Session Exists
        let actualChatId: string;
        if (chatId) {
            actualChatId = chatId;
        } else {
            // 如果没有提供 chatId，创建新的对话
            actualChatId = await createNewChatSession();
        }

        // 4. Prepare and Log API Request
        const apiRequestBody = createApiRequestBody(userPrompt, dashscopeSessionId);
        console.log('Sending request to DashScope:', {
            url: dashScopeConfig.apiUrl,
            appId: dashScopeConfig.appId,
            userPrompt,
            dashscopeSessionId,
            chatId: actualChatId
        });

        // 5. Fetch and Process Stream
        const apiStream = await fetchDashScopeStream(apiRequestBody);
        const processedStream = processSseStream(apiStream, actualChatId, userPrompt);

        // 6. Return Processed Stream to Client
        return new Response(processedStream, {
            headers: {
                'Content-Type': 'text/event-stream',
                'Cache-Control': 'no-cache',
                'Connection': 'keep-alive'
            }
        });

    } catch (error) {
        console.error('API call failed:', error instanceof Error ? error.message : error);
        return NextResponse.json(
            { error: 'An error occurred while processing the request.' },
            { status: 500 }
        );
    }
}