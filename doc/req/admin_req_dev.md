Read file: nextjs/src/sql/0004_create_users_table.sql

Read file: nextjs/src/app/api/auth/change-password/route.ts

Ran tool

Ran tool

Ran tool

Read file: nextjs/src/app/admin/d1_all/page.tsx

Read file: nextjs/src/app/admin/d1_all/page.tsx

一、使用流程梳理（核心「场景→动作→反馈」）

1. 访问场景  
   • 当访问 /admin 或任何以 /admin/ 开头的页面时：  
     –① 若未登录 ⇒ 跳转至「管理员登录页」。  
     –② 已登录但非管理员 ⇒ 返回 403 页面或重定向到首页并提示“无权访问”。  

2. 第一次登陆  
   • 数据库预置一条 id = 'admin'、role = 'admin'、password_hash = bcrypt('admin')、requires_password_change = 1 的记录。  
   • 管理员输入 id/账号：admin，密码：admin → 验证成功后生成 Session。  
   • 鉴权中检测到 requires_password_change = 1 ⇒ 立刻跳转到「必须修改密码」页面（或弹窗），此时只能修改密码，其他页面全部禁用。  

3. 正常登陆  
   • 管理员已修改过密码（requires_password_change = 0）。  
   • 输入新密码后直接进入 /admin 主控制台（目前的 D1 管理页等）。  

4. 修改密码  
   • 入口：  
     –首次登陆强制跳转页；  
     –/admin 控制台右上角「账号设置」→「修改密码」。  
   • 校验逻辑沿用 /api/auth/change-password，额外更新 requires_password_change = 0。  
   • 修改成功后给予 Toast 提示并自动跳回上一次访问的管理页面。  

二、数据库层改动（Cloudflare D1）

1. users 表新增字段  
   • role TEXT NOT NULL DEFAULT 'user'      -- user / admin / guest  
   • requires_password_change INTEGER NOT NULL DEFAULT 0  -- 1=必须修改  

2. 迁移脚本示例（0009_add_admin_role.sql）  
```sql
ALTER TABLE User ADD COLUMN role TEXT NOT NULL DEFAULT 'user';
ALTER TABLE User ADD COLUMN requires_password_change INTEGER NOT NULL DEFAULT 0;

INSERT INTO User (id, email, password_hash, is_guest, role, requires_password_change)
VALUES (
  'admin',                       -- 明确主键便于后续查询
  NULL,
  '$2a$12$xxxxxxxxxxxxxxxxxxxx', -- bcrypt('admin') 12 轮盐
  0,
  'admin',
  1
);
```
3. 后续所有查询需要增加 role/权限判断；类型文件 `types/next-auth.d.ts` 里扩展 `role` 和 `requiresPasswordChange` 字段。  

三、后端鉴权改动

1. `lib/auth.ts`  
   – 在 Credentials Provider 的 `authorize()` 中把 `role`、`requires_password_change` 一并写入返回的 user 对象。  
   – 在 `session()` 回调里透传上面两字段。  

2. Middleware（Next.js 13 `middleware.ts`）  
```ts
import { auth } from '@/lib/auth';
export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (pathname.startsWith('/admin')) {
    const session = await auth();
    if (!session) return NextResponse.redirect('/admin/login');
    if (session.user.role !== 'admin')
      return NextResponse.redirect('/403');        // 无权
    if (session.user.requiresPasswordChange && pathname !== '/admin/change-password')
      return NextResponse.redirect('/admin/change-password');
  }
}
```

四、前端 UI / UX

1. 登录页  
   – 复用 `AuthDialog`，但仅保留「账号/密码」并默认填充账号：admin（或直接隐藏账号输入框只剩密码）。  
   – 登录失败直接 Toast「密码错误」。  

2. 修改密码页  
   – 表单验证：当前密码≥6 位，新密码≥6 位且与确认密码一致。  
   – 修改成功后 `toast.success('密码已更新，请重新登录')` 并注销 session 强制重新登录（更安全）。  

3. Admin Layout 保护  
   – 在 `/src/app/admin/layout.tsx` 中读取 `auth()`：  
     • 非 admin ⇒ 抛错边界或重定向。  
     • 强制改密未完成 ⇒ 重定向到 /admin/change-password。  

五、落地实施步骤

1. 编写 0009 迁移文件并执行：`npx wrangler d1 migrations apply`。  
2. 更新 TypeScript 类型 (`types/next-auth.d.ts`, `src/types/user.ts` 等)。  
3. 扩展 `lib/auth.ts` 回调，让 Session 携带 role 与 requiresPasswordChange。  
4. 实现 `middleware.ts`。  
5. 新增页面：  
   • `/src/app/admin/login/page.tsx`  
   • `/src/app/admin/change-password/page.tsx`  
   • `/src/app/admin/layout.tsx`（Server Component，鉴权&Layout）。  
6. 前端复用/封装 `AuthDialog`, `ChangePasswordForm`。  
7. 手动测试：  
   • 未登录访问 /admin 应跳到登录页。  
   • 首次登陆后强制改密；改完能正常进入控制台。  
   • 普通用户登录访问 /admin 得到 403。  
8. 通过 Playwright MCP 做回归测试。  

这样即可满足「只有 Admin 可访问 /admin，首次登录必须改密」的需求，并符合产品经理对细节、UX 与安全性的准则。