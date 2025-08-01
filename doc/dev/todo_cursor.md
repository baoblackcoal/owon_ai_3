好的，我来列出详细的TODO清单，然后逐步实现方案二。

## TODO 清单

### 1. 基础页面结构
- [x] 创建 `nextjs/src/app/admin/(main)/faq-add/page.tsx` 主页面
- [ ] 创建 `nextjs/src/components/admin/FaqEditor.tsx` 编辑器组件
- [ ] 创建 `nextjs/src/components/admin/FaqList.tsx` FAQ列表组件
- [ ] 创建 `nextjs/src/components/admin/FaqPreview.tsx` 预览组件

### 2. 数据管理和API
- [ ] 创建 `nextjs/src/app/api/admin/faq/route.ts` FAQ CRUD API
- [ ] 创建 `nextjs/src/app/api/admin/faq/categories/route.ts` 分类管理API
- [ ] 创建 `nextjs/src/app/api/admin/faq/product-models/route.ts` 产品型号管理API
- [ ] 创建 `nextjs/src/app/api/admin/faq/tags/route.ts` 标签管理API
- [ ] 更新 `nextjs/src/types/faq.ts` 添加新的类型定义

### 3. 编辑器功能
- [ ] 实现Markdown编辑器（使用textarea + 预览）
- [ ] 实现实时预览功能
- [ ] 添加分类选择器（支持创建新分类）
- [ ] 添加产品型号选择器（支持创建新产品型号）
- [ ] 添加标签选择器（支持创建新标签）
- [ ] 添加Bilibili视频BVID输入
- [ ] 实现表单验证

### 4. 列表管理功能
- [ ] 实现FAQ列表显示
- [ ] 添加新建FAQ按钮
- [ ] 添加编辑FAQ功能
- [ ] 添加删除FAQ功能
- [ ] 添加搜索和筛选功能

### 5. 预览功能
- [ ] 实现Markdown渲染预览
- [ ] 实现视频预览（Bilibili嵌入）
- [ ] 实现响应式预览布局

### 6. 工具函数
- [ ] 创建 `nextjs/src/lib/faq-editor.ts` 编辑器工具函数
- [ ] 创建 `nextjs/src/hooks/useFaqEditor.ts` 编辑器Hook
- [ ] 创建 `nextjs/src/hooks/useFaqList.ts` 列表管理Hook

### 7. 样式和UI
- [ ] 实现响应式布局
- [ ] 添加加载状态和错误处理
- [ ] 实现深色模式支持
- [ ] 添加操作确认对话框

### 8. 测试和优化
- [ ] 测试所有CRUD操作
- [ ] 测试Markdown编辑和预览
- [ ] 测试分类、产品型号、标签管理
- [ ] 优化性能和用户体验

现在开始实现：

Read file: nextjs/src/types/faq.ts
现在我需要更新类型定义，然后创建编辑器组件：

现在我需要创建API路由来处理FAQ的CRUD操作：

现在创建分类、产品型号、标签的API路由：

现在我需要修复主页面中的类型问题，并更新保存逻辑：

现在我需要修复类型定义中的一些问题：

现在我需要修复FaqList组件中的类型问题：

现在让我测试一下页面是否能正常运行：

```bash
cd nextjs; pnpm run check
```
我需要修复页面组件，添加"use client"指令：

现在再次检查类型：

```bash
pnpm run check
```
我需要修复这些错误。首先修复lucide-react的导入问题：

现在修复API路由中的导入问题：

Read file: nextjs/src/lib/auth.ts
Ran tool
Read file: nextjs/src/lib/auth.ts
我需要修复API路由中的导入问题。看起来auth.ts导出的是auth而不是authOptions：

现在修复其他API路由：

现在修复页面中的转义字符问题：

现在再次检查类型：

```bash
pnpm run check
```
我需要修复这些ESLint错误。让我修复这些问题：

现在修复API路由中的类型问题：

现在修复其他API路由的类型问题：

现在再次检查类型：

```bash
pnpm run check
```
我需要修复剩余的any类型问题。让我修复这些问题：

现在修复其他API路由的类似问题：

现在再次检查类型：

```bash
pnpm run check
```
看起来有一个Next.js的类型错误。让我修复这个问题：

现在再次检查类型：

```bash
pnpm run check
```
我需要修复页面中的类型问题：

现在再次检查类型：

```bash
pnpm run check
```

你的需求和实现思路已经非常清晰，下面是详细的 TODO 列表，建议采用“单FAQ深度编辑”方案，保证体验和可维护性：

---

## TODO 列表

### 1. 页面与组件结构
- [x] 创建 `admin/(main)/faq-add/page.tsx` 页面，作为FAQ在线编辑主入口
- [ ] 创建 `components/admin/FaqEditor.tsx`，实现FAQ的表单编辑与预览
- [ ] 创建 `components/admin/FaqList.tsx`，左侧展示FAQ列表，支持选择、编辑、删除
- [ ] 创建 `components/admin/FaqPreview.tsx`，支持Markdown渲染和Bilibili视频预览

### 2. 数据与API
- [ ] 新增/完善 FAQ 相关API（CURD）：`/api/admin/faq`、`/api/admin/faq/[id]`
- [ ] 新增/完善 分类、产品型号、标签API：`/api/admin/faq/categories`、`/api/admin/faq/product-models`、`/api/admin/faq/tags`
- [ ] 支持前端获取/创建/编辑/删除FAQ、分类、型号、标签

### 3. 编辑器功能
- [ ] FAQ表单字段：标题、问题内容（Markdown）、答案内容（Markdown）、分类、产品型号、标签、BVID、软件版本
- [ ] 分类/型号/标签支持下拉选择和新建
- [ ] Markdown编辑区支持实时预览
- [ ] Bilibili BVID支持嵌入视频预览
- [ ] 表单校验与错误提示

### 4. FAQ列表功能
- [ ] FAQ列表支持搜索、筛选、分页
- [ ] 支持点击编辑、删除FAQ
- [ ] 支持新建FAQ按钮

### 5. 交互与体验
- [ ] 编辑/保存/取消/删除操作的交互与反馈
- [ ] 支持响应式布局和深色模式
- [ ] 代码风格、类型、注释、无any

### 6. 代码规范与测试
- [ ] 保证所有类型定义完整、无any
- [ ] 通过 `pnpm run check` 类型检查
- [ ] 通过 `pnpm lint` 代码风格检查
- [ ] 主要流程手动测试

---

**下一步建议：**
1. 先实现主页面和FAQ编辑器骨架（FAQ列表+右侧编辑/预览区）。
2. 再逐步补充API、表单、下拉选择、标签、视频预览等功能。

如需详细代码实现，可继续分步推进。