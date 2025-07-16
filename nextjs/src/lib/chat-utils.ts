import { ParsedJsonObject } from '@/types/chat';

export function parseConcatenatedJson(jsonString: string): ParsedJsonObject[] {
  const jsonObjects: ParsedJsonObject[] = [];
  let currentJson = '';
  let braceCount = 0;

  for (let i = 0; i < jsonString.length; i++) {
    const char = jsonString[i];
    currentJson += char;

    if (char === '{') {
      braceCount++;
    } else if (char === '}') {
      braceCount--;
      
      if (braceCount === 0) {
        try {
          const parsedObject = JSON.parse(currentJson) as ParsedJsonObject;
          jsonObjects.push(parsedObject);
          currentJson = '';
        } catch (e) {
          console.error('JSON解析错误:', e);
        }
      }
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
  } catch (error) {
    console.error('更新反馈失败:', error);
    throw error;
  }
} 