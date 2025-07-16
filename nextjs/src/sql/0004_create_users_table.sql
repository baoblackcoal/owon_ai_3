-- 创建用户表
CREATE TABLE User (
    id TEXT PRIMARY KEY NOT NULL, -- 用户ID (UUID)
    email TEXT UNIQUE, -- 邮箱地址，游客账号为NULL
    password_hash TEXT, -- 密码哈希，游客账号为NULL
    is_guest INTEGER DEFAULT 1 NOT NULL, -- 是否为游客账号：1=游客，0=正式用户
    chat_count INTEGER DEFAULT 0 NOT NULL, -- 当日聊天次数
    last_chat_date TEXT, -- 最后聊天日期 (YYYY-MM-DD)
    created_at TEXT DEFAULT (strftime('%Y-%m-%d %H:%M:%S', 'now')) NOT NULL, -- 创建时间
    updated_at TEXT DEFAULT (strftime('%Y-%m-%d %H:%M:%S', 'now')) NOT NULL -- 更新时间
);

-- 创建索引以优化查询性能
CREATE INDEX idx_user_email ON User(email);
CREATE INDEX idx_user_last_chat_date ON User(last_chat_date);
CREATE INDEX idx_user_is_guest ON User(is_guest);
CREATE INDEX idx_user_created_at ON User(created_at DESC); 