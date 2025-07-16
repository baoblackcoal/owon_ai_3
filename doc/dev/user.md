
一、现状梳理  
1. 代码里已实现聊天功能（`Chat` / `ChatMessage` 两张表 + 多个 API 路由），但完全没有用户体系、鉴权与用量统计。  
2. 前端 UI（`ChatSidebar.tsx` 等）直接请求公开接口，数据是“全局”共享，没有 user 维度。  
3. 尚未集成 NextAuth，数据库里也没有 `User` 表。  
4. Cloudflare D1 已接入，SQL migration 机制健全。  
=> 结论：用户系统需从 0 到 1 落地，且所有聊天相关逻辑需按 “用户/游客” 重构。

二、需求拆解 & 待办清单  
A. 数据层（D1）  
1. 新建 `User` 表  
   • id (PK) | email | password_hash | is_guest | chat_count | last_chat_date | created_at | updated_at  
   • email 唯一，guest 账号 email 为空，password_hash 允许 NULL。  
2. `Chat` & `ChatMessage` 增加 `user_id` 外键；历史数据做一次性迁移为 `NULL` 或临时用户。  
3. 新增索引  
   • User.email, User.last_chat_date  
   • Chat.user_id, Chat.updatedAt  
4. 后续 migration 脚本：`0004_create_users_table.sql`, `0005_add_user_id.sql` …

B. 鉴权 & 安全  
1. 引入 NextAuth v5（Edge Runtime 友好）  
   • Strategy 选 `jwt`，Credentials Provider（email + password）  
   • 自定义 Adapter：直接用 D1 查询/写入 `User` 表（无需第三方 ORM）  
   • `NEXTAUTH_SECRET` 环境变量写入两套 `.env.*.local`  
2. 注册接口 `/api/auth/register`  
   • zod 校验邮箱 & 密码 → bcrypt 加密 → 入库  
3. 登录接口由 NextAuth `authorize()` 实现：校验 bcrypt。  
4. 修改密码接口 `/api/auth/change-password`（需登录）  
5. CSRF & CORS 由 NextAuth 内置；额外对注册/登录做节流、防暴力破解。  
6. 后续可选：邮箱验证、忘记密码邮件。

C. 业务逻辑 / API  
1. 聊天 API (`/api/chat/*`)  
   • 在最顶层读取：  
     - `const session = await getServerSession()`  
     - 若无 session → 查 `guest_id` cookie → 若仍无则生成 10 位随机字符串，创建 guest 用户并通过 `Set-Cookie` 返回。  
   • 统一得到 `userId` 后：  
     - 检查 & 更新 `chat_count` / `last_chat_date`。  
     - 超额（>20 或 >100）直接返回 429 + 业务错误码。  
   • 所有表写入/查询时都带 `user_id`。  
2. `/api/chat/history`、`/api/chat/[chatId]`、删除对话等接口均按 `user_id` 过滤。  
3. 若游客完成注册 / 登录：  
   • 前端调用 `/api/auth/upgrade-guest`（或在 register 成功后）把匿名用户行更新为正式用户（填 email、password_hash、is_guest=false）。  

D. 前端／UX（shadcn + tailwind + react-hook-form + zod）  
1. 顶栏  
   • 未登录：显示 “注册 / 登录” 按钮（shadcn `Dialog`）  
   • 已登录：圆形头像（邮箱首字母），下拉 “邮箱 / 设置 / 登出”  
2. 注册 Dialog  
   • 邮箱 / 密码 / 确认密码 + 实时 zod 校验  
   • 调 NextAuth signIn 后自动跳回 `/chat` 并把现有聊天记录归属到 session.user.id  
3. 登录 Dialog  
   • 邮箱 / 密码 + 简易验证码（前端随机算式、后端校验）  
4. 设置 Drawer / Dialog  
   • 左侧导航：账户 | 通用  
   • 账户页：邮箱（只读）、修改密码表单、剩余次数  
   • 通用页：下拉选择默认机型  
5. 聊天输入框发送前校验剩余次数；超限时弹 Modal（文案同需求）。  
6. ChatSidebar  
   • 加载状态为空时展示 “暂无历史对话”  
   • 所有 fetch 带 Session cookie（默认行为）  

E. DevOps & 配置  
1. 新 env 变量：`NEXTAUTH_URL`、`NEXTAUTH_SECRET`、`BCRYPT_SALT_ROUNDS`  
2. eslint / ts strict 已启；新增代码需 pass `pnpm run check`。  
3. Windows PowerShell 本地开发需要 `pnpm preview` 才注入 D1，文档要更新。  

三、风险点 & 额外建议（原需求未提到）  
1. 邮箱验证 & 忘记密码：正式环境几乎必需，可放二期。  
2. 时区问题：`last_chat_date` 建议存储 UTC + 用户时区换算，否则跨 0 点边界会混乱。  
3. 并发更新 `chat_count`：需在一次事务内 `SELECT … FOR UPDATE` 或 `UPDATE … SET chat_count = chat_count + 1 WHERE chat_count < limit` 防竞态。  
4. 清理过期游客 & 历史聊天：定时 CRON Worker 删除 30 天未活跃的 guest。  
5. UI 适配移动端（Dialog/Drawer 滚动 & safe-area）、深色模式。  
6. 安全：  
   • bcrypt cost ≥ 10，密码最小 8 位更稳妥  
   • 登录/注册暴力破解防护（IP 节流、验证码或 Cloudflare Turnstile）  
   • 所有 mutation API 走 POST，避免 GET 泄漏。  
7. 性能：Chat 列表分页（>50 条时）、懒加载消息。  
8. 法律：隐私政策、Cookie Banner（EU/China 视监管再评估）。  

四、里程碑排期（粗略）  
1. M1 – 数据模型 & Migration（0.5d）  
2. M2 – NextAuth 基础登录/注册（1.5d）  
3. M3 – 聊天 API 重构 + ChatCount 校验（2d）  
4. M4 – 游客逻辑 & Cookie（1d）  
5. M5 – 前端 UI / Dialog / 设置页（2d）  
6. M6 – 修改密码 & 账户升级（0.5d）  
7. M7 – 测试 & QA（1d）  
8. M8 – 文档 & 部署（0.5d）  
