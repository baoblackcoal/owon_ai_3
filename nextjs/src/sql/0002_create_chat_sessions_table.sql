CREATE TABLE Chat (
    id TEXT PRIMARY KEY NOT NULL, -- 聊天会话ID
    chatId TEXT UNIQUE, -- 聊天ID
    title TEXT NOT NULL, -- 对话标题（根据第一条消息生成）
    createdAt TEXT DEFAULT (strftime('%Y-%m-%d %H:%M:%S', 'now')) NOT NULL, -- 创建时间
    updatedAt TEXT DEFAULT (strftime('%Y-%m-%d %H:%M:%S', 'now')) NOT NULL, -- 更新时间
    messageCount INTEGER DEFAULT 0 NOT NULL -- 消息数量
);

-- 创建索引以优化查询性能
CREATE INDEX idx_chat_updated_at ON Chat(updatedAt DESC);
CREATE INDEX idx_chat_chat_id ON Chat(chatId); 