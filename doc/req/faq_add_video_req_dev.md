Read file: nextjs/src/app/api/faq/route.ts

Ran tool

Read file: nextjs/src/app/api/faq/[id]/route.ts

Read file: nextjs/src/app/api/faq/filters/route.ts

Read file: nextjs/src/app/api/faq/[id]/like/route.ts

Read file: nextjs/src/app/(main)/faq/page.tsx

Read file: nextjs/src/contexts/FaqContext.tsx

Read file: nextjs/src/lib/faq-utils.ts

Read file: nextjs/src/types/faq.ts

Read file: doc/dev/product_manager_req.md

Ran tool

Read file: doc/req/faq.md.ts

Read file: nextjs/src/components/faq/FaqQuestionList.tsx

Read file: nextjs/src/components/faq/FaqQuestionCard.tsx

Read file: nextjs/src/app/(main)/faq/[id]/page.tsx

Read file: nextjs/src/components/faq/FaqFilters.tsx

Read file: doc/req/faq_add_video_req.md

Read file: doc/req/faq_ux_req.md

以下内容基于现有代码与数据库脚本的实际情况，结合《product_manager_req.md》对于“需求-功能-用户体验” 的专业要求，对 FAQ 常见问答集功能做一次完整的实现方案梳理。  

⚠️ 当前仓库中 FAQ 相关代码（API、前端页面、上下文、SQL 脚本、测试数据）已完成 70% 以上的核心需求，实现思路与文档基本一致，但仍有数个“缺口” / “可优化点”。下面按照「需求 → 功能 → 体验」三个层面，给出差距分析与落地步骤。

------------------------------------------------------------------
一、现状快速回顾
1. 数据库  
   • `0007_create_faq_tables.sql` 已建好 6 张核心表，字段与文档保持一致。  
   • 测试脚本 `0001_test_insert_faq_test_data.sql` 已写入分类/机型/标签/问题示例数据。  

2. API（Cloudflare D1 + Route Handler）  
   • 列表 `/api/faq`、详情 `/api/faq/[id]`、过滤器 `/api/faq/filters`、点赞 `/api/faq/[id]/like` 均已就绪。  
   • 查询语句已支持搜索、分类/机型/标签筛选、排行 period、分页 cursor。  

3. 前端  
   • 列表页 `/faq`、详情页 `/faq/[id]`、上下文 `FaqContext`、工具函数 `faq-utils.ts`、组件若干（筛选、搜索、列表卡片等）已完成。  
   • 排序 Tab、排行时间范围组件已经在 UI 中实现。  

------------------------------------------------------------------
二、与《product_manager_req.md》要求的差距
A. 功能层
1. 复制答案 📋（列表和详情页均未实现）。  
2. 列表视图切换（列表 / 卡片）缺失。  
3. 浏览量防刷（同一用户 / IP 60 s 内只计一次）未落地。  
4. 游客点赞未阻断 —— 详情页已提示“请先登录”，但列表页缺少入口；API 端只有简单 session 判断，无 CSRF / Origin 校验。  
5. 后台 CSV 导入 & 管理端暂未开发（规划到 M3，可先留接口占位）。  

B. 用户体验层
1. Markdown 渲染：问题 `content` 在详情页仍是纯文本；应与 `answer` 同样用 `marked` / `react-markdown` 渲染。  
2. 列表页缺少“结果数”提示、空过滤摘要 Badge、“仅看有视频”筛选。  
3. 复制后 Toast 反馈、按钮焦点 / aria-label 需要补全。  

------------------------------------------------------------------
三、落地实现步骤（按优先级）

1️⃣ 复制答案功能（M2 必须）  
   • 前端：  
     - 在 `FaqDetailPage` 的操作栏加入按钮：  
       ```tsx
       <Button
         aria-label="复制答案"
         variant="ghost"
         size="sm"
         onClick={() => {
           navigator.clipboard.writeText(
             question.answer.replace(/```[\s\S]*?```/g, '') // 纯文本或保留 Markdown
           );
           toast.success('已复制到剪贴板');
         }}
       >
         <Clipboard className="h-4 w-4" />
       </Button>
       ```  
     - 如需列表页也可复制，复用相同逻辑。  
   • 无后端改动。  

2️⃣ 列表 / 卡片视图切换  
   • 在 `FaqFilters.tsx` 下方加一个 `ToggleGroup` 保存至 `localStorage`。  
   • `FaqQuestionList` 根据 `viewMode` 渲染 `FaqQuestionCard` 或简化版 `FaqQuestionListItem`。  

3️⃣ 浏览量防刷 & 统计准确性  
   • API `/api/faq/[id]` 中 `UPDATE views_count = views_count + 1` 前，增加一张轻量缓存表或 KV：`faq_views(user_or_ip, question_id, ts)`。  
   • 如果相同主键 60 秒内已存在记录则跳过累加。Cloudflare D1 或 Workers KV 均可。  

4️⃣ Like 接口安全  
   • 在 `POST /faq/[id]/like` 增加 `verifyOrigin(request)`；返回 403 时前端 toast。  
   • 为防止并发写入导致 likes_count 负数，新建 DB 触发器或使用事务：  
     ```sql
     BEGIN;
     DELETE ...;
     UPDATE faq_questions SET likes_count = CASE WHEN likes_count>0 THEN likes_count-1 END WHERE id=?;
     COMMIT;
     ```  

5️⃣ Markdown 渲染统一  
   • 列表卡片`content`仍做 300 字截断即可；详情页把 `question.content` 也用 `marked` / `react-markdown`。  

6️⃣ “仅看有视频”筛选 & 列表视频图标（若按新增视频需求一起做）  
   • SQL：在列表查询中追加 `AND q.has_video = 1`；查询参数 `has_video=true`。  
   • 前端：在筛选区域新增开关；在 `FaqQuestionCard` 标题前插入摄像机图标。  

7️⃣ CSV 导入后台（M3）  
   • 先写 `/api/admin/faq/import` 接口：上传 → 存入 `faq_import_jobs` 表 → Worker Queue。  
   • 管理端页面留占位路由 `/(admin)/faq/import`.  

------------------------------------------------------------------
四、任务分解 & 预计工时
| 任务 | 负责人 | 预估 | 备注 |
|---|---|---|---|
| 复制答案按钮 + Toast | FE | 0.5 d |  |
| 视图切换（列表/卡片） | FE | 1 d | 含样式适配 |
| 浏览量防刷 | BE | 1 d | D1 + KV |
| Like 接口安全补强 | BE | 0.5 d | |
| Markdown 渲染统一 | FE | 0.3 d | |
| “有视频”筛选 & 图标 | FE/BE | 0.8 d | 若并行视频需求 |
| CSV 导入接口雏形 | BE | 2 d | 后台另计 |

------------------------------------------------------------------
五、交付准则（验收）
1. 所有新增/修改代码 `pnpm run check` 无类型错误；ESLint 通过。  
2. 手动流程：搜索 → 筛选 → 列表视图切换 → 详情页点赞/复制 → 返回保持滚动位置。  
3. Playwright MCP 脚本覆盖复制与视图切换路径。  
4. Cloudflare Preview & 本地 D1 环境皆能正确统计浏览/点赞。  

以上方案可确保 FAQ 功能完全符合《product_manager_req.md》提出的“需求-功能-体验”三位一体标准，并为后续视频扩展、CSV 导入奠定技术与代码结构基础。如需进一步细化某一步骤，请告诉我！