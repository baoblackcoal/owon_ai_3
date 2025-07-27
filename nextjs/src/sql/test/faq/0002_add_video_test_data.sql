-- 为 FAQ 视频功能准备示例数据
-- 更新部分问题添加视频BVID

-- 为第一个问题添加触发设置相关视频
UPDATE faq_questions
SET video_bilibili_bvid = 'BV1nL8NzkEyx', -- 示例BVID
    has_video = 1
WHERE id = 'q_1';

-- 为第二个问题添加FFT操作相关视频
UPDATE faq_questions  
SET video_bilibili_bvid = 'BV1ab4y1Q7rF', -- 示例BVID
    has_video = 1
WHERE id = 'q_2';

-- 第三个问题保持无视频状态，用于测试筛选功能
-- 第四个问题也保持无视频状态 