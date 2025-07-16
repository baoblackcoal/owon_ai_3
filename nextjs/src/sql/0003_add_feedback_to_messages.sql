-- 为ChatMessage表添加feedback字段
-- feedback: 1=like, -1=dislike, NULL=no feedback
ALTER TABLE ChatMessage ADD COLUMN feedback INTEGER DEFAULT NULL;

-- 创建索引以优化feedback查询
CREATE INDEX idx_chat_message_feedback ON ChatMessage(feedback); 