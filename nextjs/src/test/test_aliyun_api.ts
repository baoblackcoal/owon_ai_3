import axios, { AxiosResponse, AxiosError } from 'axios';
import path from 'path';
import { Transform, TransformCallback } from 'stream';
import dotenv from 'dotenv';

// 从 src/.env.development.local 获取配置
dotenv.config({ path: path.resolve(__dirname, '../../.env.development.local') });

interface DashScopeConfig {
    apiKey: string;
    appId: string;
}

interface DashScopeRequest {
    input: {
        prompt: string;
    };
    parameters: {
        incremental_output: string;
        has_thoughts: string;
        rag_options: {
            pipeline_ids: string[];
        };
    };
    debug: Record<string, unknown>;
}

interface DashScopeResponse {
    output?: {
        text?: string;
    };
    request_id?: string;
    message?: string;
}

class SSETransformer extends Transform {
    private buffer: string = '';

    _transform(chunk: Buffer, encoding: string, callback: TransformCallback): void {
        this.buffer += chunk.toString();
        
        // 按SSE事件分割（两个换行符）
        const events = this.buffer.split(/\n\n/);
        this.buffer = events.pop() || ''; // 保留未完成部分
        
        events.forEach(eventData => {
            const lines = eventData.split('\n');
            let textContent = '';
            
            // 解析事件内容
            lines.forEach(line => {
                if (line.startsWith('data:')) {
                    try {
                        const jsonData = JSON.parse(line.slice(5).trim()) as DashScopeResponse;
                        if (jsonData.output?.text) {
                            textContent = jsonData.output.text;
                        }
                    } catch(e) {
                        if (e instanceof Error) {
                            console.error('JSON解析错误:', e.message);
                        }
                    }
                }
            });

            if (textContent) {
                // 添加换行符并推送
                this.push(textContent + '\n');
            }
        });
        
        callback();
    }

    _flush(callback: TransformCallback): void {
        if (this.buffer) {
            this.push(this.buffer + '\n');
        }
        callback();
    }
}

const config: DashScopeConfig = {
    apiKey: process.env.DASHSCOPE_API_KEY || '',
    appId: process.env.DASHSCOPE_APP_ID || ''
};

if (!config.apiKey || !config.appId) {
    console.error('请确保已在 src/.env.development.local 中设置环境变量 DASHSCOPE_API_KEY 和 DASHSCOPE_APP_ID');
    process.exit(1);
}

const pipeline_ids1 = 'he9rcpebc3';
const pipeline_ids2 = 'utmhvnxgey';

async function callDashScope(): Promise<void> {
    const url = `https://dashscope.aliyuncs.com/api/v1/apps/${config.appId}/completion`;

    const data: DashScopeRequest = {
        input: {
            prompt: "示波器的采样率是多少？"
        },
        parameters: {
            'incremental_output': 'true',
            'has_thoughts': 'true',
            rag_options: {
                pipeline_ids: [pipeline_ids1, pipeline_ids2]
            }
        },
        debug: {}
    };

    try {
        console.log("正在发送请求到 DashScope API...");

        const response: AxiosResponse = await axios.post(url, data, {
            headers: {
                'Authorization': `Bearer ${config.apiKey}`,
                'Content-Type': 'application/json',
                'X-DashScope-SSE': 'enable'
            },
            responseType: 'stream'
        });

        if (response.status === 200) {
            const sseTransformer = new SSETransformer();

            // 管道处理
            response.data
                .pipe(sseTransformer)
                .on('data', (textWithNewline: Buffer) => {
                    process.stdout.write(textWithNewline); // 自动换行输出
                })
                .on('end', () => console.log("\n--- 回答完成 ---"))
                .on('error', (err: Error) => console.error("管道错误:", err));

        } else {
            console.log("请求失败，状态码:", response.status);
            const responseData = response.data as DashScopeResponse;
            if (responseData.request_id) {
                console.log(`request_id=${responseData.request_id}`);
            }
            if (responseData.message) {
                console.log(`message=${responseData.message}`);
            }
        }
    } catch (error) {
        if (error instanceof Error) {
            console.error(`API调用失败: ${error.message}`);
            if ('response' in error && error.response) {
                const axiosError = error as AxiosError<DashScopeResponse>;
                console.error(`状态码: ${axiosError.response?.status}`);
                console.error(`响应数据: ${JSON.stringify(axiosError.response?.data, null, 2)}`);
            }
        }
    }
}

callDashScope(); 