-- FAQ 视频支持：为问题表增加 Bilibili BVID 字段
-- 迁移脚本 0008

-- 为 faq_questions 表添加视频相关字段
ALTER TABLE faq_questions ADD COLUMN video_bilibili_bvid TEXT; -- Bilibili Video ID (BVID)
ALTER TABLE faq_questions ADD COLUMN has_video INTEGER DEFAULT 0; -- 是否有视频的冗余字段，用于快速筛选

-- 创建索引以提升查询性能
CREATE INDEX IF NOT EXISTS idx_faq_questions_has_video ON faq_questions(has_video);

-- 更新现有数据的has_video字段（当video_bilibili_bvid非空时设为1）
UPDATE faq_questions 
SET has_video = CASE 
    WHEN video_bilibili_bvid IS NOT NULL AND video_bilibili_bvid != '' THEN 1 
    ELSE 0 
END; 