# 仪器/系列深度链接需求文档

## 概述
实现聊天界面中仪器/系列的深度链接功能，支持：
- 通过URL参数直接访问特定知识库
- 基于URL参数自动配置UI
- 上下文感知的AI响应

## 功能需求

### 1. URL参数处理
- 支持`/chat?instrument=<类型>&series=<型号>`格式
- 参数说明：
  - `instrument`: 仪器类型（如OSC, AFG, DMM）
  - `series`: 仪器型号（如ADS800A, AFG1000）
- 大小写处理：参数不区分大小写

### 2. 参数验证
- 根据`instrument-config.ts`验证：
  - 仪器必须存在于`instrumentType`中
  - 型号必须存在于仪器的`pipelineIds`中
- 回退机制：
  - 无效仪器：使用OSC
  - 无效型号：使用仪器的第一个型号
  - 缺少参数：使用OSC/ADS800A

### 3. UI初始化
- 仪器/系列选择器必须反映URL值
- 参数缺失/无效时默认使用OSC/ADS800A
- 选择器变更必须更新上下文状态

### 4. 仪器信息弹窗
- 首次加载有效参数时显示弹窗
- 内容："您的仪器是[仪器名称]，系列是[型号]，AI对话将会使用相关知识库"
- 弹窗要求：
  - 使用shadcn/ui Dialog组件
  - 每个页面会话仅显示一次
  - 可关闭

### 5. API集成
- `/api/chat`端点必须：
  - 接受`instrument`和`series`参数
  - 验证参数（无效时返回400错误）
  - 使用配置中的正确pipeline IDs

### 6. 状态管理
- 在ChatContext中添加：
  - `instrument` (字符串)
  - `series` (字符串)
  - `setInstrumentSeries()` 函数
- 移除组件中的本地仪器/系列状态

## 非功能需求

### 1. 类型安全
- 所有新参数使用严格TypeScript类型
- 禁止使用`any`类型
- 定义明确接口：
  ```typescript
  interface InstrumentParams {
    instrument: keyof typeof instrumentType;
    series: string;
  }
  ```

### 2. 错误处理
- 客户端：静默回退到默认值
- 服务端：400响应包含：
  ```json
  { "error": "指定的仪器或系列无效" }
  ```

### 3. 性能
- 仅在初始加载时解析URL
- 弹窗渲染优化（需要时延迟加载）

### 4. 用户体验
- URL指定和用户选择仪器间无缝切换
- 清晰显示当前仪器/系列
- 非侵入式弹窗展示

## 测试用例

### 1. URL参数测试
| URL | 预期仪器 | 预期系列 | 弹窗显示 |
|-----|---------|---------|---------|
| `/chat?instrument=OSC&series=ADS800A` | OSC | ADS800A | 是 |
| `/chat?instrument=AFG&series=AFG1000` | AFG | AFG1000 | 是 |
| `/chat?instrument=INVALID&series=XXX` | OSC | ADS800A | 否 |
| `/chat?instrument=OSC` | OSC | ADS800A | 否 |
| `/chat?series=ADS800A` | OSC | ADS800A | 否 |

### 2. UI行为测试
- 验证选择器显示正确的初始值
- 验证仪器变更时系列重置为第一个可用值
- 验证弹窗每个会话仅显示一次

### 3. API测试
- 有效请求：200 OK
- 无效仪器：400 Bad Request
- 无效系列：400 Bad Request
- 缺少参数：使用默认值（无错误）

### 4. 上下文测试
- 验证仪器/系列通过上下文传播
- 验证选择器变更时状态更新

## 依赖项
1. `next/navigation` 用于URL解析
2. `instrument-config.ts` 用于验证
3. shadcn/ui Dialog组件
4. 更新的ChatContext提供者

## 实现说明
- 使用`useSearchParams()`处理URL
- 添加弹窗状态标志防止重复显示
- 确保所有仪器键值在比较时使用大写
- 添加数据库埋点（未来阶段）
