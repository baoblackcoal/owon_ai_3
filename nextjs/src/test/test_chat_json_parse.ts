import { readFileSync } from 'fs';
import { join } from 'path';
import type { 
  DashScopeResponse, 
  ParsedJsonObject, 
  ParsedStreamData,
  RagObservation,
  DocReference 
} from '../types/chat';

/**
 * 解析流式JSON数据
 * @param dataString 包含 "data:" 前缀的JSON字符串
 * @returns 解析后的JSON对象或null
 */
function parseStreamJson(dataString: string): ParsedJsonObject | null {
  try {
    // 移除 "data:" 前缀
    const jsonString = dataString.replace(/^data:/, '').trim();
    
    if (!jsonString) {
      return null;
    }

    // 尝试解析JSON
    const parsed = JSON.parse(jsonString) as DashScopeResponse;
    return parsed;
  } catch (error) {
    // 如果解析失败，尝试使用更强大的解析方法
    try {
      const fixedJsonString = robustJsonParse(dataString.replace(/^data:/, '').trim());
      if (fixedJsonString) {
        const parsed = JSON.parse(fixedJsonString) as DashScopeResponse;
        return parsed;
      }
    } catch (secondError) {
      console.error('JSON解析错误 (修复后仍失败):', secondError);
    }
    return null;
  }
}

/**
 * 强大的JSON解析方法，处理包含换行符和特殊字符的JSON
 * @param jsonString 原始JSON字符串
 * @returns 修复后的JSON字符串或null
 */
function robustJsonParse(jsonString: string): string | null {
  try {
    // 首先尝试直接解析
    JSON.parse(jsonString);
    return jsonString;
  } catch (error) {
    // 如果失败，尝试修复
    try {
      // 使用正则表达式找到JSON对象的开始和结束
      const match = jsonString.match(/\{[\s\S]*\}/);
      if (match) {
        let fixedJson = match[0];
        
        // 处理字符串中的换行符
        fixedJson = fixedJson.replace(/\\n/g, '\\\\n');
        fixedJson = fixedJson.replace(/\\r/g, '\\\\r');
        fixedJson = fixedJson.replace(/\\t/g, '\\\\t');
        
        // 处理未转义的引号（但保留JSON结构中的引号）
        let inString = false;
        let escaped = false;
        let result = '';
        
        for (let i = 0; i < fixedJson.length; i++) {
          const char = fixedJson[i];
          
          if (escaped) {
            result += char;
            escaped = false;
            continue;
          }
          
          if (char === '\\') {
            escaped = true;
            result += char;
            continue;
          }
          
          if (char === '"') {
            inString = !inString;
            result += char;
            continue;
          }
          
          if (inString && char === '\n') {
            result += '\\n';
          } else if (inString && char === '\r') {
            result += '\\r';
          } else if (inString && char === '\t') {
            result += '\\t';
          } else {
            result += char;
          }
        }
        
        // 验证修复后的JSON是否有效
        JSON.parse(result);
        return result;
      }
    } catch (parseError) {
      console.error('robustJsonParse 失败:', parseError);
    }
    
    return null;
  }
}

/**
 * 解析完整的流式数据字符串
 * @param fullDataString 完整的流式数据字符串
 * @returns 解析后的数据数组
 */
function parseFullStreamData(fullDataString: string): ParsedStreamData[] {
  const lines = fullDataString.split('\n');
  const results: ParsedStreamData[] = [];

  for (const line of lines) {
    const trimmedLine = line.trim();
    if (!trimmedLine || !trimmedLine.startsWith('data:')) {
      continue;
    }

    const parsed = parseStreamJson(trimmedLine);
    if (parsed) {
      results.push({
        type: 'data',
        content: parsed,
        rawData: trimmedLine
      });
    } else {
      results.push({
        type: 'error',
        content: null,
        rawData: trimmedLine
      });
    }
  }

  return results;
}

/**
 * 提取RAG观察数据
 * @param response DashScope响应对象
 * @returns RAG观察数据数组
 */
function extractRagObservations(response: DashScopeResponse): RagObservation[] {
  const observations: RagObservation[] = [];
  
  for (const thought of response.output.thoughts) {
    if (thought.action_type === 'agentRag' && thought.observation) {
      if (typeof thought.observation === 'string') {
        try {
          const parsed = JSON.parse(thought.observation) as RagObservation[];
          observations.push(...parsed);
        } catch (error) {
          console.error('解析RAG观察数据失败:', error);
        }
      } else if (Array.isArray(thought.observation)) {
        observations.push(...thought.observation);
      }
    }
  }
  
  return observations;
}

/**
 * 提取文档引用
 * @param response DashScope响应对象
 * @returns 文档引用数组
 */
function extractDocReferences(response: DashScopeResponse): DocReference[] {
  return response.output.doc_references || [];
}

/**
 * 提取会话ID
 * @param response DashScope响应对象
 * @returns 会话ID
 */
function extractSessionId(response: DashScopeResponse): string {
  return response.output.session_id;
}

/**
 * 提取请求ID
 * @param response DashScope响应对象
 * @returns 请求ID
 */
function extractRequestId(response: DashScopeResponse): string {
  return response.request_id;
}

/**
 * 提取完成原因
 * @param response DashScope响应对象
 * @returns 完成原因
 */
function extractFinishReason(response: DashScopeResponse): string | null {
  return response.output.finish_reason;
}

/**
 * 提取模型使用情况
 * @param response DashScope响应对象
 * @returns 模型使用情况
 */
function extractUsage(response: DashScopeResponse) {
  return response.usage;
}

/**
 * 主测试函数
 */
function runTest() {
  try {
    // 读取测试数据文件
    const filePath = join(__dirname, '../contexts/ChatContext_JsonExample.txt');
    const fileContent = readFileSync(filePath, 'utf-8');
    
    console.log('=== 开始解析流式JSON数据 ===\n');
    
    // 解析所有数据
    const parsedData = parseFullStreamData(fileContent);
    
    console.log(`总共解析了 ${parsedData.length} 条数据\n`);
    
    // 分析每条数据
    for (let i = 0; i < parsedData.length; i++) {
      const data = parsedData[i];
      console.log(`--- 数据 ${i + 1} ---`);
      console.log(`类型: ${data.type}`);
      
      if (data.type === 'data' && data.content) {
        const response = data.content as DashScopeResponse;
        
        console.log(`会话ID: ${extractSessionId(response)}`);
        console.log(`请求ID: ${extractRequestId(response)}`);
        console.log(`完成原因: ${extractFinishReason(response)}`);
        
        // 提取RAG观察数据
        const ragObservations = extractRagObservations(response);
        console.log(`RAG观察数据数量: ${ragObservations.length}`);
        
        if (ragObservations.length > 0) {
          console.log('RAG观察数据示例:');
          ragObservations.slice(0, 2).forEach((obs, index) => {
            console.log(`  ${index + 1}. 内容: ${obs.content.substring(0, 100)}...`);
            console.log(`     数据ID: ${obs.dataId}`);
            console.log(`     分数: ${obs.score}`);
          });
        }
        
        // 提取文档引用
        const docReferences = extractDocReferences(response);
        console.log(`文档引用数量: ${docReferences.length}`);
        
        if (docReferences.length > 0) {
          console.log('文档引用示例:');
          docReferences.slice(0, 2).forEach((ref, index) => {
            console.log(`  ${index + 1}. 文档名: ${ref.doc_name}`);
            console.log(`     索引ID: ${ref.index_id}`);
            console.log(`     内容: ${ref.text.substring(0, 100)}...`);
          });
        }
        
        // 提取使用情况
        const usage = extractUsage(response);
        console.log('模型使用情况:');
        usage.models.forEach((model, index) => {
          console.log(`  模型 ${index + 1}: ${model.model_id}`);
          console.log(`    输入tokens: ${model.input_tokens}`);
          console.log(`    输出tokens: ${model.output_tokens}`);
        });
        
      } else {
        console.log('解析失败或数据为空');
      }
      
      console.log('\n');
    }
    
    // 统计信息
    const successfulParses = parsedData.filter(d => d.type === 'data' && d.content).length;
    const failedParses = parsedData.filter(d => d.type === 'error').length;
    
    console.log('=== 统计信息 ===');
    console.log(`成功解析: ${successfulParses} 条`);
    console.log(`解析失败: ${failedParses} 条`);
    console.log(`成功率: ${((successfulParses / parsedData.length) * 100).toFixed(2)}%`);
    
  } catch (error) {
    console.error('测试执行失败:', error);
  }
}

// 如果直接运行此文件，执行测试
if (require.main === module) {
  runTest();
}

export {
  parseStreamJson,
  parseFullStreamData,
  extractRagObservations,
  extractDocReferences,
  extractSessionId,
  extractRequestId,
  extractFinishReason,
  extractUsage,
  runTest
};
