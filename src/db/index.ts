import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import { env } from '../config/env';


const dbDir = path.dirname(env.resolvedDbPath);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}
if (!fs.existsSync(env.resolvedUploadDir)) {
  fs.mkdirSync(env.resolvedUploadDir, { recursive: true });
}


let dbInstance: Database.Database | null = null;

export function getDb(): Database.Database {
  if (!dbInstance) {
    dbInstance = new Database(env.resolvedDbPath, {
      verbose: env.isDev ? undefined : undefined
    });

    
    dbInstance.pragma('journal_mode = WAL');
    dbInstance.pragma('synchronous = NORMAL');
    dbInstance.pragma('busy_timeout = 5000');
    dbInstance.pragma('foreign_keys = ON');
    dbInstance.pragma('temp_store = MEMORY');
    dbInstance.pragma('cache_size = -64000'); 
  }
  return dbInstance;
}


class WriteQueue {
  private queue: Promise<any> = Promise.resolve();

  public enqueue<T>(task: () => Promise<T> | T): Promise<T> {
    const res = this.queue.then(async () => {
      return await task();
    });
    
    this.queue = res.catch(() => {});
    return res;
  }
}

const writeQueue = new WriteQueue();




function waitWithJitter(attempt: number, baseMs = 50, maxMs = 500): Promise<void> {
  const expDelay = Math.min(baseMs * Math.pow(2, attempt), maxMs);
  const jitter = Math.random() * expDelay;
  const total = Math.floor(expDelay / 2 + jitter);
  return new Promise((resolve) => setTimeout(resolve, total));
}




export async function executeWriteTransaction<T>(
  callback: (db: Database.Database) => T,
  maxRetries = 5
): Promise<T> {
  return writeQueue.enqueue(async () => {
    const db = getDb();
    let attempt = 0;

    while (attempt < maxRetries) {
      try {
        
        db.exec('BEGIN IMMEDIATE;');
        try {
          const result = callback(db);
          db.exec('COMMIT;');
          return result;
        } catch (innerErr) {
          try {
            db.exec('ROLLBACK;');
          } catch {
            
          }
          throw innerErr;
        }
      } catch (err: any) {
        attempt++;
        const isBusy =
          err?.code === 'SQLITE_BUSY' ||
          err?.code === 'SQLITE_LOCKED' ||
          (typeof err?.message === 'string' && (err.message.includes('busy') || err.message.includes('locked')));

        if (isBusy && attempt < maxRetries) {
          console.warn(`[SQLite Write Conflict] 正在進行第 ${attempt} 次重試 (code: ${err?.code})`);
          await waitWithJitter(attempt);
          continue;
        }
        throw err;
      }
    }

    throw new Error('資料庫寫入逾時，重試次數已達上限 (503 Service Unavailable)');
  });
}




export async function executeWrite<T>(
  callback: (db: Database.Database) => T
): Promise<T> {
  return executeWriteTransaction(callback);
}




export function executeRead<T>(
  callback: (db: Database.Database) => T
): T {
  const db = getDb();
  return callback(db);
}

export default getDb;
