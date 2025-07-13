import { NextResponse } from 'next/server';
import axios from 'axios';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config({ path: path.resolve(__dirname, '../../../../.env.development.local') });

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

interface RequestBody {
    message: string;
    sessionId?: string;
}

const config = {
    apiKey: process.env.DASHSCOPE_API_KEY || '',
    appId: process.env.DASHSCOPE_APP_ID || ''
};

const pipeline_ids = ['he9rcpebc3', 'utmhvnxgey'];

export async function POST(request: Request) {
    if (!config.apiKey || !config.appId) {
        return NextResponse.json(
            { error: '未配置 DASHSCOPE_API_KEY 或 DASHSCOPE_APP_ID' },
            { status: 500 }
        );
    }

    try {
        const { message, sessionId } = await request.json() as RequestBody;

        const url = `https://dashscope.aliyuncs.com/api/v1/apps/${config.appId}/completion`;
        const data: DashScopeRequest = {
            input: {
                prompt: message,
                ...(sessionId && { session_id: sessionId })
            },
            parameters: {
                incremental_output: 'true',
                has_thoughts: 'true',
                rag_options: {
                    pipeline_ids: pipeline_ids
                }
            },
            debug: {}
        };

        console.log('发送请求到 DashScope:', {
            url,
            appId: config.appId,
            message,
            sessionId
        });

        const response = await axios({
            method: 'post',
            url,
            data,
            headers: {
                'Authorization': `Bearer ${config.apiKey}`,
                'Content-Type': 'application/json',
                'Accept': 'text/event-stream',
                'X-DashScope-SSE': 'enable'
            },
            responseType: 'stream'
        });

        // 创建一个可读流来处理响应数据
        const stream = new ReadableStream({
            async start(controller) {
                let newSessionId = '';
                
                // 设置响应数据的处理函数
                response.data.on('data', (chunk: Buffer) => {
                    const text = chunk.toString();
                    const lines = text.split('\n');
                    
                    for (const line of lines) {
                        if (line.startsWith('data:')) {
                            try {
                                const jsonData = JSON.parse(line.slice(5).trim());
                                if (jsonData.output?.text) {
                                    // 将文本内容编码为 Uint8Array 并发送
                                    const encoder = new TextEncoder();
                                    controller.enqueue(encoder.encode(jsonData.output.text));
                                }
                                // 保存新的 session_id
                                if (jsonData.output?.session_id) {
                                    newSessionId = jsonData.output.session_id;
                                }
                            } catch (e) {
                                console.error('JSON解析错误:', e);
                            }
                        }
                    }
                });

                // 处理结束和错误情况
                response.data.on('end', () => {
                    console.log('流处理完成');
                    // 在流结束时发送 session_id
                    if (newSessionId) {
                        const encoder = new TextEncoder();
                        controller.enqueue(encoder.encode(`\n<session_id>${newSessionId}</session_id>`));
                    }
                    controller.close();
                });
                response.data.on('error', (err: Error) => {
                    console.error('流处理错误:', err);
                    controller.error(err);
                });
            }
        });

        return new Response(stream, {
            headers: {
                'Content-Type': 'text/event-stream',
                'Cache-Control': 'no-cache',
                'Connection': 'keep-alive'
            }
        });

    } catch (error) {
        console.error('API调用失败:', error);
        if (axios.isAxiosError(error)) {
            console.error('请求详情:', {
                status: error.response?.status,
                statusText: error.response?.statusText,
                data: error.response?.data
            });
        }
        return NextResponse.json(
            { error: '处理请求时发生错误' },
            { status: 500 }
        );
    }
} 