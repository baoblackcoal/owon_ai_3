# 数据库

```
// 本地
npx wrangler d1 execute test_d1 --local --file=./src/app/test/d1/schema.sql
npx wrangler d1 execute test_d1 --local --command="SELECT * FROM Customers"

// 远程
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