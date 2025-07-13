import { NextResponse } from 'next/server';
import axios from 'axios';
import path from 'path';

import dotenv from 'dotenv';

dotenv.config({ path: path.resolve(__dirname, '../../../../.env.development.local') });


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
        const { message, sessionId } = await request.json();

        const url = `https://dashscope.aliyuncs.com/api/v1/apps/${config.appId}/completion`;
        const data = {
            input: {
                prompt: message,
                ...(sessionId && { session_id: sessionId })
            },
            parameters: {
                'incremental_output': 'true',
                'has_thoughts': 'true',
                rag_options: {
                    pipeline_ids: pipeline_ids
                }
            },
            debug: {}
        };

        const response = await axios.post(url, data, {
            headers: {
                'Authorization': `Bearer ${config.apiKey}`,
                'Content-Type': 'application/json'
            }
        });

        return NextResponse.json({
            message: response.data.output?.text || '抱歉，我没有得到有效的回答',
            sessionId: response.data.output?.session_id
        });

    } catch (error) {
        console.error('API调用失败:', error);
        return NextResponse.json(
            { error: '处理请求时发生错误' },
            { status: 500 }
        );
    }
} 