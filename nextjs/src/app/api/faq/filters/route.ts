import { NextResponse } from 'next/server';
import { FaqFiltersResponse } from '@/types/faq';
import { getCloudflareContext } from '@opennextjs/cloudflare';

type FaqCategoryRow = { id: number; name: string; description: string; created_at: string };
type FaqProductModelRow = { id: number; category_id: number | null; name: string; created_at: string };
type FaqTagRow = { id: number; name: string; created_at: string; question_count: number };

export async function GET() {
  try {
    const { env } = await getCloudflareContext();

    // 获取所有分类
    const categoriesQuery = `
      SELECT id, name, description, created_at
      FROM faq_categories
      ORDER BY name ASC
    `;
    const categoriesResult = await env.DB.prepare(categoriesQuery).all();
    const categories = (categoriesResult.results as FaqCategoryRow[] || []).map((c) => ({
      id: (c.id as unknown) as string,
      name: c.name,
      description: c.description,
      created_at: c.created_at,
    }));

    // 获取所有产品型号
    const modelsQuery = `
      SELECT pm.id, pm.category_id, pm.name, pm.created_at
      FROM faq_product_models pm
      ORDER BY pm.name ASC
    `;
    const modelsResult = await env.DB.prepare(modelsQuery).all();
    const product_models = (modelsResult.results as FaqProductModelRow[] || []).map((pm) => ({
      id: (pm.id as unknown) as string,
      category_id: pm.category_id ? (pm.category_id as unknown) as string : undefined,
      name: pm.name,
      created_at: pm.created_at,
    }));

    // 获取所有标签（包含使用次数）
    const tagsQuery = `
      SELECT 
        t.id, 
        t.name, 
        t.created_at,
        COUNT(qt.question_id) as question_count
      FROM faq_tags t
      LEFT JOIN faq_question_tags qt ON t.id = qt.tag_id
      GROUP BY t.id, t.name, t.created_at
      HAVING question_count > 0
      ORDER BY question_count DESC, t.name ASC
    `;
    const tagsResult = await env.DB.prepare(tagsQuery).all();
    const tags = (tagsResult.results as FaqTagRow[] || []).map((t) => ({
      id: (t.id as unknown) as string,
      name: t.name,
      created_at: t.created_at,
    }));

    const response: FaqFiltersResponse = {
      categories,
      product_models,
      tags,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('FAQ filters API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 