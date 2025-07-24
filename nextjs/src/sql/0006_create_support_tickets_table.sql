-- 创建支持工单表
CREATE TABLE IF NOT EXISTS support_tickets (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    user_id TEXT NULL,                    -- 关联用户ID，如果用户已登录
    company TEXT NULL,                    -- 公司名称（选填）
    last_name TEXT NOT NULL,              -- 姓氏（必填）
    email TEXT NOT NULL,                  -- 邮箱（必填）
    device_type TEXT NOT NULL,            -- 设备类型（必填）
    device_series TEXT NOT NULL,          -- 设备系列（必填）
    software_version TEXT NOT NULL,       -- 软件版本号（必填）
    instrument_model TEXT NOT NULL,       -- 仪器型号（必填）
    detail TEXT NOT NULL,                 -- 问题详情（必填）
    processed INTEGER NOT NULL DEFAULT 0, -- 0=未处理, 1=已处理
    created_at TEXT DEFAULT (strftime('%Y-%m-%d %H:%M:%S', 'now', 'localtime')) NOT NULL
);

-- 创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_support_tickets_user_id ON support_tickets(user_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_email ON support_tickets(email);
CREATE INDEX IF NOT EXISTS idx_support_tickets_created_at ON support_tickets(created_at); 