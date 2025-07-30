import axios from 'axios';
import path from 'path';
import { Transform } from 'stream';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

// 获取当前文件的目录路径（ES 模块兼容）
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 从 src/.env.development.local 获取配置
dotenv.config({ path: path.resolve(__dirname, '../../.env.development.local') });

const apiKey = process.env.DASHSCOPE_API_KEY;
const appId = process.env.DASHSCOPE_APP_ID;

if (!apiKey || !appId) {
    console.error('请确保已在 ../../.env.development.local 中设置环境变量 DASHSCOPE_API_KEY 和 DASHSCOPE_APP_ID');
    process.exit(1);
}

const pipeline_ids1 = 'he9rcpebc3'
const pipeline_ids2 = 'utmhvnxgey'

async function callDashScope() {
    const url = `https://dashscope.aliyuncs.com/api/v1/apps/${appId}/completion`;

    const data = {
        input: {
            prompt: "示波器带宽是多少？"
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

        const response = await axios.post(url, data, {
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
                'X-DashScope-SSE': 'enable'
            },
            responseType: 'stream'
        });

        if (response.status === 200) {
            // 处理流式响应 SSE协议解析转换流
            const sseTransformer = new Transform({
                transform(chunk, encoding, callback) {
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
                                    const jsonData = JSON.parse(line.slice(5).trim());
                                    if (jsonData.output?.text) {
                                        textContent = jsonData.output.text;
                                    }
                                } catch(e) {
                                    console.error('JSON解析错误:', e.message);
                                }
                            }
                        });

                        if (textContent) {
                            // 添加换行符并推送
                            this.push(textContent + '\n');
                        }
                    });
                    
                    callback();
                },
                flush(callback) {
                    if (this.buffer) {
                        this.push(this.buffer + '\n');
                    }
                    callback();
                }
            });
            sseTransformer.buffer = '';

            // 管道处理
            response.data
                .pipe(sseTransformer)
                .on('data', (textWithNewline) => {
                    process.stdout.write(textWithNewline); // 自动换行输出
                })
                .on('end', () => console.log("\n--- 回答完成 ---"))
                .on('error', err => console.error("管道错误:", err));

        } else {
            console.log("请求失败，状态码:", response.status);
            if (response.data.request_id) {
                console.log(`request_id=${response.data.request_id}`);
            }
            if (response.data.message) {
                console.log(`message=${response.data.message}`);
            }
        }
    } catch (error) {
        console.error(`API调用失败: ${error.message}`);
        if (error.response) {
            console.error(`状态码: ${error.response.status}`);
            console.error(`响应数据: ${JSON.stringify(error.response.data, null, 2)}`);
        }
    }
}

callDashScope();