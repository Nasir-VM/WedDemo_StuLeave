import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { getDb } from '../src/db/index';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function runMigration(): void {
  const db = getDb();
  const schemaPath = path.resolve(__dirname, '../src/db/schema.sql');
  const sql = fs.readFileSync(schemaPath, 'utf-8');

  console.log('🔄 正在執行資料庫 Migration...');
  db.exec(sql);
  console.log('✅ 資料庫 Migration 完成，所有資料表與索引已成功建立！');
}

if (process.argv[1] === __filename) {
  try {
    runMigration();
  } catch (err) {
    console.error('❌ Migration 失敗:', err);
    process.exit(1);
  }
}
