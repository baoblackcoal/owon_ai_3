# Gemini 项目背景：owon_ai_cloudflare

## 项目概述

这是 Owon AI 的官方网站项目。它是一个基于 **Next.js 15 (App Router)** 构建的全栈 Web 应用程序，设计用于部署在 **Cloudflare** 无服务器平台上。该项目使用 **OpenNext** 来适配 Next.js 的输出以在 Cloudflare Workers 上运行，并利用 **Cloudflare D1** 作为其数据库。

## 技术栈

- **框架**: Next.js 15.3.3 (App Router)
- **语言**: TypeScript
- **包管理器**: pnpm (在 `.npmrc` 中配置了 `node-linker=hoisted`)
- **部署**: 通过 OpenNext 和 Wrangler 部署到 Cloudflare Workers & Pages
- **数据库**: Cloudflare D1
- **代码检查**: ESLint (集成了 Next.js 核心 Web 指标配置)
- **样式**: Tailwind CSS

## 项目结构

- `nextjs/`: Next.js 应用的主目录。
  - `src/app/`: 包含使用 App Router 的应用程序页面和 API 路由。
  - `src/app/api/`: 后端 API 端点的存放位置。
  - `src/sql/`: 包含 D1 数据库迁移文件。
  - `public/`: 可公开访问的静态资源。
  - `wrangler.jsonc`: Cloudflare Wrangler 的配置文件，定义了 Worker 名称、D1 数据库绑定和其他部署设置。
  - `open-next.config.ts`: OpenNext 适配器的配置文件。
  - `package.json`: 定义项目脚本、依赖和元数据。
- `.cursor/rules/`: 包含开发工作流、项目结构和编码标准的特定指南。
- `doc/dev/`: 包含补充的开发文档。

## 关键命令

所有命令都应在 `nextjs/` 目录下运行。

- **安装依赖**: `pnpm install`
- **运行标准开发服务器**: `pnpm dev`
  - 此命令使用由 OpenNext 提供的本地 Cloudflare 上下文。访问地址：`http://localhost:3000`。
- **使用完整的 Wrangler 模拟运行开发服务器**: `pnpm dev-d1`
  - 此命令使用 `wrangler dev` 来更精确地本地模拟 Cloudflare 环境，包括 D1。
- **运行本地生产预览**: `pnpm preview`
  - 此命令会构建应用并使用 Wrangler 在本地模拟 Cloudflare 生产环境。
- **生产环境构建**: `pnpm build`
- **代码检查**: `pnpm lint`
- **类型检查**: `pnpm run check` (此命令会先运行 `next build` 然后运行 `tsc`)
- **部署到 Cloudflare**: `pnpm run deploy`
  - 此脚本会依次执行 `opennextjs-cloudflare build` 和 `opennextjs-cloudflare deploy`。

## 开发工作流

1.  **分支策略**: 从 `main` 分支创建特性分支 (例如, `feature/your-feature`)。
2.  **本地开发**:
    - 对于大多数不依赖 D1 的 UI 和逻辑开发，使用 `pnpm dev`。
    - 对于需要更精确模拟 Cloudflare 环境（尤其是 D1）的开发，使用 `pnpm dev-d1`。
3.  **代码质量**: 在提交前运行 `pnpm lint` 检查代码规范错误。
4.  **代码提交**: 遵循 [Conventional Commits](https://www.conventionalcommits.org) 规范来编写提交信息。
5.  **拉取请求 (Pull Request)**: 推送特性分支并创建到 `main` 分支的 Pull Request。

## 部署

- 项目通过 `pnpm run deploy` 命令部署到 Cloudflare。
- 该命令首先使用 OpenNext 构建 Next.js 应用，然后将生成的资源和 Worker 脚本部署到 Cloudflare Pages 和 Workers。
- **首次设置**: 需要在 Cloudflare 仪表板中创建一个 D1 数据库，并使用正确的 `account_id` 和 `database_id` 更新 `wrangler.jsonc` 文件。

## 编码标准

- **TypeScript**: 已启用严格模式 (`"strict": true` in `tsconfig.json`)。
- **API 路由**: API 逻辑放置在 `src/app/api/` 目录中。
- **D1 数据库访问**: 在 API 路由中，通过 `env.DB` 访问 D1 绑定。`env` 对象通常通过 `getCloudflareContext()` 获取。
- **错误处理**: 将异步操作（尤其是数据库查询）包装在 `try...catch` 块中，并提供有意义的错误响应。
- **路径别名**: 项目使用 `@/*` 别名来代表从 `src/` 目录开始的路径 (例如, `@/components/Header`)。

## 回复要求
- 请使用中文回复