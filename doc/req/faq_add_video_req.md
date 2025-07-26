# FAQ 视频支持需求文档

> **遵照原则**：《专业产品经理的要求》，确保需求明确、功能设计合理、用户体验至上。

## 一、背景
当前 FAQ 系统仅支持纯文本（Markdown）内容。随着产品功能日趋复杂，仅靠文字难以清晰地向用户传达操作流程或解决复杂问题。引入视频讲解，特别是直观的操作演示，将极大提升用户理解效率和问题解决成功率，从而优化整体用户体验。

## 二、需求（Requirements）
1.  **核心需求**
    - **为每个 FAQ 问题关联一个 Bilibili 视频**。视频作为答案的补充，提供操作演示或概念讲解。
    - 后台管理系统（未来迭代）应支持对 FAQ 问题的视频进行增、删、改操作。
2.  **用户目标**
    - **提升问题解决效率**：用户通过观看视频，能够快速掌握功能使用方法或解决遇到的问题。
    - **降低理解门槛**：对于复杂概念，视频能提供比文字更直观、易于吸收的解释。
3.  **约束与假设**
    - **视频源**：所有视频均托管于 Bilibili (B站)。
    - **技术栈**：功能需在 Cloudflare Workers 环境下稳定运行，关注性能与成本。
    - **迭代范围**：本期不包含视频上传功能，仅实现视频的嵌入与播放。

## 三、功能列表
| 编号 | 功能 | 描述与价值 |
|------|------|------|
| F1 | **FAQ 视频播放** | 在 FAQ 详情页加载并播放关联的 Bilibili 视频。这是满足用户通过视频解决问题的核心功能。 |
| F2 | **视频内容标识** | 在 FAQ 列表页，为包含视频的问题添加明确的「📹」图标，帮助用户快速识别并筛选内容。 |
| F3 | **API 扩展** | `GET /api/faq` 和 `GET /api/faq/{id}` 接口需返回视频关联字段，为前端提供渲染数据。 |
| F4 | **视频内容过滤** | 提供“仅看有视频”的筛选选项，优化用户在特定场景下的内容查找体验。 |
| F5 | **统计继承** | 点赞、浏览量等统计沿用现有逻辑，无需为视频单独统计，保持系统简洁性。 |

## 四、数据库设计（Database Design）
- **原则**：最小化数据库结构变更，仅在 `faq_questions` 表上进行扩展。
- **字段变更**：

| 原字段 | 新字段 | 类型 | 约束 | 说明 |
| :--- | :--- | :--- | :--- | :--- |
| `video_urls` | `video_bilibili_bvid` | TEXT | 可空 | **核心变更**：存储 Bilibili 视频的 `BVID` (例如 `BV1nL8NzkEyx`)。这比存储完整 URL 更灵活、更节省空间，且意图明确。 |
| `has_video` | `has_video` | INTEGER | DEFAULT 0 | 保持不变。作为冗余字段，用于快速筛选和索引，提升查询性能。 |

- **迁移 SQL（追加至 `0007_create_faq_tables.sql`）**
  ```sql
  -- FAQ 视频支持：为问题表增加 Bilibili BVID 字段
  ALTER TABLE faq_questions ADD COLUMN video_bilibili_bvid TEXT; -- Bilibili Video ID (BVID)
  ALTER TABLE faq_questions ADD COLUMN has_video INTEGER DEFAULT 0;
  CREATE INDEX IF NOT EXISTS idx_faq_questions_has_video ON faq_questions(has_video);
  ```

- **数据一致性**：
  - 当创建/更新 `video_bilibili_bvid` 时，若该字段非空，则同步将 `has_video` 设为 1，否则设为 0。此逻辑由应用层保证。

## 五、接口变更
1.  **列表接口** `GET /api/faq`
    - 查询参数：新增 `has_video` (布尔值, 可选)。
    - 响应体：`has_video` 字段继续返回。
2.  **详情接口** `GET /api/faq/{id}`
    - 响应体：新增 `video_bilibili_bvid: string | null` 字段，直接返回数据库存储的 BVID。

> **兼容性说明**：以上接口变更向后兼容，旧版客户端将忽略新增字段。

## 六、前端 UX 设计（User Experience）
### 6.1 FAQ 列表页
- 在 `FaqQuestionCard` 组件中，若 `has_video=true`，则在标题左侧展示一个小型摄像机图标（使用 `lucide-react` 图标库，颜色为 `text-primary`），提供清晰的视觉引导。

### 6.2 FAQ 详情页
- **播放器实现**：
    - 复用 `src/app/test/bilibili/page.tsx` 中的 `BilibiliVideo` 组件，并将其改造为通用组件。
    - **动态构建 URL**：前端获取到 `video_bilibili_bvid` 后，在组件内部动态构建 Bilibili 播放器 `iframe` 的 URL。例如: `//player.bilibili.com/player.html?isOutside=true&bvid=${bvid}&autoplay=0`。
- **页面布局**：
    ```
    问题标题
    标签 | 浏览量 | 点赞数
    📹 Bilibili 视频播放器
    — 分割线 —
    Markdown 格式的图文答案
    相关问题推荐
    ```
    - 视频播放器置于答案正文之上，确保用户能第一时间看到最直观的解决方案。
- **响应式设计**：
    - **移动端**：播放器宽度为 `100%`，高度按 16:9 比例自适应。
    - **桌面端**：播放器设置最大宽度 `max-w-3xl`，在页面中居中显示，以获得更好的观看体验。

## 七、技术可行性与风险
| 风险点 | 等级 | 缓解措施 |
| :--- | :--- | :--- |
| Bilibili 播放器 API 变更 | 低 | Bilibili 作为大型平台，其嵌入式播放器 API 具有较好的稳定性。封装 `BilibiliVideo` 组件可在未来统一应对变更。 |
| 视频内容不可用 | 中 | Bilibili 视频可能被删除或设为私有。当前版本暂不处理，未来可考虑增加后台健康检查功能。 |

## 八、验收标准
- [ ] **API**：`GET /api/faq/{id}` 接口能准确返回 `video_bilibili_bvid` 字段。
- [ ] **前端播放**：FAQ 详情页能根据获取的 BVID 正常加载并播放 Bilibili 视频。
- [ ] **UI/UX**：
    - [ ] 列表页的视频标识清晰可见。
    - [ ] 详情页的视频播放器布局在各尺寸设备上（移动、桌面）均无错乱。
    - [ ] “仅看有视频”的过滤功能（若实现）工作正常。

## 九、测试与 Mock 数据
- **SQL Mock 数据** (位于 `src/sql/test/faq/0001_test_insert_faq_test_data.sql`):
  ```sql
  -- 为 FAQ 视频功能准备示例数据
  UPDATE faq_questions
  SET video_bilibili_bvid = 'BV1nL8NzkEyx', -- 存储 BVID
      has_video           = 1
  WHERE id = 'test-question-1';
  ```
- **测试步骤**：
    1.  在本地运行 `pnpm dev-d1` 启动开发环境。
    2.  确认测试数据已加载到本地 D1 数据库。
    3.  访问 FAQ 列表页，验证视频标识和筛选功能。
    4.  进入指定 FAQ 详情页，验证 Bilibili 视频是否能成功播放。