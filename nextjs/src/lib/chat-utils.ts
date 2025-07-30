import { ParsedJsonObject } from '@/types/chat';

/**
 * 解析由多个JSON对象拼接而成的字符串流。
 * 这个函数经过优化，可以处理包含嵌套括号和字符串中包含括号的复杂JSON对象。
 * @param jsonString - 包含一个或多个JSON对象的字符串。
 * @returns 解析后的JSON对象数组。
 */
export function parseConcatenatedJson(jsonString: string): ParsedJsonObject[] {
  const jsonObjects: ParsedJsonObject[] = [];
  let lastIndex = 0;

  // 移除可能存在于JSON对象之间的任何前导/尾随空白或换行符
  jsonString = jsonString.trim();

  while (lastIndex < jsonString.length) {
    const nextBrace = jsonString.indexOf('{', lastIndex);
    if (nextBrace === -1) {
      break; // 没有更多的JSON对象了
    }

    let braceCount = 0;
    let currentIndex = nextBrace;
    let inString = false;
    let inEscape = false;

    // 寻找匹配的结束括号
    while (currentIndex < jsonString.length) {
      const char = jsonString[currentIndex];

      if (inString) {
        if (inEscape) {
          inEscape = false;
        } else if (char === '\\') {
          inEscape = true;
        } else if (char === '"') {
          inString = false;
        }
      } else {
        if (char === '"') {
          inString = true;
        } else if (char === '{') {
          braceCount++;
        } else if (char === '}') {
          braceCount--;
        }
      }

      if (braceCount === 0 && !inString) {
        const jsonChunk = jsonString.substring(nextBrace, currentIndex + 1);
        try {
          const parsedObject = JSON.parse(jsonChunk) as ParsedJsonObject;
          jsonObjects.push(parsedObject);
        } catch (e) {
          // 忽略解析错误，这可能是因为流尚未完成
          // console.error('JSON解析错误（已忽略）:', e, 'Chunk:', jsonChunk);
        }
        lastIndex = currentIndex + 1;
        break; // 继续寻找下一个JSON对象
      }
      
      currentIndex++;
    }

    // 如果循环结束但没有找到匹配的括号，则退出
    if (braceCount !== 0) {
      break;
    }
  }

  return jsonObjects;
}


export async function fetchChatHistory(chatId: string) {
  try {
    const response = await fetch(`/api/chat/${chatId}`);
    if (!response.ok) throw new Error('加载对话失败');

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('加载历史对话失败:', error);
    throw error;
  }
}

export async function updateMessageFeedback(messageId: string, feedback: 'like' | 'dislike' | null) {
  try {
    const response = await fetch(`/api/chat/message/${messageId}/feedback`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        type: feedback === null ? 'cancel' : feedback 
      }),
    });

    if (!response.ok) {
      throw new Error('更新反馈失败');
    }
  }
  catch (error) {
    console.error('更新反馈失败:', error);
    throw error;
  }
} 