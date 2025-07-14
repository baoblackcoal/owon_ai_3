CREATE TABLE ChatMessage (
    id TEXT PRIMARY KEY NOT NULL, -- 消息ID
    chatId TEXT NOT NULL, -- 聊天ID, 用于关联聊天记录, 关联Chat表的id
    messageIndex INTEGER NOT NULL, -- 消息索引, 用于排序, 从0开始，同一个chatId中，每增加一条消息，messageIndex加1
    role TEXT NOT NULL, -- 角色：user、assistant
    userPrompt TEXT NOT NULL, -- 用户输入内容
    aiResponse TEXT NOT NULL, -- AI回复内容
    dashscopeSessionId TEXT, -- DashScope会话ID，用于多轮对话上下文
    timestamp TEXT DEFAULT (strftime('%Y-%m-%d %H:%M:%S', 'now')) NOT NULL -- 时间戳
);