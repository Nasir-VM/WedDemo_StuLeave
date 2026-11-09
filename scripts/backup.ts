import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { getDb } from '../src/db/index';

const __filename = fileURLToPath(import.meta.url);

export function runBackup(backupDir = './backups'): string {
  const resolvedDir = path.resolve(process.cwd(), backupDir);
  if (!fs.existsSync(resolvedDir)) {
    fs.mkdirSync(resolvedDir, { recursive: true });
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const targetFile = path.join(resolvedDir, `backup-${timestamp}.sqlite`);

  console.log(`📦 開始執行 SQLite 線上熱備份 (VACUUM INTO)...`);
  const db = getDb();
  
  
  db.prepare(`VACUUM INTO ?`).run(targetFile);
  console.log(`✅ 備份成功建立於: ${targetFile}`);

  
  try {
    const files = fs.readdirSync(resolvedDir);
    const now = Date.now();
    const retentionMs = 30 * 24 * 60 * 60 * 1000;

    for (const file of files) {
      if (file.startsWith('backup-') && file.endsWith('.sqlite')) {
        const filePath = path.join(resolvedDir, file);
        const stats = fs.statSync(filePath);
        if (now - stats.mtimeMs > retentionMs) {
          fs.unlinkSync(filePath);
          console.log(`🧹 已清理過期備份檔: ${file}`);
        }
      }
    }
  } catch (cleanErr) {
    console.warn('⚠️ 清理舊備份時發生輕微警告:', cleanErr);
  }

  return targetFile;
}

if (process.argv[1] === __filename) {
  try {
    runBackup();
  } catch (err) {
    console.error('❌ 備份失敗:', err);
    process.exit(1);
  }
}
