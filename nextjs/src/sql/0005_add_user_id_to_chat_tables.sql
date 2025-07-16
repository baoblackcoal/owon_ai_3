-- 为Chat表添加user_id字段
ALTER TABLE Chat ADD COLUMN user_id TEXT;

-- 为ChatMessage表添加user_id字段
ALTER TABLE ChatMessage ADD COLUMN user_id TEXT;

-- 创建索引以优化查询性能
CREATE INDEX idx_chat_user_id ON Chat(user_id);
CREATE INDEX idx_chat_user_id_updated_at ON Chat(user_id, updatedAt DESC);
CREATE INDEX idx_chat_message_user_id ON ChatMessage(user_id);
CREATE INDEX idx_chat_message_user_id_chat_id ON ChatMessage(user_id, chatId);

-- 注意：现有的聊天记录user_id将为NULL，需要在应用层处理历史数据归属 