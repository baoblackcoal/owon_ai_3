import { NextRequest, NextResponse } from 'next/server';
import { getCloudflareContext } from '@opennextjs/cloudflare';

export async function GET(request: NextRequest) {
  try {
    // 获取查询参数
    const searchParams = request.nextUrl.searchParams;
    const table = searchParams.get('table') || 'faq_categories';

    // 获取 Cloudflare 运行时上下文中的 D1 数据库实例
    const { env } = await getCloudflareContext();

    // 通过类型断言解决 linter 对 env.DB 的类型提示
    const db = (env as unknown as { DB?: D1Database }).DB;

    if (!db) {
      // 本地 next dev 环境不会注入 Cloudflare 绑定，提示用户正确的运行方式
      return NextResponse.json(
        { error: 'D1 数据库未绑定，请使用 `npm run preview` 或部署到 Cloudflare 后再访问此接口' },
        { status: 500 },
      );
    }

    let query = '';
    switch (table) {
      case 'faq_categories':
        query = 'SELECT * FROM faq_categories ORDER BY name ASC';
        break;
      case 'faq_product_models':
        query = 'SELECT * FROM faq_product_models ORDER BY name ASC';
        break;
      case 'faq_tags':
        query = 'SELECT * FROM faq_tags ORDER BY name ASC';
        break;
      default:
        return NextResponse.json(
          { error: '不支持的表名' },
          { status: 400 }
        );
    }

    const { results } = await db.prepare(query).all();

    // 返回查询结果
    return NextResponse.json(results);
  } catch (error) {
    console.error('Database query error:', error);
    return NextResponse.json(
      { error: '数据库查询失败' },
      { status: 500 },
    );
  }
} 