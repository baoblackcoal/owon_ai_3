# 数据库

```
// ------- 本地 -------
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
npx wrangler d1 execute test_d1 --remote --file=./src/app/test/d1/schema.sql
npx wrangler d1 execute test_d1 --remote --command="SELECT * FROM Customers"
```

# 发布和部署

```
// 部署预览
pnpm run preview

// 部署
pnpm run deploy
```

# 常见问题
- 如果本地网站还处于开启的状态会出现，在执行pnpm run preview 或 pnpm run deploy时会出错，需要终止pnpm run dev 或 pnpm run preview