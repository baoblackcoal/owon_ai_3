-- FAQ 一问一答迁移脚本 (2025-07-25)
-- 将 faq_answers 表的数据合并到 faq_questions.answer 字段，并删除多余的表结构

-- 1. 将 faq_answers 的内容迁移到 faq_questions.answer 字段
-- 注意：这里假设每个问题只有一个答案，如果有多个答案，会取第一个
UPDATE faq_questions 
SET answer = (
    SELECT content 
    FROM faq_answers 
    WHERE faq_answers.question_id = faq_questions.id 
    ORDER BY faq_answers.created_at ASC 
    LIMIT 1
);

-- 2. 将所有answer为NULL的问题设置默认答案
UPDATE faq_questions 
SET answer = '暂无答案，请联系技术支持。'
WHERE answer IS NULL;

-- 3. 清理 faq_likes 表，删除对答案的点赞记录
DELETE FROM faq_likes WHERE answer_id IS NOT NULL;

-- 4. 重建 faq_likes 表，只保留对问题的点赞
CREATE TABLE faq_likes_new (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    user_id TEXT NOT NULL REFERENCES User(id) ON DELETE CASCADE,
    question_id TEXT NOT NULL REFERENCES faq_questions(id) ON DELETE CASCADE,
    created_at TEXT DEFAULT (strftime('%Y-%m-%d %H:%M:%S', 'now', 'localtime')) NOT NULL,
    UNIQUE (user_id, question_id)
);

-- 复制仍然有效的点赞记录
INSERT INTO faq_likes_new (id, user_id, question_id, created_at)
SELECT id, user_id, question_id, created_at
FROM faq_likes 
WHERE question_id IS NOT NULL;

-- 删除旧表并重命名
DROP TABLE faq_likes;
ALTER TABLE faq_likes_new RENAME TO faq_likes;

-- 重建索引
CREATE INDEX IF NOT EXISTS idx_faq_likes_user_id ON faq_likes(user_id);
CREATE INDEX IF NOT EXISTS idx_faq_likes_question_id ON faq_likes(question_id);

-- 5. 删除不再需要的 faq_answers 表
DROP TABLE IF EXISTS faq_answers;

-- 删除相关索引（如果存在）
DROP INDEX IF EXISTS idx_faq_answers_question_id;
DROP INDEX IF EXISTS idx_faq_answers_created_at; 