-- FAQ 测试数据插入

-- 1. 产品型号已存在的分类不需要重复插入
INSERT OR IGNORE INTO faq_product_models (category_id, name) 
SELECT id, 'ADS800A' FROM faq_categories WHERE name = '示波器';

INSERT OR IGNORE INTO faq_product_models (category_id, name) 
SELECT id, 'ADS900A' FROM faq_categories WHERE name = '示波器';

INSERT OR IGNORE INTO faq_product_models (category_id, name) 
SELECT id, 'ADS3000' FROM faq_categories WHERE name = '示波器';

INSERT OR IGNORE INTO faq_product_models (category_id, name) 
SELECT id, 'AG1000' FROM faq_categories WHERE name = '信号发生器';

INSERT OR IGNORE INTO faq_product_models (category_id, name) 
SELECT id, 'AG2000' FROM faq_categories WHERE name = '信号发生器';

INSERT OR IGNORE INTO faq_product_models (category_id, name) 
SELECT id, 'PDM3000' FROM faq_categories WHERE name = '电源';

-- 2. 插入新标签（已存在的标签不重复插入）
INSERT OR IGNORE INTO faq_tags (name) VALUES
    ('固件升级'),
    ('PC软件'),
    ('基础操作'),
    ('高级功能'),
    ('故障排除'),
    ('触发'),
    ('FFT');

-- 3. 插入示例问题
INSERT OR IGNORE INTO faq_questions (
    title, 
    content,
    category_id,
    product_model_id,
    software_version,
    views_count,
    likes_count
)
SELECT 
    '如何设置示波器的触发条件？',
    '要设置示波器的触发条件，请按照以下步骤操作：\n\n1. 按前面板的 TRIGGER 按钮\n2. 选择触发类型（边沿、脉宽等）\n3. 设置触发电平\n4. 选择触发源\n5. 设置触发耦合方式',
    c.id,
    m.id,
    'V1.0.0',
    100,
    50
FROM faq_categories c
JOIN faq_product_models m ON c.id = m.category_id
WHERE c.name = '示波器' AND m.name = 'ADS800A';

INSERT OR IGNORE INTO faq_questions (
    title, 
    content,
    category_id,
    product_model_id,
    software_version,
    views_count,
    likes_count
)
SELECT 
    'FFT 频谱分析的基本操作步骤是什么？',
    'FFT频谱分析的基本步骤如下：\n\n1. 按 MATH 按钮进入数学运算菜单\n2. 选择 FFT 功能\n3. 选择合适的窗函数（Rectangle、Hanning、Hamming等）\n4. 设置采样率和频率范围\n5. 调整垂直和水平刻度以获得最佳显示效果',
    c.id,
    m.id,
    'V1.0.0',
    80,
    30
FROM faq_categories c
JOIN faq_product_models m ON c.id = m.category_id
WHERE c.name = '示波器' AND m.name = 'ADS900A';

-- 4. 为问题添加标签
INSERT OR IGNORE INTO faq_question_tags (question_id, tag_id)
SELECT q.id, t.id
FROM faq_questions q, faq_tags t
WHERE q.title LIKE '%触发条件%' AND t.name = '触发';

INSERT OR IGNORE INTO faq_question_tags (question_id, tag_id)
SELECT q.id, t.id
FROM faq_questions q, faq_tags t
WHERE q.title LIKE '%触发条件%' AND t.name = '基础操作';

INSERT OR IGNORE INTO faq_question_tags (question_id, tag_id)
SELECT q.id, t.id
FROM faq_questions q, faq_tags t
WHERE q.title LIKE '%FFT%' AND t.name = 'FFT';

INSERT OR IGNORE INTO faq_question_tags (question_id, tag_id)
SELECT q.id, t.id
FROM faq_questions q, faq_tags t
WHERE q.title LIKE '%FFT%' AND t.name = '高级功能';

-- 5. 插入示例答案
INSERT OR IGNORE INTO faq_answers (
    question_id,
    content,
    software_version,
    likes_count
)
SELECT 
    q.id,
    '补充说明：\n\n1. 边沿触发是最常用的触发方式\n2. 触发电平可以通过触发旋钮快速调节\n3. 可以使用自动触发模式来快速获取波形',
    'V1.0.0',
    20
FROM faq_questions q
WHERE q.title LIKE '%触发条件%';

INSERT OR IGNORE INTO faq_answers (
    question_id,
    content,
    software_version,
    likes_count
)
SELECT 
    q.id,
    '补充说明：\n\n1. 使用FFT时，建议使用Hanning窗\n2. 采样率至少是信号最高频率的2倍\n3. 可以使用光标测量FFT波形',
    'V1.0.0',
    15
FROM faq_questions q
WHERE q.title LIKE '%FFT%';

-- 6. 插入一些示例点赞记录（需要有用户数据）
INSERT OR IGNORE INTO faq_likes (user_id, question_id)
SELECT 
    (SELECT id FROM User WHERE email = 'baojianbin@owoncn.com'),
    q.id
FROM faq_questions q
WHERE q.title LIKE '%触发条件%'; 

-- 3. 插入新的示例问题
INSERT OR IGNORE INTO faq_questions (
    title, 
    content,
    category_id,
    product_model_id,
    software_version,
    views_count,
    likes_count
)
SELECT 
    '如何使用信号发生器输出任意波形？',
    '要使用信号发生器输出任意波形，请按照以下步骤操作：\n\n1. 按前面板的 Wave 按钮\n2. 选择 Arb 波形\n3. 使用PC软件编辑波形\n4. 通过USB传输波形到仪器\n5. 设置波形参数（频率、幅度等）',
    c.id,
    m.id,
    'V1.0.0',
    60,
    25
FROM faq_categories c
JOIN faq_product_models m ON c.id = m.category_id
WHERE c.name = '信号发生器' AND m.name = 'AG1000';

INSERT OR IGNORE INTO faq_questions (
    title, 
    content,
    category_id,
    product_model_id,
    software_version,
    views_count,
    likes_count
)
SELECT 
    '电源过压保护功能如何设置？',
    '电源过压保护设置步骤：\n\n1. 按 Menu 进入菜单\n2. 选择 Protection 设置\n3. 设置过压保护电压值\n4. 启用过压保护功能\n5. 确认设置并退出',
    c.id,
    m.id,
    'V1.0.0',
    40,
    20
FROM faq_categories c
JOIN faq_product_models m ON c.id = m.category_id
WHERE c.name = '电源' AND m.name = 'PDM3000';

-- 4. 为新问题添加标签
INSERT OR IGNORE INTO faq_question_tags (question_id, tag_id)
SELECT q.id, t.id
FROM faq_questions q, faq_tags t
WHERE q.title LIKE '%任意波形%' AND t.name = 'PC软件';

INSERT OR IGNORE INTO faq_question_tags (question_id, tag_id)
SELECT q.id, t.id
FROM faq_questions q, faq_tags t
WHERE q.title LIKE '%任意波形%' AND t.name = '基础操作';

INSERT OR IGNORE INTO faq_question_tags (question_id, tag_id)
SELECT q.id, t.id
FROM faq_questions q, faq_tags t
WHERE q.title LIKE '%过压保护%' AND t.name = '基础操作';

INSERT OR IGNORE INTO faq_question_tags (question_id, tag_id)
SELECT q.id, t.id
FROM faq_questions q, faq_tags t
WHERE q.title LIKE '%过压保护%' AND t.name = '故障排除';

-- 5. 插入新问题的答案
INSERT OR IGNORE INTO faq_answers (
    question_id,
    content,
    software_version,
    likes_count
)
SELECT 
    q.id,
    '补充说明：\n\n1. 任意波形最大点数为1M\n2. 可以导入CSV格式的波形数据\n3. 支持波形编辑和数学运算',
    'V1.0.0',
    10
FROM faq_questions q
WHERE q.title LIKE '%任意波形%';

INSERT OR IGNORE INTO faq_answers (
    question_id,
    content,
    software_version,
    likes_count
)
SELECT 
    q.id,
    '补充说明：\n\n1. 过压保护触发后输出自动关闭\n2. 可以设置报警声音提示\n3. 面板OVP指示灯亮起表示保护已触发',
    'V1.0.0',
    8
FROM faq_questions q
WHERE q.title LIKE '%过压保护%';

-- 6. 插入新问题的点赞记录
INSERT OR IGNORE INTO faq_likes (user_id, question_id)
SELECT 
    (SELECT id FROM User WHERE email = 'baojianbin@owoncn.com'),
    q.id
FROM faq_questions q
WHERE q.title LIKE '%任意波形%'; 