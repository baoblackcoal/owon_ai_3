-- 为用户表添加管理员角色支持
-- 添加 role 字段：user（默认）/ admin / guest  
ALTER TABLE User ADD COLUMN role TEXT NOT NULL DEFAULT 'user';

-- 添加 requires_password_change 字段：1=必须修改密码，0=正常状态
ALTER TABLE User ADD COLUMN requires_password_change INTEGER NOT NULL DEFAULT 0;

-- 创建索引以优化角色查询
CREATE INDEX idx_user_role ON User(role);
CREATE INDEX idx_user_requires_password_change ON User(requires_password_change);

-- 插入初始管理员账户
-- 密码: admin (使用bcrypt加密，12轮salt)
-- 密码哈希值: $2a$12$PQK6MEos5o4rvg6vtlfuvuUYYNM45UeuVCfIlEfxvoIv68WfWFUM.
INSERT INTO User (
    id, 
    email, 
    password_hash, 
    is_guest, 
    role, 
    requires_password_change,
    created_at,
    updated_at
) VALUES (
    'admin',
    NULL,
    '$2a$12$PQK6MEos5o4rvg6vtlfuvuUYYNM45UeuVCfIlEfxvoIv68WfWFUM.',
    0,
    'admin',
    1,
    strftime('%Y-%m-%d %H:%M:%S', 'now'),
    strftime('%Y-%m-%d %H:%M:%S', 'now')
); 