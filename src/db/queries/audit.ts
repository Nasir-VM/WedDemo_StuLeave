import { getDb } from '../index';

export interface AuditRecord {
  id: number;
  user_id: string | null;
  user_name?: string | null;
  action: string;
  target_type: string;
  target_id: string | null;
  details: string | null;
  ip_address: string;
  user_agent: string;
  created_at: string;
}

export function listAuditLogs(options: {
  userId?: string;
  action?: string;
  targetType?: string;
  search?: string;
  limit?: number;
  offset?: number;
} = {}): { logs: AuditRecord[]; total: number } {
  const db = getDb();
  const params: any[] = [];
  const whereClauses: string[] = [];

  if (options.userId) {
    whereClauses.push('a.user_id = ?');
    params.push(options.userId);
  }

  if (options.action) {
    whereClauses.push('a.action = ?');
    params.push(options.action);
  }

  if (options.targetType) {
    whereClauses.push('a.target_type = ?');
    params.push(options.targetType);
  }

  if (options.search) {
    whereClauses.push('(a.user_id LIKE ? OR u.name LIKE ? OR a.action LIKE ? OR a.details LIKE ?)');
    const term = `%${options.search}%`;
    params.push(term, term, term, term);
  }

  const whereStr = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

  const countRow = db.prepare(`
    SELECT COUNT(*) as total 
    FROM audit_log a
    LEFT JOIN users u ON a.user_id = u.id
    ${whereStr}
  `).get(...params) as { total: number };

  const limit = Math.min(Math.max(options.limit || 20, 1), 100);
  const offset = Math.max(options.offset || 0, 0);

  const rows = db.prepare(`
    SELECT 
      a.*,
      u.name as user_name
    FROM audit_log a
    LEFT JOIN users u ON a.user_id = u.id
    ${whereStr}
    ORDER BY a.created_at DESC, a.id DESC
    LIMIT ? OFFSET ?
  `).all(...params, limit, offset) as AuditRecord[];

  return { logs: rows, total: countRow.total };
}
