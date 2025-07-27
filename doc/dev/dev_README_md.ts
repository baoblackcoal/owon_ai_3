
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
# 在 wrangler.jsonc 中配置普通环境变量
"vars": {
  "BCRYPT_SALT_ROUNDS": "12",
  "NEXTAUTH_URL": "https://owonai.top"
}

# 设置加密环境变量（敏感信息）
cd nextjs
npx wrangler secret put NEXTAUTH_SECRET
npx wrangler secret put DASHSCOPE_API_KEY
npx wrangler secret put DASHSCOPE_APP_ID
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
- NEXTAUTH_URL 必须在 wrangler.jsonc 的 vars 中设置，不要使用 secret
- 若使用 NextAuth v5 + Workers，需设置 trustHost: true（已在 auth.ts 中设置）
- 部署后如果出现登录问题：
  1. 确保 NEXTAUTH_URL 在 wrangler.jsonc 中正确设置
  2. 确保 NEXTAUTH_SECRET 已通过 wrangler secret 设置
  3. 检查 auth.ts 中的 trustHost 设置为 true
  4. 部署后等待几分钟让配置生效

# 发布和部署

```
// 部署预览
pnpm run preview

// 部署
pnpm run deploy
```

# 常见问题
- 如果本地网站还处于开启的状态会出现，在执行pnpm run preview 或 pnpm run deploy时会出错，需要终止pnpm run dev 或 pnpm run preview
- 如果部署后无法登录，请检查以下几点：
  1. NEXTAUTH_URL 是否在 wrangler.jsonc 中正确配置
  2. NEXTAUTH_SECRET 是否已通过 wrangler secret 命令设置
  3. 是否等待了几分钟让配置生效
  4. 检查浏览器控制台是否有具体错误信息