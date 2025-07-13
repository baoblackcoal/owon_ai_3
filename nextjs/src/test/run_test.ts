#!/usr/bin/env node
import { spawn } from 'child_process';
import path from 'path';

interface TestConfig {
    name: string;
    description: string;
    command: string;
    args: string[];
}

const tests: TestConfig[] = [
    {
        name: 'js',
        description: '运行 JavaScript 版本的 API 测试',
        command: 'node',
        args: [path.join(__dirname, 'test_aliyun_api.js')]
    },
    {
        name: 'ts',
        description: '运行 TypeScript 版本的 API 测试',
        command: 'npx',
        args: ['ts-node', '--project', path.join(__dirname, 'tsconfig.json'), path.join(__dirname, 'test_aliyun_api.ts')]
    },
    {
        name: 'chat',
        description: '运行多轮对话测试',
        command: 'npx',
        args: ['ts-node', '--project', path.join(__dirname, 'tsconfig.json'), path.join(__dirname, 'test_aliyun_api_multi_chat.ts')]
    }
];

function showHelp(): void {
    console.log('\n阿里云 API 测试脚本');
    console.log('\n用法：');
    console.log('  npx ts-node run_test.ts [选项]');
    console.log('\n选项：');
    console.log('  --help, -h     显示帮助信息');
    console.log('  --test, -t     指定要运行的测试 (js, ts 或 chat)');
    console.log('  --prompt, -p   指定要测试的问题 (默认: "ADS800A的带宽是多少？")');
    console.log('\n示例：');
    console.log('  npx ts-node run_test.ts -t js');
    console.log('  npx ts-node run_test.ts -t ts');
    console.log('  npx ts-node run_test.ts -t chat');
    console.log('  npx ts-node run_test.ts -t js -p "示波器的采样率是多少？"');
    console.log('\n可用的测试：');
    tests.forEach(test => {
        console.log(`  ${test.name.padEnd(8)} - ${test.description}`);
    });
    console.log('');
}

function parseArgs(): { testType?: string; prompt?: string } {
    const args = process.argv.slice(2);
    const result: { testType?: string; prompt?: string } = {};

    for (let i = 0; i < args.length; i++) {
        const arg = args[i];
        switch (arg) {
            case '--help':
            case '-h':
                showHelp();
                process.exit(0);
                break;
            case '--test':
            case '-t':
                result.testType = args[++i];
                break;
            case '--prompt':
            case '-p':
                result.prompt = args[++i];
                break;
        }
    }

    return result;
}

async function modifyTestFile(filePath: string, prompt: string): Promise<void> {
    const { readFile, writeFile } = await import('fs/promises');
    let content = await readFile(filePath, 'utf8');
    
    // 替换提示词
    content = content.replace(
        /prompt:\s*"[^"]*"/,
        `prompt: "${prompt}"`
    );
    
    await writeFile(filePath, content);
}

async function runTest(testType: string, prompt?: string): Promise<void> {
    const test = tests.find(t => t.name === testType);
    if (!test) {
        console.error(`错误：未知的测试类型 "${testType}"`);
        showHelp();
        process.exit(1);
    }

    if (prompt) {
        // 修改对应文件中的 prompt
        const filePath = testType === 'js' ? 
            path.join(__dirname, 'test_aliyun_api.js') :
            path.join(__dirname, 'test_aliyun_api.ts');
        await modifyTestFile(filePath, prompt);
    }

    console.log(`\n运行 ${test.description}...`);
    
    const child = spawn(test.command, test.args, {
        stdio: 'inherit',
        shell: true,
        cwd: __dirname
    });

    return new Promise((resolve, reject) => {
        child.on('close', (code) => {
            if (code === 0) {
                console.log(`\n${test.description}完成`);
                resolve();
            } else {
                console.error(`\n${test.description}失败，退出码: ${code}`);
                reject(new Error(`测试失败，退出码: ${code}`));
            }
        });

        child.on('error', (err) => {
            console.error(`\n运行测试时发生错误: ${err.message}`);
            reject(err);
        });
    });
}

async function main(): Promise<void> {
    const { testType, prompt } = parseArgs();

    if (!testType) {
        showHelp();
        process.exit(1);
    }

    try {
        await runTest(testType, prompt);
    } catch (error) {
        if (error instanceof Error) {
            console.error(`运行测试时发生错误: ${error.message}`);
        }
        process.exit(1);
    }
}

main(); 