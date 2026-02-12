// functions/utils/db.ts
// D1 数据库工具函数

export function getDb(database: D1Database) {
  return database;
}

// 通用查询帮助函数
export async function queryFirst(
  db: D1Database, 
  sql: string, 
  params?: any[]
): Promise<any | null> {
  const stmt = db.prepare(sql);
  const result = params ? await stmt.bind(...params).first() : await stmt.first();
  return result || null;
}

export async function queryAll(
  db: D1Database, 
  sql: string, 
  params?: any[]
): Promise<any[]> {
  const stmt = db.prepare(sql);
  const result = params ? await stmt.bind(...params).all() : await stmt.all();
  return (result.results as any[]) || [];
}

export async function insert(
  db: D1Database, 
  sql: string, 
  params?: any[]
): Promise<number> {
  const stmt = db.prepare(sql);
  const result = params ? await stmt.bind(...params).run() : await stmt.run();
  return result.meta.last_row_id;
}

export async function update(
  db: D1Database, 
  sql: string, 
  params?: any[]
): Promise<number> {
  const stmt = db.prepare(sql);
  const result = params ? await stmt.bind(...params).run() : await stmt.run();
  return result.meta.changes;
}
