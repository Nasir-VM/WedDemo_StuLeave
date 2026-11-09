import { getDb, executeWriteTransaction } from '../index';
import type { UserRole } from '../../config/constants';

export interface UserRecord {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  department_id: string | null;
  department_name?: string | null;
  password_hash: string;
  must_change_password: number;
  is_active: number;
  created_at: string;
  updated_at: string;
}

export function getUserById(id: string): UserRecord | null {
  const db = getDb();
  const row = db.prepare(`
    SELECT u.*, d.name as department_name
    FROM users u
    LEFT JOIN departments d ON u.department_id = d.id
    WHERE u.id = ?
  `).get(id) as UserRecord | undefined;

  return row || null;
}

export function getUserByEmail(email: string): UserRecord | null {
  const db = getDb();
  const row = db.prepare(`
    SELECT u.*, d.name as department_name
    FROM users u
    LEFT JOIN departments d ON u.department_id = d.id
    WHERE LOWER(u.email) = LOWER(?)
  `).get(email) as UserRecord | undefined;

  return row || null;
}

export function getUserByIdOrEmail(identifier: string): UserRecord | null {
  const db = getDb();
  const row = db.prepare(`
    SELECT u.*, d.name as department_name
    FROM users u
    LEFT JOIN departments d ON u.department_id = d.id
    WHERE LOWER(u.id) = LOWER(?) OR LOWER(u.email) = LOWER(?)
  `).get(identifier, identifier) as UserRecord | undefined;

  return row || null;
}

export async function updateUserPassword(userId: string, newHash: string): Promise<boolean> {
  return await executeWriteTransaction((db) => {
    const res = db.prepare(`
      UPDATE users
      SET password_hash = ?, must_change_password = 0, updated_at = datetime('now', 'localtime')
      WHERE id = ?
    `).run(newHash, userId);
    return res.changes > 0;
  });
}

export async function createUser(data: {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  department_id?: string | null;
  password_hash: string;
  must_change_password?: number;
}): Promise<boolean> {
  return await executeWriteTransaction((db) => {
    const res = db.prepare(`
      INSERT INTO users (
        id, email, name, role, department_id, password_hash, must_change_password, is_active
      ) VALUES (?, ?, ?, ?, ?, ?, ?, 1)
    `).run(
      data.id.trim(),
      data.email.trim().toLowerCase(),
      data.name.trim(),
      data.role,
      data.department_id || null,
      data.password_hash,
      data.must_change_password ?? 1
    );
    return res.changes > 0;
  });
}

export async function toggleUserActive(userId: string, isActive: number): Promise<boolean> {
  return await executeWriteTransaction((db) => {
    const res = db.prepare(`
      UPDATE users
      SET is_active = ?, updated_at = datetime('now', 'localtime')
      WHERE id = ?
    `).run(isActive ? 1 : 0, userId);
    return res.changes > 0;
  });
}

export function listUsers(options: {
  role?: string;
  departmentId?: string;
  search?: string;
  limit?: number;
  offset?: number;
}): { users: UserRecord[]; total: number } {
  const db = getDb();
  const params: any[] = [];
  const whereClauses: string[] = [];

  if (options.role) {
    whereClauses.push('u.role = ?');
    params.push(options.role);
  }

  if (options.departmentId) {
    whereClauses.push('u.department_id = ?');
    params.push(options.departmentId);
  }

  if (options.search) {
    whereClauses.push('(u.id LIKE ? OR u.name LIKE ? OR u.email LIKE ?)');
    const term = `%${options.search}%`;
    params.push(term, term, term);
  }

  const whereStr = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

  const countRow = db.prepare(`SELECT COUNT(*) as total FROM users u ${whereStr}`).get(...params) as { total: number };
  const limit = Math.min(Math.max(options.limit || 20, 1), 100);
  const offset = Math.max(options.offset || 0, 0);

  const rows = db.prepare(`
    SELECT u.id, u.email, u.name, u.role, u.department_id, u.must_change_password, u.is_active, u.created_at, u.updated_at, d.name as department_name
    FROM users u
    LEFT JOIN departments d ON u.department_id = d.id
    ${whereStr}
    ORDER BY u.created_at DESC
    LIMIT ? OFFSET ?
  `).all(...params, limit, offset) as UserRecord[];

  return { users: rows, total: countRow.total };
}
