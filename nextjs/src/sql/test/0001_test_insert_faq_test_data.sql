-- FAQ 测试数据插入

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

-- 3. 插入示例问题
INSERT OR IGNORE INTO faq_questions (
    id,
    title, 
    content,
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
    '要设置示波器的触发条件，请按照以下步骤操作：\n\n1. 按前面板的 TRIGGER 按钮\n2. 选择触发类型（边沿、脉宽等）\n3. 设置触发电平\n4. 选择触发源\n5. 设置触发耦合方式',
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
    'FFT频谱分析的基本步骤如下：\n\n1. 按 MATH 按钮进入数学运算菜单\n2. 选择 FFT 功能\n3. 选择合适的窗函数（Rectangle、Hanning、Hamming等）\n4. 设置采样率和频率范围\n5. 调整垂直和水平刻度以获得最佳显示效果',
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
    '要使用信号发生器输出任意波形，请按照以下步骤操作：\n\n1. 按前面板的 Wave 按钮\n2. 选择 Arb 波形\n3. 使用PC软件编辑波形\n4. 通过USB传输波形到仪器\n5. 设置波形参数（频率、幅度等）',
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
    '电源过压保护设置步骤：\n\n1. 按 Menu 进入菜单\n2. 选择 Protection 设置\n3. 设置过压保护电压值\n4. 启用过压保护功能\n5. 确认设置并退出',
    'cat_3',
    'model_6',
    'V1.0.0',
    40,
    20,
    datetime('now'),
    datetime('now')
);

-- 4. 为问题添加标签
INSERT OR IGNORE INTO faq_question_tags (question_id, tag_id)
VALUES
    ('q_1', 'tag_6'),  -- 触发条件 - 触发
    ('q_1', 'tag_3'),  -- 触发条件 - 基础操作
    ('q_2', 'tag_7'),  -- FFT - FFT
    ('q_2', 'tag_4'),  -- FFT - 高级功能
    ('q_3', 'tag_2'),  -- 任意波形 - PC软件
    ('q_3', 'tag_3'),  -- 任意波形 - 基础操作
    ('q_4', 'tag_3'),  -- 过压保护 - 基础操作
    ('q_4', 'tag_5');  -- 过压保护 - 故障排除

-- 5. 插入示例答案
INSERT OR IGNORE INTO faq_answers (
    id,
    question_id,
    content,
    software_version,
    likes_count,
    created_at
)
VALUES
(
    'a_1',
    'q_1',
    '补充说明：\n\n1. 边沿触发是最常用的触发方式\n2. 触发电平可以通过触发旋钮快速调节\n3. 可以使用自动触发模式来快速获取波形',
    'V1.0.0',
    20,
    datetime('now')
),
(
    'a_2',
    'q_2',
    '补充说明：\n\n1. 使用FFT时，建议使用Hanning窗\n2. 采样率至少是信号最高频率的2倍\n3. 可以使用光标测量FFT波形',
    'V1.0.0',
    15,
    datetime('now')
),
(
    'a_3',
    'q_3',
    '补充说明：\n\n1. 任意波形最大点数为1M\n2. 可以导入CSV格式的波形数据\n3. 支持波形编辑和数学运算',
    'V1.0.0',
    10,
    datetime('now')
),
(
    'a_4',
    'q_4',
    '补充说明：\n\n1. 过压保护触发后输出自动关闭\n2. 可以设置报警声音提示\n3. 面板OVP指示灯亮起表示保护已触发',
    'V1.0.0',
    8,
    datetime('now')
);

-- 6. 插入点赞记录（需要有用户数据）
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