import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { generateCsvTemplate, templateToCsv } from '@/lib/faq-import';

/**
 * GET /api/admin/faq/template
 * 下载FAQ导入CSV模板文件
 */
export async function GET() {
  try {
    // 验证管理员权限
    const session = await auth();
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json(
        { error: '权限不足，仅限管理员访问' },
        { status: 403 }
      );
    }

    // 生成CSV模板
    const template = generateCsvTemplate();
    const csvContent = templateToCsv(template);

    // 设置响应头，触发文件下载
    const headers = new Headers({
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${template.filename}"`,
      'Cache-Control': 'no-cache, no-store, must-revalidate',
    });

    // 添加BOM以确保Excel正确显示中文
    const bom = '\uFEFF';
    const csvWithBom = bom + csvContent;

    return new NextResponse(csvWithBom, {
      status: 200,
      headers,
    });
  } catch (error) {
    console.error('CSV template download error:', error);
    return NextResponse.json(
      { 
        error: '下载模板文件失败',
        details: error instanceof Error ? error.message : '未知错误'
      },
      { status: 500 }
    );
  }
} 