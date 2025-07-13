# OWON AI Cloudflare 项目开发文档

> 本项目基于 **Next.js 15 (App Router)** + **OpenNext** 部署到 **Cloudflare Workers & Pages**，数据层使用 **D1 数据库**。下文将介绍完整的本地开发、构建与部署流程。

## 目录结构

```
owon_ai_cloudflare/
├─ nextjs/            # 应用主工程（Next.js 15）
│  ├─ src/            # 应用源码
│  ├─ public/         # 静态资源
│  ├─ .next/          # 开发/构建输出
│  ├─ .open-next/     # OpenNext 输出
│  ├─ wrangler.jsonc  # Cloudflare Workers & D1 配置
│  └─ ...
├─ doc/               # 说明文档
│  └─ dev/README.md   # 发布流程快速说明
└─ README.md          # ← 当前开发说明
```

## 前置环境

| 工具       | 版本                | 说明                              |
|------------|---------------------|-----------------------------------|
| Node.js    | ≥ 22.x              | 建议使用 `nvm` 或 `fnm` 管理版本   |
| pnpm       | ≥ 9.x               | 包管理器，已写入 `.npmrc`          |
| Git        | 任意 (支持 LFS)     | 代码管理                           |
| Wrangler   | ≥ 4.x（可选）       | Cloudflare CLI，本地 D1/Workers    |

> Windows 用户：
> 1. **强烈建议使用 [WSL2](https://learn.microsoft.com/windows/wsl/) + Ubuntu** 获取类 UNIX 体验；
> 2. 如需在原生 PowerShell 下运行，已通过 `.npmrc` 启用 `node-linker=hoisted` 以缩短 `node_modules` 路径，避免 260 字符限制；
> 3. 仍建议将仓库放置在路径较短的盘符根目录下，例如 `D:\proj`。

## 一键启动开发

```powershell
# 克隆仓库
> git clone https://github.com/your-org/owon_ai_cloudflare.git
> cd owon_ai_cloudflare\nextjs

# 安装依赖
> pnpm i

# 本地开发 (Hot-Reload)
> pnpm dev
# http://localhost:3000
```

### D1 数据库

* 本地 `pnpm dev` **不会自动注入** D1 绑定。
* 若要联调带数据库的逻辑，可使用：
  ```powershell
  pnpm preview
  ```
  该命令通过 `wrangler pages dev` 启动，Wrangler 会把 **`wrangler.jsonc`** 中声明的 `[[d1_databases]]` 注入到请求上下文。

### 目录 /api/test/d1

示例接口位于 `src/app/api/test/d1/route.ts`，演示了如何在 Edge 函数中读取 D1：

```ts
const { env } = await getCloudflareContext();
const db = (env as { DB?: D1Database }).DB;
```

## 常用脚本

| 命令                 | 作用                                            |
|----------------------|-------------------------------------------------|
| `pnpm dev`           | Vite-like 本地开发服务器 (localhost:3000)       |
| `pnpm preview`       | Wrangler 本地模拟（含 D1、Edge Runtime）        |
| `pnpm lint`          | ESLint + TypeScript 校验                         |
| `pnpm format`        | Prettier 格式化                                 |
| `pnpm test`          | Vitest 单元测试（未来可按需补充）                |
| `pnpm run deploy`    | **生产构建 + OpenNext + Cloudflare 发布**       |

## 构建 & 发布

1. **生产构建**
   ```powershell
   pnpm run deploy
   ```
   该脚本会执行：
   1. `opennextjs-cloudflare build` – 使用 OpenNext 打包 Next.js (App Router)。
   2. `opennextjs-cloudflare deploy` – 将产物上传至 Cloudflare Pages + Workers。

2. **首次部署前**
   * 在 Cloudflare Dash 创建 `D1` 实例，并在 **Settings → Variables → KV/D1 Bindings** 配置名称 `DB`；
   * 在 **Wrangler → Project Settings → Environment Variables** 中追加所需的环境变量；
   * 替换 `wrangler.jsonc` 中的 `account_id` 与 `d1_databases` 的 `id/database_name`；
   * 创建 `wrangler.toml`（可选）以支持 `pnpm wrangler d1` CLI 交互。

## ESLint 与代码规范

项目启用了 `@next/eslint-config` 与 `@typescript-eslint`, 关键规则：
* **无未使用变量** – 若确需占位，可命名为 `_` 前缀；
* 组件必须使用函数式；
* import 顺序保持一致。（执行 `pnpm lint --fix` 自动整理）

## 常见问题 FAQ

| 问题                                                   | 解决方案                                                     |
|--------------------------------------------------------|--------------------------------------------------------------|
| Windows 构建失败：`Cannot find module ... jest-worker` | 确认已启用 `.npmrc node-linker=hoisted`，并位于短路径目录。   |
| `OpenNext requires edge runtime function to be defined…` | 删除 `export const runtime = 'edge'`，由 OpenNext 自动处理。 |
| D1 本地调试提示未绑定                                  | 使用 `pnpm preview` 或实际部署到 Cloudflare 进行测试。       |

## 贡献指南

1. Fork & Branch：`feature/your-feature`
2. 提交信息遵循 **[Conventional Commits](https://www.conventionalcommits.org)**；
3. 合并至 `main` 由 GitHub Actions 自动触发预览部署（可选）。

---

> 如有任何疑问或改进建议，请提 Issue 或 PR。Happy Hacking! ✨ 