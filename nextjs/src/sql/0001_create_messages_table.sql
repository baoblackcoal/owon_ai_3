CREATE TABLE ChatMessage (
    id TEXT PRIMARY KEY NOT NULL, -- 消息ID
    dashscopeSessionId TEXT NOT NULL, -- DashScope会话ID
    chatId TEXT NOT NULL, -- 聊天ID, 用于关联聊天记录, 关联Chat表的id
    role TEXT NOT NULL, -- 角色：user、assistant
    userPrompt TEXT NOT NULL, -- 用户输入内容
    aiResponse TEXT NOT NULL, -- AI回复内容
    previousMessageId TEXT, -- 前一个消息ID
    timestamp TEXT DEFAULT (strftime('%Y-%m-%d %H:%M:%S', 'now')) NOT NULL -- 时间戳
);