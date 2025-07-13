import axios, { AxiosResponse } from 'axios';
import path from 'path';
import { Transform, TransformCallback } from 'stream';
import dotenv from 'dotenv';

// 从 src/.env.development.local 获取配置
dotenv.config({ path: path.resolve(__dirname, '../.env.development.local') });

interface DashScopeConfig {
    apiKey: string;
    appId: string;
}

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

interface DashScopeResponse {
    output?: {
        text?: string;
        session_id?: string;
    };
    request_id?: string;
    message?: string;
}

interface ChatMessage {
    prompt: string;
    delay?: number; // 发送下一条消息前的延迟时间（毫秒）
}

class SSETransformer extends Transform {
    private buffer: string = '';
    private sessionId: string = '';

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
                        // 保存session_id用于多轮对话
                        if (jsonData.output?.session_id) {
                            this.sessionId = jsonData.output.session_id;
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
        if (this.sessionId) {
            this.push(`\nsession_id: ${this.sessionId}\n`);
        }
        callback();
    }

    getSessionId(): string {
        return this.sessionId;
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

async function callDashScope(prompt: string, sessionId?: string): Promise<string> {
    const url = `https://dashscope.aliyuncs.com/api/v1/apps/${config.appId}/completion`;

    const data: DashScopeRequest = {
        input: {
            prompt: prompt
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

    // 如果有session_id，添加到请求中
    if (sessionId) {
        data.input.session_id = sessionId;
    }

    try {
        console.log(`\n发送问题: ${prompt}`);
        console.log("正在发送请求到 DashScope API...");

        const response: AxiosResponse = await axios.post(url, data, {
            headers: {
                'Authorization': `Bearer ${config.apiKey}`,
                'Content-Type': 'application/json',
                'X-DashScope-SSE': 'enable'
            },
            responseType: 'stream'
        });

        return new Promise((resolve, reject) => {
            if (response.status === 200) {
                const sseTransformer = new SSETransformer();
                let newSessionId = '';

                // 管道处理
                response.data
                    .pipe(sseTransformer)
                    .on('data', (textWithNewline: Buffer) => {
                        process.stdout.write(textWithNewline);
                    })
                    .on('end', () => {
                        newSessionId = sseTransformer.getSessionId();
                        console.log("\n--- 回答完成 ---");
                        resolve(newSessionId);
                    })
                    .on('error', (err: Error) => {
                        console.error("管道错误:", err);
                        reject(err);
                    });

            } else {
                console.log("请求失败，状态码:", response.status);
                const responseData = response.data as DashScopeResponse;
                if (responseData.request_id) {
                    console.log(`request_id=${responseData.request_id}`);
                }
                if (responseData.message) {
                    console.log(`message=${responseData.message}`);
                }
                reject(new Error(`请求失败，状态码: ${response.status}`));
            }
        });
    } catch (error) {
        if (error instanceof Error) {
            console.error(`API调用失败: ${error.message}`);
            if ('response' in error && error.response) {
                const axiosError = error as any;
                console.error(`状态码: ${axiosError.response.status}`);
                console.error(`响应数据: ${JSON.stringify(axiosError.response.data, null, 2)}`);
            }
        }
        throw error;
    }
}

// 预定义的对话场景
const chatScenarios = {
    // 基础对话场景
    basic: [
        { prompt: "你是谁？" },
        { prompt: "你有什么技能？", delay: 1000 }
    ],
    // 示波器问答场景
    oscilloscope: [
        { prompt: "ADS800A的带宽是多少？" },
        { prompt: "它的采样率是多少？", delay: 1000 },
        { prompt: "它支持哪些触发模式？", delay: 1000 }
    ],
    // 自定义场景 - 从命令行参数获取
    custom: [] as ChatMessage[]
};

function parseArgs(): { scenario: string; messages: string[] } {
    const args = process.argv.slice(2);
    let scenario = 'basic';
    const messages: string[] = [];

    for (let i = 0; i < args.length; i++) {
        switch (args[i]) {
            case '--scenario':
            case '-s':
                scenario = args[++i] || 'basic';
                break;
            case '--message':
            case '-m':
                messages.push(args[++i]);
                break;
            case '--help':
            case '-h':
                showHelp();
                process.exit(0);
        }
    }

    return { scenario, messages };
}

function showHelp(): void {
    console.log('\n多轮对话测试工具');
    console.log('\n用法：');
    console.log('  npx ts-node test_aliyun_api_multi_chat.ts [选项]');
    console.log('\n选项：');
    console.log('  --help, -h              显示帮助信息');
    console.log('  --scenario, -s <name>   选择预定义场景 (basic, oscilloscope)');
    console.log('  --message, -m <text>    添加自定义对话消息（可多次使用）');
    console.log('\n示例：');
    console.log('  运行基础场景：');
    console.log('    npx ts-node test_aliyun_api_multi_chat.ts -s basic');
    console.log('  运行示波器场景：');
    console.log('    npx ts-node test_aliyun_api_multi_chat.ts -s oscilloscope');
    console.log('  运行自定义对话：');
    console.log('    npx ts-node test_aliyun_api_multi_chat.ts -m "ADS800A外观不错，请记住" -m "ADS800A有解码功能，请记住" -m "我刚才说了什么？"');
    console.log('');
}

async function runMultiRoundChat(messages: ChatMessage[]): Promise<void> {
    if (messages.length === 0) {
        console.error("错误：没有指定任何对话消息");
        return;
    }

    try {
        let sessionId = '';
        console.log(`\n=== 开始${messages.length}轮对话 ===`);

        for (let i = 0; i < messages.length; i++) {
            const message = messages[i];
            
            // 如果设置了延迟且不是第一条消息，则等待
            if (i > 0 && message.delay) {
                await new Promise(resolve => setTimeout(resolve, message.delay));
            }

            console.log(`\n=== 第${i + 1}轮对话 ===`);
            sessionId = await callDashScope(message.prompt, sessionId);
        }

        console.log("\n=== 对话完成 ===");
    } catch (error) {
        if (error instanceof Error) {
            console.error("多轮对话测试失败:", error.message);
        }
    }
}

// 主函数
async function main(): Promise<void> {
    const { scenario, messages } = parseArgs();
    
    // 如果提供了自定义消息，使用自定义消息
    if (messages.length > 0) {
        chatScenarios.custom = messages.map(msg => ({ prompt: msg, delay: 1000 }));
        await runMultiRoundChat(chatScenarios.custom);
    }
    // 否则使用预定义场景
    else if (scenario in chatScenarios) {
        await runMultiRoundChat(chatScenarios[scenario as keyof typeof chatScenarios]);
    }
    else {
        console.error(`错误：未知的场景 "${scenario}"`);
        showHelp();
        process.exit(1);
    }
}

// 运行主函数
main().catch(console.error); 