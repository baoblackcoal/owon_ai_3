import type { 
  FaqCsvRow, 
  FaqImportError, 
  FaqImportResult,
  FaqCsvTemplate
} from '@/types/faq';

// Cloudflare D1 数据库接口类型
interface D1Database {
  prepare(query: string): D1PreparedStatement;
}

interface D1PreparedStatement {
  bind(...values: unknown[]): D1PreparedStatement;
  first(): Promise<Record<string, unknown> | null>;
  all(): Promise<{ results: Record<string, unknown>[] }>;
  run(): Promise<{ success: boolean }>;
}

/**
 * 解析CSV内容为对象数组
 */
export function parseCsvContent(csvContent: string): { data: FaqCsvRow[]; errors: FaqImportError[] } {
  const lines = parseCSVLines(csvContent.trim());
  const errors: FaqImportError[] = [];
  const data: FaqCsvRow[] = [];

  if (lines.length < 2) {
    errors.push({
      row: 1,
      message: 'CSV文件至少需要包含表头和一行数据'
    });
    return { data, errors };
  }

  // 解析表头
  const headers = parseCSVLine(lines[0]);
  const expectedHeaders = ['title', 'content_md', 'answer_md', 'category', 'product_model', 'tags', 'software_version', 'bilibili_bvid'];
  
  // 检查必需的列
  const requiredHeaders = ['title', 'content_md', 'answer_md', 'category'];
  const missingHeaders = requiredHeaders.filter(header => !headers.includes(header));
  
  if (missingHeaders.length > 0) {
    errors.push({
      row: 1,
      message: `缺少必需的列: ${missingHeaders.join(', ')}`
    });
    return { data, errors };
  }

  // 解析数据行
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue; // 跳过空行

    try {
      const values = parseCSVLine(line);
      if (values.length === 0) continue;

      const rowData: Partial<FaqCsvRow> = {};
      
      // 映射列值
              headers.forEach((header, index) => {
          if (expectedHeaders.includes(header)) {
            const value = values[index]?.trim() || '';
            (rowData as Record<string, string>)[header] = value;
          }
        });

      // 验证必需字段
      const rowErrors = validateCsvRow(rowData as FaqCsvRow, i + 1);
      if (rowErrors.length > 0) {
        errors.push(...rowErrors);
      } else {
        data.push(rowData as FaqCsvRow);
      }
    } catch (error) {
      errors.push({
        row: i + 1,
        message: `解析CSV行时出错: ${error instanceof Error ? error.message : '未知错误'}`
      });
    }
  }

  return { data, errors };
}

/**
 * 解析CSV内容为行数组（正确处理引号内的换行符）
 */
function parseCSVLines(csvContent: string): string[] {
  const lines: string[] = [];
  let currentLine = '';
  let inQuotes = false;
  
  for (let i = 0; i < csvContent.length; i++) {
    const char = csvContent[i];
    
    if (char === '"') {
      if (inQuotes && csvContent[i + 1] === '"') {
        // 转义的引号
        currentLine += '""';
        i++;
      } else {
        // 切换引号状态
        inQuotes = !inQuotes;
        currentLine += char;
      }
    } else if (char === '\n' && !inQuotes) {
      // 行结束（不在引号内）
      if (currentLine.trim()) {
        lines.push(currentLine);
      }
      currentLine = '';
    } else if (char === '\r' && !inQuotes && csvContent[i + 1] === '\n') {
      // Windows风格的换行符
      if (currentLine.trim()) {
        lines.push(currentLine);
      }
      currentLine = '';
      i++; // 跳过\n
    } else {
      currentLine += char;
    }
  }
  
  // 添加最后一行
  if (currentLine.trim()) {
    lines.push(currentLine);
  }
  
  return lines;
}

/**
 * 解析单行CSV（处理引号和逗号）
 */
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        // 转义的引号
        current += '"';
        i++;
      } else {
        // 切换引号状态
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      // 字段分隔符
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  
  result.push(current);
  return result;
}

/**
 * 验证CSV行数据
 */
export function validateCsvRow(row: FaqCsvRow, rowNumber: number): FaqImportError[] {
  const errors: FaqImportError[] = [];

  // 验证必需字段
  if (!row.title?.trim()) {
    errors.push({
      row: rowNumber,
      field: 'title',
      message: '标题不能为空',
      data: row
    });
  } else if (row.title.length > 200) {
    errors.push({
      row: rowNumber,
      field: 'title',
      message: '标题长度不能超过200个字符',
      data: row
    });
  }

  if (!row.content_md?.trim()) {
    errors.push({
      row: rowNumber,
      field: 'content_md',
      message: '问题内容不能为空',
      data: row
    });
  }

  if (!row.answer_md?.trim()) {
    errors.push({
      row: rowNumber,
      field: 'answer_md',
      message: '答案内容不能为空',
      data: row
    });
  }

  if (!row.category?.trim()) {
    errors.push({
      row: rowNumber,
      field: 'category',
      message: '分类不能为空',
      data: row
    });
  } else if (row.category.length > 50) {
    errors.push({
      row: rowNumber,
      field: 'category',
      message: '分类名称长度不能超过50个字符',
      data: row
    });
  }

  // 验证可选字段
  if (row.product_model && row.product_model.length > 100) {
    errors.push({
      row: rowNumber,
      field: 'product_model',
      message: '产品型号长度不能超过100个字符',
      data: row
    });
  }

  if (row.software_version && row.software_version.length > 50) {
    errors.push({
      row: rowNumber,
      field: 'software_version',
      message: '软件版本长度不能超过50个字符',
      data: row
    });
  }

  // 验证Bilibili BVID格式
  if (row.bilibili_bvid?.trim()) {
    const bvidPattern = /^BV[A-Za-z0-9]{10}$/;
    if (!bvidPattern.test(row.bilibili_bvid.trim())) {
      errors.push({
        row: rowNumber,
        field: 'bilibili_bvid',
        message: 'Bilibili BVID格式不正确，应为BV开头的12位字符',
        data: row
      });
    }
  }

  // 验证标签格式
  if (row.tags?.trim()) {
    const tags = row.tags.split(',').map(tag => tag.trim()).filter(tag => tag);
    for (const tag of tags) {
      if (tag.length > 30) {
        errors.push({
          row: rowNumber,
          field: 'tags',
          message: `标签"${tag}"长度不能超过30个字符`,
          data: row
        });
      }
    }
  }

  return errors;
}

/**
 * 查找或创建分类
 */
export async function findOrCreateCategory(
  db: D1Database,
  categoryName: string
): Promise<{ id: string; isNew: boolean }> {
  // 首先尝试查找现有分类
  const existingCategory = await db
    .prepare('SELECT id FROM faq_categories WHERE name = ?')
    .bind(categoryName.trim())
    .first();

  if (existingCategory) {
    return { id: existingCategory.id as string, isNew: false };
  }

  // 创建新分类
  const categoryId = generateId();
  await db
    .prepare('INSERT INTO faq_categories (id, name) VALUES (?, ?)')
    .bind(categoryId, categoryName.trim())
    .run();

  return { id: categoryId, isNew: true };
}

/**
 * 查找或创建产品型号
 */
export async function findOrCreateProductModel(
  db: D1Database,
  productModelName: string,
  categoryId: string
): Promise<{ id: string; isNew: boolean }> {
  // 首先尝试查找现有产品型号
  const existing = await db
    .prepare('SELECT id FROM faq_product_models WHERE name = ?')
    .bind(productModelName.trim())
    .first();

  if (existing) {
    return { id: existing.id as string, isNew: false };
  }

  // 创建新产品型号
  const modelId = generateId();
  await db
    .prepare('INSERT INTO faq_product_models (id, category_id, name) VALUES (?, ?, ?)')
    .bind(modelId, categoryId, productModelName.trim())
    .run();

  return { id: modelId, isNew: true };
}

/**
 * 查找或创建标签
 */
export async function findOrCreateTag(
  db: D1Database,
  tagName: string
): Promise<{ id: string; isNew: boolean }> {
  const trimmedTagName = tagName.trim();
  
  // 首先尝试查找现有标签
  const existing = await db
    .prepare('SELECT id FROM faq_tags WHERE name = ?')
    .bind(trimmedTagName)
    .first();

  if (existing) {
    return { id: existing.id as string, isNew: false };
  }

  // 创建新标签
  const tagId = generateId();
  await db
    .prepare('INSERT INTO faq_tags (id, name) VALUES (?, ?)')
    .bind(tagId, trimmedTagName)
    .run();

  return { id: tagId, isNew: true };
}

/**
 * 检查问题是否已存在（基于标题）
 */
export async function findExistingQuestion(
  db: D1Database,
  title: string
): Promise<{ id: string } | null> {
  const existing = await db
    .prepare('SELECT id FROM faq_questions WHERE title = ?')
    .bind(title.trim())
    .first();

  return existing ? { id: existing.id as string } : null;
}

/**
 * 创建FAQ问题
 */
export async function createFaqQuestion(
  db: D1Database,
  data: FaqCsvRow,
  categoryId: string,
  productModelId?: string,
  createdBy?: string
): Promise<string> {
  const questionId = generateId();
  const hasVideo = data.bilibili_bvid?.trim() ? 1 : 0;

  await db
    .prepare(`
      INSERT INTO faq_questions (
        id, title, content, answer, category_id, product_model_id, 
        software_version, video_bilibili_bvid, has_video, created_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)
    .bind(
      questionId,
      data.title.trim(),
      data.content_md.trim(),
      data.answer_md.trim(),
      categoryId,
      productModelId || null,
      data.software_version?.trim() || null,
      data.bilibili_bvid?.trim() || null,
      hasVideo,
      createdBy || null
    )
    .run();

  return questionId;
}

/**
 * 为问题添加标签
 */
export async function addQuestionTags(
  db: D1Database,
  questionId: string,
  tagIds: string[]
): Promise<void> {
  for (const tagId of tagIds) {
    await db
      .prepare('INSERT INTO faq_question_tags (question_id, tag_id) VALUES (?, ?)')
      .bind(questionId, tagId)
      .run();
  }
}

/**
 * 生成随机ID（与数据库表结构一致）
 */
function generateId(): string {
  // 生成16字节的随机字符串，转换为小写十六进制
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * 批量处理FAQ导入
 */
export async function processFaqImport(
  db: D1Database,
  csvRows: FaqCsvRow[],
  updateExisting: boolean = false,
  createdBy?: string
): Promise<FaqImportResult> {
  const result: FaqImportResult = {
    successCount: 0,
    errorCount: 0,
    skippedCount: 0,
    errors: [],
    newCategories: [],
    newProductModels: [],
    newTags: []
  };

  // 用于跟踪新创建的实体
  const newCategoryNames = new Set<string>();
  const newProductModelNames = new Set<string>();
  const newTagNames = new Set<string>();

  for (let i = 0; i < csvRows.length; i++) {
    const row = csvRows[i];
    const rowNumber = i + 1;

    try {
      // 检查是否已存在相同标题的问题
      const existingQuestion = await findExistingQuestion(db, row.title);
      
      if (existingQuestion && !updateExisting) {
        result.skippedCount++;
        continue;
      }

      // 创建或查找分类
      const categoryResult = await findOrCreateCategory(db, row.category);
      if (categoryResult.isNew) {
        newCategoryNames.add(row.category);
      }

      // 创建或查找产品型号（如果提供）
      let productModelId: string | undefined;
      if (row.product_model?.trim()) {
        const productModelResult = await findOrCreateProductModel(
          db, 
          row.product_model, 
          categoryResult.id
        );
        productModelId = productModelResult.id;
        if (productModelResult.isNew) {
          newProductModelNames.add(row.product_model);
        }
      }

      let questionId: string;

      if (existingQuestion && updateExisting) {
        // 更新现有问题
        questionId = existingQuestion.id;
        const hasVideo = row.bilibili_bvid?.trim() ? 1 : 0;
        
        await db
          .prepare(`
            UPDATE faq_questions 
            SET content = ?, answer = ?, category_id = ?, product_model_id = ?,
                software_version = ?, video_bilibili_bvid = ?, has_video = ?,
                updated_at = strftime('%Y-%m-%d %H:%M:%S', 'now', 'localtime')
            WHERE id = ?
          `)
          .bind(
            row.content_md.trim(),
            row.answer_md.trim(),
            categoryResult.id,
            productModelId || null,
            row.software_version?.trim() || null,
            row.bilibili_bvid?.trim() || null,
            hasVideo,
            questionId
          )
          .run();

        // 删除现有标签关联
        await db
          .prepare('DELETE FROM faq_question_tags WHERE question_id = ?')
          .bind(questionId)
          .run();
      } else {
        // 创建新问题
        questionId = await createFaqQuestion(
          db,
          row,
          categoryResult.id,
          productModelId,
          createdBy
        );
      }

      // 处理标签
      if (row.tags?.trim()) {
        const tagNames = row.tags.split(',').map(tag => tag.trim()).filter(tag => tag);
        const tagIds: string[] = [];

        for (const tagName of tagNames) {
          const tagResult = await findOrCreateTag(db, tagName);
          tagIds.push(tagResult.id);
          if (tagResult.isNew) {
            newTagNames.add(tagName);
          }
        }

        // 添加标签关联
        await addQuestionTags(db, questionId, tagIds);
      }

      result.successCount++;
    } catch (error) {
      result.errorCount++;
      result.errors.push({
        row: rowNumber,
        message: `处理第${rowNumber}行时出错: ${error instanceof Error ? error.message : '未知错误'}`,
        data: row
      });
    }
  }

  // 整理新创建的实体列表
  result.newCategories = Array.from(newCategoryNames);
  result.newProductModels = Array.from(newProductModelNames);
  result.newTags = Array.from(newTagNames);

  return result;
}

/**
 * 生成CSV模板
 */
export function generateCsvTemplate(): FaqCsvTemplate {
  return {
    filename: 'faq_import_template.csv',
    headers: [
      'title',
      'content_md', 
      'answer_md',
      'category',
      'product_model',
      'tags',
      'software_version',
      'bilibili_bvid'
    ],
    sampleData: [
      {
        title: '如何连接设备到电脑？',
        content_md: '我想将示波器连接到电脑进行数据传输，但是不知道具体的连接步骤。',
        answer_md: '## 连接步骤\n\n1. 使用USB数据线连接设备和电脑\n2. 安装相应的驱动程序\n3. 打开设备管理软件\n4. 检查连接状态',
        category: '连接问题',
        product_model: 'SDS1104X-E',
        tags: '连接,USB,驱动',
        software_version: 'v1.2.3',
        bilibili_bvid: 'BV1234567890'
      },
      {
        title: '设备无法开机怎么办？',
        content_md: '按下电源键后设备没有任何反应，请问可能是什么原因？',
        answer_md: '## 解决方案\n\n1. 检查电源连接是否正常\n2. 确认电源适配器是否工作正常\n3. 检查保险丝是否熔断\n4. 如问题依然存在，请联系技术支持',
        category: '故障排查',
        product_model: '',
        tags: '开机,电源,故障',
        software_version: '',
        bilibili_bvid: ''
      }
    ]
  };
}

/**
 * 将模板数据转换为CSV字符串
 */
export function templateToCsv(template: FaqCsvTemplate): string {
  const headers = template.headers.join(',');
  const rows = template.sampleData.map(row => {
    return template.headers.map(header => {
      const value = (row as Record<string, string>)[header] || '';
      // 如果值包含逗号、引号或换行符，需要用引号包围并转义引号
      if (value.includes(',') || value.includes('"') || value.includes('\n')) {
        return `"${value.replace(/"/g, '""')}"`;
      }
      return value;
    }).join(',');
  });
  
  return [headers, ...rows].join('\n');
} 