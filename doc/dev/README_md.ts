# 数据库

```
// ------- 本地 -------
// 增加0003_add_feedback_to_messages.sql
npx wrangler d1 execute DB --file ./src/sql/0003_add_feedback_to_messages.sql --local

// 删除ChatMessage和Chat表，并重新创建
cd nextjs ; npx  wrangler d1 execute DB --command "DROP TABLE IF EXISTS ChatMessage; DROP TABLE IF EXISTS Chat;" ; npx wrangler d1 execute DB --file ./src/sql/0001_create_messages_table.sql ; npx  wrangler d1 execute DB --file ./src/sql/0002_create_chat_sessions_table.sql

// 测试数据库
npx wrangler d1 execute test_d1 --local --file=./src/app/test/d1/schema.sql
npx wrangler d1 execute test_d1 --local --command="SELECT * FROM Customers"

// 本地，查看所有表
npx wrangler d1 execute test_d1 --local --command="SELECT name FROM sqlite_master WHERE type='table';"
// 查看Chat表
npx wrangler d1 execute test_d1 --local --command="SELECT * FROM Chat"     
// 查看ChatMessage表
npx wrangler d1 execute test_d1 --local --command="SELECT * FROM ChatMessage"

// ------- 远程 -------
// 增加0003_add_feedback_to_messages.sql
npx wrangler d1 execute DB --file ./src/sql/0003_add_feedback_to_messages.sql --remote

// 删除ChatMessage和Chat表，并重新创建
cd nextjs ; npx  wrangler d1 execute DB  --remote --command "DROP TABLE IF EXISTS ChatMessage; DROP TABLE IF EXISTS Chat;" ; npx wrangler d1 execute DB --remote --file ./src/sql/0001_create_messages_table.sql ; npx  wrangler d1 execute DB --remote --file ./src/sql/0002_create_chat_sessions_table.sql


npx wrangler d1 execute test_d1 --remote --file=./src/app/test/d1/schema.sql
npx wrangler d1 execute test_d1 --remote --command="SELECT * FROM Customers"
```

# 环境变量配置

## 本地开发环境
```bash
# 在 nextjs/.env.development.local 中配置
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-nextauth-secret-key-here
DASHSCOPE_API_KEY=your-dashscope-api-key
DASHSCOPE_APP_ID=your-dashscope-app-id
BCRYPT_SALT_ROUNDS=12
```

## Cloudflare Workers 生产环境
```bash
# 设置加密环境变量
cd nextjs
npx wrangler secret put NEXTAUTH_URL
npx wrangler secret put NEXTAUTH_SECRET
npx wrangler secret put DASHSCOPE_API_KEY
npx wrangler secret put DASHSCOPE_APP_ID

# 在 Cloudflare Dashboard 中设置
NEXTAUTH_URL=https://your-domain.com
```

## 代码中使用环境变量
```typescript
// 使用 src/lib/env.ts 中的工具函数
import { resolveConfig } from '@/lib/env';

async function someFunction() {
  const config = await resolveConfig();
  const { apiKey } = config.dashScope;
  // 使用 apiKey...
}
```

## 注意事项
- 不要在代码中硬编码敏感信息
- 使用 resolveConfig() 函数而不是直接访问 process.env
- 在生产环境部署前，确保所有必需的环境变量都已设置
- 本地开发时使用 .env.development.local，不要提交到版本控制
- 生产环境使用 Cloudflare 的加密环境变量系统
- Preview 环境会把变量注入 process.env，但正式部署不会
- 部署域名必须写入 NEXTAUTH_URL，并包含协议（如 https://）
- 若使用 NextAuth v5 + Workers，需设置 trustHost: true

# 发布和部署

```
// 部署预览
pnpm run preview

// 部署
pnpm run deploy
```

# 常见问题
- 如果本地网站还处于开启的状态会出现，在执行pnpm run preview 或 pnpm run deploy时会出错，需要终止pnpm run dev 或 pnpm run preview