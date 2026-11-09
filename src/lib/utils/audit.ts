import type Database from 'better-sqlite3';
import { getDb, executeWrite } from '../../db/index';

export interface AuditLogEntry {
  userId?: string | null;
  action: string;
  targetType: string;
  targetId?: string | null;
  details?: any;
  ipAddress: string;
  userAgent: string;
}




export async function logAudit(entry: AuditLogEntry): Promise<void> {
  const detailsJson = entry.details ? JSON.stringify(entry.details) : null;

  try {
    await executeWrite((db) => {
      db.prepare(`
        INSERT INTO audit_log (user_id, action, target_type, target_id, details, ip_address, user_agent)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(
        entry.userId || null,
        entry.action,
        entry.targetType,
        entry.targetId || null,
        detailsJson,
        entry.ipAddress,
        entry.userAgent
      );
    });
  } catch (err) {
    console.error('[AuditLog] 記錄寫入失敗:', err);
  }
}




export function logAuditInTx(
  db: Database.Database,
  entry: AuditLogEntry
): void {
  const detailsJson = entry.details ? JSON.stringify(entry.details) : null;
  db.prepare(`
    INSERT INTO audit_log (user_id, action, target_type, target_id, details, ip_address, user_agent)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(
    entry.userId || null,
    entry.action,
    entry.targetType,
    entry.targetId || null,
    detailsJson,
    entry.ipAddress,
    entry.userAgent
  );
}
