# 测试文档

本目录包含阿里云灵积模型服务的测试脚本，用于测试与 OWON 示波器相关的问答功能。

## 文件结构

```
test/
├── test_aliyun_api.js    # JavaScript 版本的测试脚本
├── test_aliyun_api.ts    # TypeScript 版本的测试脚本
├── run_test.ts           # 测试运行器
├── tsconfig.json         # TypeScript 配置文件
└── README_TEST.md        # 本文档
```

## 环境要求

- Node.js (推荐使用最新的 LTS 版本)
- pnpm 包管理器
- TypeScript (用于 .ts 文件)
- 已配置的环境变量（在 `src/.env.development.local` 中）：
  - DASHSCOPE_API_KEY
  - DASHSCOPE_APP_ID

## 依赖安装

在项目根目录下运行：

```bash
pnpm install
```

这将安装所需的依赖：
- axios：用于 API 请求
- dotenv：用于环境变量管理
- ts-node：用于运行 TypeScript 文件
- typescript：TypeScript 支持

## 使用方法

### 基本用法

使用测试运行器 `run_test.ts` 来执行测试：

```bash
# 显示帮助信息
npx ts-node run_test.ts --help

# 运行 JavaScript 版本的测试
npx ts-node run_test.ts -t js

# 运行 TypeScript 版本的测试
npx ts-node run_test.ts -t ts
```

### 命令行选项

- `-h, --help`：显示帮助信息
- `-t, --test <type>`：指定要运行的测试类型（js 或 ts）
- `-p, --prompt <question>`：指定要测试的问题

### 示例

1. 运行 JavaScript 测试并询问特定问题：
```bash
npx ts-node run_test.ts -t js -p "ADS800A的带宽是多少？"
```

2. 运行 TypeScript 测试并询问特定问题：
```bash
npx ts-node run_test.ts -t ts -p "示波器的采样率是多少？"
```

## 测试文件说明

### test_aliyun_api.js

JavaScript 版本的测试实现，特点：
- 使用 CommonJS 模块系统
- 基本的错误处理
- 流式响应处理

### test_aliyun_api.ts

TypeScript 版本的测试实现，特点：
- 使用 ES 模块系统
- 完整的类型定义
- 增强的错误处理
- 更好的代码组织

主要类型定义：
```typescript
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
```

### run_test.ts

测试运行器，功能：
- 统一的命令行界面
- 支持动态修改测试问题
- 详细的错误报告
- 支持两种测试版本

## 注意事项

1. 环境变量
   - 确保 `src/.env.development.local` 文件存在
   - 确保包含必要的环境变量
   - 不要在代码中硬编码 API 密钥

2. 知识库 ID
   - 测试中使用了两个知识库：
     - pipeline_ids1: 'he9rcpebc3'
     - pipeline_ids2: 'utmhvnxgey'

3. 错误处理
   - 脚本会检查环境变量是否存在
   - 会显示详细的错误信息
   - 包含请求失败时的状态码和响应数据

## 常见问题

1. 环境变量未找到
   ```
   请确保已在 src/.env.development.local 中设置环境变量 DASHSCOPE_API_KEY 和 DASHSCOPE_APP_ID
   ```
   解决：检查 `.env.development.local` 文件中的环境变量配置

2. TypeScript 编译错误
   ```
   error TS2307: Cannot find module '...' or its corresponding type declarations
   ```
   解决：运行 `pnpm install` 安装所需依赖

## 问答集功能测试

### 访问地址
- 开发环境：http://localhost:3000/test/qa_collection

### 功能特性

#### 核心功能
- **搜索功能**：支持在问题标题、内容和标签中进行实时搜索
- **分类过滤**：按产品大类（示波器、信号发生器、万用表、电源、频谱分析仪）进行过滤
- **机型过滤**：支持级联选择，先选分类再选具体机型
- **标签多选**：支持同时选择多个标签进行AND逻辑过滤
- **排序功能**：
  - 最新：按创建时间降序排列
  - 最佳：按点赞数降序排列  
  - 排行：按观看量降序排列，支持时间范围选择
- **时间范围**：在排行模式下可选择本周/本月/本季度/本年/总排行
- **响应式设计**：适配PC端和移动端显示

#### 数据展示
- **问题卡片**：展示标题、内容预览、分类、机型、标签、统计数据
- **统计信息**：观看量、点赞数、回复数
- **时间信息**：创建时间和最后更新时间
- **空状态处理**：无搜索结果时的友好提示和重置功能

#### 技术实现
- 使用 Next.js 13 App Router
- 基于 shadcn/ui 组件库
- TypeScript 类型安全
- 响应式 Tailwind CSS 样式
- Mock 数据模拟真实场景

### 测试数据
包含12个示例问题，涵盖：
- 5个分类：示波器、信号发生器、万用表、电源、频谱分析仪
- 10个产品型号：ADS800A、ADS900A、XDS3000等
- 15个标签：测量、触发、FFT、校准、PC软件等

### 测试建议
1. 测试搜索功能：输入"ADS800A"、"触发"、"校准"等关键词
2. 测试过滤组合：选择示波器分类 + ADS800A机型 + 测量标签
3. 测试排序切换：在最新/最佳/排行之间切换
4. 测试响应式：调整浏览器窗口大小查看移动端效果
5. 测试空状态：搜索不存在的关键词如"xyz"

## 更新日志

### 2024-01-XX（最新）
- 新增问答集功能页面
- 实现搜索、过滤、排序完整功能
- 支持响应式布局
- 添加空状态处理和用户体验优化

### 2024-03-21
- 添加 TypeScript 版本的测试实现
- 添加统一的测试运行器
- 支持命令行参数
- 添加本文档 