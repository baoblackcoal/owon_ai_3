-- 创建 FAQ 相关数据表（一问一答模型）

-- 1. faq_categories
CREATE TABLE IF NOT EXISTS faq_categories (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    created_at TEXT DEFAULT (strftime('%Y-%m-%d %H:%M:%S', 'now', 'localtime')) NOT NULL
);

-- 2. faq_product_models
CREATE TABLE IF NOT EXISTS faq_product_models (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    category_id TEXT REFERENCES faq_categories(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    created_at TEXT DEFAULT (strftime('%Y-%m-%d %H:%M:%S', 'now', 'localtime')) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_faq_product_models_category_id ON faq_product_models(category_id);

-- 3. faq_tags
CREATE TABLE IF NOT EXISTS faq_tags (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    name TEXT NOT NULL UNIQUE,
    created_at TEXT DEFAULT (strftime('%Y-%m-%d %H:%M:%S', 'now', 'localtime')) NOT NULL
);

-- 4. faq_questions (一问一答模型)
CREATE TABLE IF NOT EXISTS faq_questions (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    title TEXT NOT NULL,                 -- 问题标题
    content TEXT NOT NULL,               -- 问题描述 (Markdown)
    answer TEXT NOT NULL,                -- 答案 (Markdown)
    category_id TEXT REFERENCES faq_categories(id) ON DELETE SET NULL,
    product_model_id TEXT REFERENCES faq_product_models(id) ON DELETE SET NULL,
    software_version TEXT,
    views_count INTEGER NOT NULL DEFAULT 0,
    likes_count INTEGER NOT NULL DEFAULT 0,
    created_by TEXT REFERENCES User(id) ON DELETE SET NULL,
    created_at TEXT DEFAULT (strftime('%Y-%m-%d %H:%M:%S', 'now', 'localtime')) NOT NULL,
    updated_at TEXT DEFAULT (strftime('%Y-%m-%d %H:%M:%S', 'now', 'localtime')) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_faq_questions_category_id ON faq_questions(category_id);
CREATE INDEX IF NOT EXISTS idx_faq_questions_product_model_id ON faq_questions(product_model_id);
CREATE INDEX IF NOT EXISTS idx_faq_questions_created_at ON faq_questions(created_at DESC);

-- 5. faq_question_tags (多对多关联)
CREATE TABLE IF NOT EXISTS faq_question_tags (
    question_id TEXT NOT NULL REFERENCES faq_questions(id) ON DELETE CASCADE,
    tag_id TEXT NOT NULL REFERENCES faq_tags(id) ON DELETE CASCADE,
    PRIMARY KEY (question_id, tag_id)
);

-- 6. faq_likes (仅对问题点赞)
CREATE TABLE IF NOT EXISTS faq_likes (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    user_id TEXT NOT NULL REFERENCES User(id) ON DELETE CASCADE,
    question_id TEXT NOT NULL REFERENCES faq_questions(id) ON DELETE CASCADE,
    created_at TEXT DEFAULT (strftime('%Y-%m-%d %H:%M:%S', 'now', 'localtime')) NOT NULL,
    UNIQUE (user_id, question_id)
);

CREATE INDEX IF NOT EXISTS idx_faq_likes_user_id ON faq_likes(user_id);
CREATE INDEX IF NOT EXISTS idx_faq_likes_question_id ON faq_likes(question_id); 