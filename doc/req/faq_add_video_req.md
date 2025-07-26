# FAQ 视频支持需求文档

> 参考 《专业产品经理的要求》

## 一、背景
目前 FAQ 仅支持纯文本（Markdown）形式的内容与答案。随着产品功能愈发复杂，文字说明已难以满足用户对操作演示、故障排查等高阶场景的理解需求。引入视频讲解能够显著提升用户学习效率和问题解决率。

## 二、需求（Requirements）
1. **核心需求**
   - FAQ 问题允许绑定 1 个演示视频，视频是存在B站的,后续增加youtube。
   - 管理端（后续建设）可为 FAQ 问题批量上传/编辑/删除视频。
2. **用户目标**
   - 新手用户通过观看视频快速完成设备上手、功能设置；
3. **约束条件**
   - 运行于 Cloudflare Workers，需考虑带宽成本与跨域；
   - 不在本迭代实现上传功能，视频文件暂存至 **Cloudflare R2**，由后台配置视频直链（或 HLS）。

## 三、功能列表
| 编号 | 功能 | 描述 |
|------|------|------|
| F1 | FAQ 视频渲染 | FAQ 详情页加载并播放关联视频列表 |
| F2 | 视频指示 | FAQ 列表卡片展示「📹」图标表明该问题含视频 |
| F3 | API 扩展 | `GET /api/faq`、`GET /api/faq/{id}` 返回 `videos` 字段 |
| F4 | 过滤器 | 新增“仅看有视频”过滤选项（可选，本期若时间充裕实现） |
| F5 | 点赞、浏览统计 | 继承现有逻辑，不单独统计视频 |

## 四、数据库设计（Database Design）
- **原则：** 仅修改 `faq_questions` 表，不新增额外表。
- **字段调整：**
  | 字段 | 类型 | 约束 | 说明 |
  |------|------|------|------|
  | video_urls | TEXT | 可空 | **JSON 字符串**，存放 B 站视频嵌入地址数组，例如 `["//player.bilibili.com/player.html?bvid=BV1X...&autoplay=0"]` |
  | has_video | INTEGER | DEFAULT 0 | 0/1 标识是否存在视频，便于快速筛选 |

- **迁移 SQL（追加至 `0007_create_faq_tables.sql`）**
  ```sql
  -- FAQ 视频支持：为问题表增加视频字段
  ALTER TABLE faq_questions ADD COLUMN video_urls TEXT; -- JSON array of bilibili iframe URLs
  ALTER TABLE faq_questions ADD COLUMN has_video INTEGER DEFAULT 0;
  CREATE INDEX IF NOT EXISTS idx_faq_questions_has_video ON faq_questions(has_video);
  ```

- **数据一致性**：
  - 当创建/更新 `video_urls` 时，若数组非空则同步将 `has_video` 设为 1，否则设为 0。
  - 后续管理端保存时直接写入两个字段，避免触发器开销。

## 五、接口变更（仅声明）
1. **列表接口** `GET /api/faq`
   - 新增查询字段 `has_video`（布尔，可选）。
   - 响应项中继续返回 `has_video`，并在需要时返回简要 `first_video_url`（列表卡片可取第一条用作预判）。
2. **详情接口** `GET /api/faq/{id}`
   - 新增字段 `videos: Array<string>`，由后端将 `video_urls` JSON 解析成字符串数组；顺序按存储顺序。

> 以上接口变更向后兼容：旧客户端忽略新字段即可。

## 六、前端 UX 设计（User Experience）
### 6.1 FAQ 列表页
- 在 `FaqQuestionCard` 中若 `has_video=true`，在标题左侧展示小型摄像机图标（Tailwind `text-primary`）。
- 支持根据过滤项「仅看有视频」刷新列表。

### 6.2 FAQ 详情页
- 播放器实现沿用 `src/app/test/bilibili/page.tsx` 中的懒加载思路：使用 `<iframe>` 嵌入 B 站播放器，外包 `aspect-video` 容器，加载动画、IntersectionObserver 预加载等均可复用为通用组件 `BilibiliVideo`。
```
标题
标签 | 浏览量 | 点赞 …
📹 视频播放器 (可横向滑动多个)
— 分割线 —
Markdown 答案
相关推荐
```
- 播放器使用 **shadcn/ui** 的 `aspect-video` 容器包裹 `<video controls>`；多视频时使用横向滚动列表并显示序号。
- 视频区域置于答案正文上方，确保用户先看到演示。
- 播放时自动暂停其他视频，避免多声道。

### 6.3 响应式
- **Mobile**：播放器宽度 `100%`，高度自动；多视频使用左右滑动。
- **Desktop**：宽度限制 `max-w-3xl`；多视频缩略图展示下方可点击切换。

## 七、技术可行性与风险
| 风险 | 等级 | 缓解措施 |
|------|------|----------|
| 带宽成本增加 | 中 | 使用 Cloudflare R2 + HLS 分段；对大文件开启自动缓存 |
| 跨域 (CORS) | 中 | R2 绑定域名配置 CORS `*` / 指定域 |
| 不支持上传 | 低 | 本期仅支持手动配置 URL |

## 八、验收标准
- [ ] API 返回视频数据准确；
- [ ] 前端可正常播放，首帧时间 ≤ 2s（CDN 缓存情况下）；
- [ ] UI 兼容移动 & 桌面，无布局错乱；
- [ ] 视频指示与过滤功能符合预期；

## 九、测试 & Mock 数据
- **SQL Mock**：在 `src/sql/test/faq/0001_test_insert_faq_test_data.sql` 中新增示例：
  ```sql
  -- 为 FAQ 视频功能准备示例数据
  UPDATE faq_questions
  SET video_urls = '["//player.bilibili.com/player.html?isOutside=true&bvid=BV1nL8NzkEyx&autoplay=0"]',
      has_video   = 1
  WHERE id = 'test-question-1';
  ```
- 确保本地 `npx wrangler d1` 导入测试库后，FAQ 列表可筛选并展示含视频问题。

