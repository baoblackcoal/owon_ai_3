-- FAQ 测试数据插入 (更新为一问一答 + Markdown 格式)

-- 1. 产品型号已存在的分类不需要重复插入
INSERT OR IGNORE INTO faq_product_models (id, category_id, name) VALUES
    ('model_1', 'cat_1', 'ADS800A'),
    ('model_2', 'cat_1', 'ADS900A'),
    ('model_3', 'cat_1', 'ADS3000'),
    ('model_4', 'cat_2', 'AG1000'),
    ('model_5', 'cat_2', 'AG2000'),
    ('model_6', 'cat_3', 'PDM3000');

-- 2. 插入新标签（已存在的标签不重复插入）
INSERT OR IGNORE INTO faq_tags (id, name) VALUES
    ('tag_1', '固件升级'),
    ('tag_2', 'PC软件'),
    ('tag_3', '基础操作'),
    ('tag_4', '高级功能'),
    ('tag_5', '故障排除'),
    ('tag_6', '触发'),
    ('tag_7', 'FFT');

-- 3. 清空并重新插入问题数据（一问一答 + Markdown格式）
DELETE FROM faq_question_tags;
DELETE FROM faq_likes;
DELETE FROM faq_questions;

INSERT INTO faq_questions (
    id,
    title, 
    content,
    answer,
    category_id,
    product_model_id,
    software_version,
    views_count,
    likes_count,
    created_at,
    updated_at
)
VALUES
(
    'q_1',
    '如何设置示波器的触发条件？',
    '我想要设置示波器的触发条件，但是不知道具体的操作步骤。请问应该如何操作？',
    '# 示波器触发条件设置

要设置示波器的触发条件，请按照以下步骤操作：

## 基本步骤

1. **按前面板的 TRIGGER 按钮**
2. **选择触发类型**（边沿、脉宽等）
3. **设置触发电平**
4. **选择触发源**
5. **设置触发耦合方式**

## 补充说明

- **边沿触发**是最常用的触发方式
- 触发电平可以通过触发旋钮快速调节
- 可以使用**自动触发模式**来快速获取波形

> 💡 **提示**: 对于稳定的波形显示，建议使用边沿触发配合适当的触发电平设置。',
    'cat_1',
    'model_1',
    'V1.0.0',
    100,
    50,
    datetime('now'),
    datetime('now')
),
(
    'q_2',
    'FFT 频谱分析的基本操作步骤是什么？',
    '我需要使用示波器进行FFT频谱分析，但对操作步骤不太清楚。请详细说明一下FFT功能的使用方法。',
    '# FFT 频谱分析操作指南

FFT频谱分析的基本步骤如下：

## 操作步骤

1. **按 MATH 按钮**进入数学运算菜单
2. **选择 FFT 功能**
3. **选择合适的窗函数**
   - Rectangle（矩形窗）
   - Hanning（汉宁窗）
   - Hamming（海明窗）等
4. **设置采样率和频率范围**
5. **调整垂直和水平刻度**以获得最佳显示效果

## 重要提示

- 使用FFT时，**建议使用Hanning窗**
- 采样率至少是信号最高频率的**2倍**（奈奎斯特定理）
- 可以使用光标测量FFT波形的具体数值

## 窗函数选择建议

| 窗函数 | 适用场景 |
|--------|----------|
| Rectangle | 脉冲信号分析 |
| Hanning | 一般频谱分析（推荐） |
| Hamming | 连续信号分析 |',
    'cat_1',
    'model_2',
    'V1.0.0',
    80,
    30,
    datetime('now'),
    datetime('now')
),
(
    'q_3',
    '如何使用信号发生器输出任意波形？',
    '我想要使用信号发生器输出自定义的任意波形，请问具体的操作流程是什么？需要什么软件吗？',
    '# 任意波形输出操作指南

要使用信号发生器输出任意波形，请按照以下步骤操作：

## 操作流程

1. **按前面板的 Wave 按钮**
2. **选择 Arb 波形**
3. **使用PC软件编辑波形**
4. **通过USB传输波形到仪器**
5. **设置波形参数**（频率、幅度等）

## 详细说明

### 波形编辑
- 使用专用的PC软件进行波形设计
- 支持手动绘制或数学函数生成
- 可以导入已有的波形数据

### 技术规格
- 任意波形最大点数为 **1M**
- 可以导入 **CSV格式** 的波形数据
- 支持波形编辑和数学运算

### 传输方式
```
PC软件 → USB接口 → 信号发生器
```

> ⚠️ **注意**: 确保波形数据格式正确，避免因数据错误导致输出异常。',
    'cat_2',
    'model_4',
    'V1.0.0',
    60,
    25,
    datetime('now'),
    datetime('now')
),
(
    'q_4',
    '电源过压保护功能如何设置？',
    '使用可编程电源时，想要设置过压保护功能来保护负载设备，请问具体应该如何配置？',
    '# 过压保护设置指南

电源过压保护设置步骤：

## 基本设置

1. **按 Menu 进入菜单**
2. **选择 Protection 设置**
3. **设置过压保护电压值**
4. **启用过压保护功能**
5. **确认设置并退出**

## 保护机制说明

### 触发条件
- 输出电压超过设定值时自动触发
- 保护动作时间 < 1ms

### 保护动作
- 过压保护触发后**输出自动关闭**
- 面板 **OVP指示灯** 亮起表示保护已触发
- 可以设置**报警声音提示**

## 设置建议

| 负载类型 | 建议保护电压 |
|----------|--------------|
| 敏感电路 | 工作电压 + 5% |
| 一般器件 | 工作电压 + 10% |
| 耐压器件 | 工作电压 + 20% |

> 🔒 **安全提示**: 过压保护是重要的安全功能，请根据负载特性合理设置保护阈值。',
    'cat_3',
    'model_6',
    'V1.0.0',
    40,
    20,
    datetime('now'),
    datetime('now')
);

-- 4. 为问题添加标签
INSERT INTO faq_question_tags (question_id, tag_id)
VALUES
    ('q_1', 'tag_6'),  -- 触发条件 - 触发
    ('q_1', 'tag_3'),  -- 触发条件 - 基础操作
    ('q_2', 'tag_7'),  -- FFT - FFT
    ('q_2', 'tag_4'),  -- FFT - 高级功能
    ('q_3', 'tag_2'),  -- 任意波形 - PC软件
    ('q_3', 'tag_3'),  -- 任意波形 - 基础操作
    ('q_4', 'tag_3'),  -- 过压保护 - 基础操作
    ('q_4', 'tag_5');  -- 过压保护 - 故障排除

-- 5. 插入点赞记录（需要有用户数据）
INSERT OR IGNORE INTO faq_likes (user_id, question_id)
SELECT 
    (SELECT id FROM User WHERE email = 'baojianbin@owoncn.com'),
    'q_1'
WHERE EXISTS (SELECT 1 FROM User WHERE email = 'baojianbin@owoncn.com');

INSERT OR IGNORE INTO faq_likes (user_id, question_id)
SELECT 
    (SELECT id FROM User WHERE email = 'baojianbin@owoncn.com'),
    'q_3'
WHERE EXISTS (SELECT 1 FROM User WHERE email = 'baojianbin@owoncn.com'); 