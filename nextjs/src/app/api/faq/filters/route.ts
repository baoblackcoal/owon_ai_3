import { NextRequest, NextResponse } from 'next/server';
import { getCloudflareContext } from '@/lib/env';
import type { FaqFiltersResponse } from '@/types/faq';

export async function GET(request: NextRequest) {
  try {
    const { env } = await getCloudflareContext();
    
    // 获取分类列表
    const categoriesResult = await env.DB.prepare(`
      SELECT id, name, description, created_at 
      FROM faq_categories 
      ORDER BY name ASC
    `).all();

    // 获取机型列表（包含分类关联）
    const modelsResult = await env.DB.prepare(`
      SELECT 
        pm.id, 
        pm.category_id, 
        pm.name, 
        pm.created_at,
        c.name as category_name
      FROM faq_product_models pm
      LEFT JOIN faq_categories c ON pm.category_id = c.id
      ORDER BY c.name ASC, pm.name ASC
    `).all();

    // 获取标签列表
    const tagsResult = await env.DB.prepare(`
      SELECT id, name, created_at 
      FROM faq_tags 
      ORDER BY name ASC
    `).all();

    const response: FaqFiltersResponse = {
      categories: categoriesResult.results as any[],
      product_models: modelsResult.results as any[],
      tags: tagsResult.results as any[]
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('[FAQ Filters API Error]:', error);
    return NextResponse.json(
      { error: '获取筛选器数据失败' },
      { status: 500 }
    );
  }
} 