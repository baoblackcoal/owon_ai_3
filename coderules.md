# 编码要求
- 所有 API 调用与错误处理应使用显式类型，错误捕获使用 `unknown`，并通过 `instanceof Error` 判断。
- 严禁使用 `any`，必须为 API 响应和数据结构定义精确的接口类型。