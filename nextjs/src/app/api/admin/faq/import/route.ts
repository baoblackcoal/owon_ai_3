import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getCloudflareContext } from '@opennextjs/cloudflare';
import { 
  parseCsvContent, 
  processFaqImport 
} from '@/lib/faq-import';
import type { FaqImportRequest, FaqImportResponse } from '@/types/faq';

/**
 * POST /api/admin/faq/import
 * 处理FAQ批量导入
 */
export async function POST(request: NextRequest) {
  try {
    // 验证管理员权限
    const session = await auth();
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json(
        { 
          success: false,
          error: '权限不足，仅限管理员访问' 
        },
        { status: 403 }
      );
    }

    // 获取Cloudflare环境
    const { env } = await getCloudflareContext();
    if (!env?.DB) {
      return NextResponse.json(
        { 
          success: false,
          error: '数据库连接失败' 
        },
        { status: 500 }
      );
    }

    // 解析请求数据
    let importRequest: FaqImportRequest;
    try {
      importRequest = await request.json();
    } catch {
      return NextResponse.json(
        { 
          success: false,
          error: '请求数据格式错误' 
        },
        { status: 400 }
      );
    }

    // 验证必需字段
    if (!importRequest.csvData) {
      return NextResponse.json(
        { 
          success: false,
          error: 'CSV数据不能为空' 
        },
        { status: 400 }
      );
    }

    // 解析CSV内容
    const { data: csvRows, errors: parseErrors } = parseCsvContent(importRequest.csvData);

    // 如果解析过程中有错误，直接返回
    if (parseErrors.length > 0) {
      return NextResponse.json({
        success: false,
        message: 'CSV解析失败',
        result: {
          successCount: 0,
          errorCount: parseErrors.length,
          skippedCount: 0,
          errors: parseErrors,
          newCategories: [],
          newProductModels: [],
          newTags: []
        }
      });
    }

    // 如果没有有效数据行
    if (csvRows.length === 0) {
      return NextResponse.json({
        success: false,
        message: 'CSV文件中没有有效的数据行',
        result: {
          successCount: 0,
          errorCount: 0,
          skippedCount: 0,
          errors: [],
          newCategories: [],
          newProductModels: [],
          newTags: []
        }
      });
    }

    // 处理导入
    const result = await processFaqImport(
      env.DB,
      csvRows,
      importRequest.updateExisting || false,
      session.user.id
    );

    // 构造响应
    const response: FaqImportResponse = {
      success: true,
      message: `导入完成！成功: ${result.successCount}条，失败: ${result.errorCount}条，跳过: ${result.skippedCount}条`,
      result
    };

    // 记录操作日志
    console.log('FAQ批量导入完成:', {
      adminId: session.user.id,
      totalRows: csvRows.length,
      successCount: result.successCount,
      errorCount: result.errorCount,
      skippedCount: result.skippedCount,
      newCategories: result.newCategories,
      newProductModels: result.newProductModels,
      newTags: result.newTags
    });

    return NextResponse.json(response);

  } catch (error) {
    console.error('FAQ导入API错误:', error);
    
    const response: FaqImportResponse = {
      success: false,
      message: '导入过程中发生错误',
      result: {
        successCount: 0,
        errorCount: 1,
        skippedCount: 0,
        errors: [{
          row: 0,
          message: `系统错误: ${error instanceof Error ? error.message : '未知错误'}`
        }],
        newCategories: [],
        newProductModels: [],
        newTags: []
      }
    };

    return NextResponse.json(response, { status: 500 });
  }
} 