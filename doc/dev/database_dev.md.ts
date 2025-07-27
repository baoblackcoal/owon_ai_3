# 数据库开发

```
// ------- 本地 -------
// 查看所有表
npx wrangler d1 execute DB --command "SELECT name FROM sqlite_master WHERE type='table';"

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
