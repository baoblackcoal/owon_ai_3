import { NextResponse } from 'next/server';
import { getCloudflareContext } from '@opennextjs/cloudflare';

// 获取所有表名
async function getTables(db: D1Database) {
  const { results } = await db
    .prepare(
      `SELECT name FROM sqlite_master 
       WHERE type='table' 
       AND name NOT LIKE 'sqlite_%'
       ORDER BY name`
    )
    .all();
  return results as { name: string }[];
}

// 获取表结构
async function getTableSchema(db: D1Database, tableName: string) {
  const { results } = await db
    .prepare(`PRAGMA table_info(${tableName})`)
    .all();
  return results;
}

// 获取表数据
async function getTableData(
  db: D1Database, 
  tableName: string, 
  page = 1, 
  pageSize = 10,
  searchColumn?: string,
  searchValue?: string,
) {
  const offset = (page - 1) * pageSize;
  let query = `SELECT * FROM ${tableName}`;
  let countQuery = `SELECT COUNT(*) as total FROM ${tableName}`;
  
  if (searchColumn && searchValue) {
    const whereClause = `WHERE ${searchColumn} LIKE ?`;
    query += ` ${whereClause}`;
    countQuery += ` ${whereClause}`;
  }
  
  query += ` LIMIT ? OFFSET ?`;
  
  const params = searchColumn && searchValue 
    ? [`%${searchValue}%`, pageSize, offset]
    : [pageSize, offset];
  
  const countParams = searchColumn && searchValue 
    ? [`%${searchValue}%`]
    : [];

  const [dataResult, countResult] = await Promise.all([
    db.prepare(query).bind(...params).all(),
    db.prepare(countQuery).bind(...countParams).all()
  ]);

  return {
    data: dataResult.results,
    total: (countResult.results[0] as { total: number }).total
  };
}

export async function GET(request: Request) {
  try {
    const { env } = await getCloudflareContext();
    const db = (env as unknown as { DB?: D1Database }).DB;

    if (!db) {
      return NextResponse.json(
        { error: 'D1 数据库未绑定，请使用 `npm run preview` 或部署到 Cloudflare 后再访问此接口' },
        { status: 500 },
      );
    }

    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const tableName = searchParams.get('table');
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '10');
    const searchColumn = searchParams.get('searchColumn') || undefined;
    const searchValue = searchParams.get('searchValue') || undefined;

    switch (action) {
      case 'getTables':
        const tables = await getTables(db);
        return NextResponse.json(tables);
      
      case 'getSchema':
        if (!tableName) {
          return NextResponse.json({ error: '缺少表名参数' }, { status: 400 });
        }
        const schema = await getTableSchema(db, tableName);
        return NextResponse.json(schema);
      
      case 'getData':
        if (!tableName) {
          return NextResponse.json({ error: '缺少表名参数' }, { status: 400 });
        }
        const data = await getTableData(db, tableName, page, pageSize, searchColumn, searchValue);
        return NextResponse.json(data);
      
      default:
        return NextResponse.json({ error: '无效的操作' }, { status: 400 });
    }
  } catch (error) {
    console.error('Database operation error:', error);
    return NextResponse.json(
      { error: '数据库操作失败' },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const { env } = await getCloudflareContext();
    const db = (env as unknown as { DB?: D1Database }).DB;

    if (!db) {
      return NextResponse.json(
        { error: 'D1 数据库未绑定' },
        { status: 500 },
      );
    }

    const { table, action, data } = await request.json();

    if (!table || !action) {
      return NextResponse.json({ error: '缺少必要参数' }, { status: 400 });
    }

    switch (action) {
      case 'insert': {
        const columns = Object.keys(data);
        const values = Object.values(data);
        const placeholders = Array(values.length).fill('?').join(', ');
        
        const query = `INSERT INTO ${table} (${columns.join(', ')}) VALUES (${placeholders})`;
        await db.prepare(query).bind(...values).run();
        return NextResponse.json({ success: true });
      }

      case 'update': {
        const { id, ...updateData } = data;
        const setClause = Object.keys(updateData)
          .map(key => `${key} = ?`)
          .join(', ');
        
        const query = `UPDATE ${table} SET ${setClause} WHERE id = ?`;
        await db.prepare(query)
          .bind(...Object.values(updateData), id)
          .run();
        return NextResponse.json({ success: true });
      }

      case 'delete': {
        const query = `DELETE FROM ${table} WHERE id = ?`;
        await db.prepare(query).bind(data.id).run();
        return NextResponse.json({ success: true });
      }

      default:
        return NextResponse.json({ error: '无效的操作' }, { status: 400 });
    }
  } catch (error) {
    console.error('Database operation error:', error);
    return NextResponse.json(
      { error: '数据库操作失败' },
      { status: 500 },
    );
  }
} 