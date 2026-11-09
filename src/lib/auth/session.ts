import crypto from 'crypto';
import { getDb, executeWriteTransaction } from '../../db/index';
import { SECURITY_LIMITS } from '../../config/constants';
import type { UserRole } from '../../config/constants';

export interface SessionUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  department_id: string | null;
  must_change_password: number;
  is_active: number;
}

export interface SessionData {
  sessionId: string;
  user: SessionUser;
  expiresAt: number;
}

export const SESSION_COOKIE_NAME = 'agy_session_id';




export function generateSessionToken(): string {
  return crypto.randomBytes(32).toString('hex');
}




export function hashSessionToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}




export async function createSession(
  userId: string,
  ipAddress: string,
  userAgent: string
): Promise<string> {
  const rawToken = generateSessionToken();
  const tokenHash = hashSessionToken(rawToken);
  const now = Date.now();
  const expiresAt = now + SECURITY_LIMITS.SESSION_IDLE_TIMEOUT_MS;

  await executeWriteTransaction((db) => {
    
    db.prepare(`
      INSERT INTO sessions (id, user_id, ip_address, user_agent, expires_at, created_at, last_active_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(tokenHash, userId, ipAddress, userAgent, expiresAt, now, now);
  });

  return rawToken;
}




export function validateSession(rawToken: string): SessionData | null {
  if (!rawToken || rawToken.length < 32) return null;

  const tokenHash = hashSessionToken(rawToken);
  const now = Date.now();
  const db = getDb();

  const row = db.prepare(`
    SELECT 
      s.id as session_id,
      s.expires_at,
      s.created_at as session_created_at,
      u.id,
      u.email,
      u.name,
      u.role,
      u.department_id,
      u.must_change_password,
      u.is_active
    FROM sessions s
    JOIN users u ON s.user_id = u.id
    WHERE s.id = ?
  `).get(tokenHash) as any;

  if (!row) return null;

  
  if (!row.is_active) {
    invalidateSession(rawToken);
    return null;
  }

  
  if (now > row.expires_at || (now - row.session_created_at) > SECURITY_LIMITS.SESSION_MAX_LIFETIME_MS) {
    invalidateSession(rawToken);
    return null;
  }

  
  const newExpiresAt = now + SECURITY_LIMITS.SESSION_IDLE_TIMEOUT_MS;
  try {
    db.prepare(`
      UPDATE sessions
      SET expires_at = ?, last_active_at = ?
      WHERE id = ?
    `).run(newExpiresAt, now, tokenHash);
  } catch {
    
  }

  return {
    sessionId: rawToken,
    expiresAt: newExpiresAt,
    user: {
      id: row.id,
      email: row.email,
      name: row.name,
      role: row.role as UserRole,
      department_id: row.department_id,
      must_change_password: row.must_change_password,
      is_active: row.is_active
    }
  };
}




export function invalidateSession(rawToken: string): void {
  if (!rawToken) return;
  const tokenHash = hashSessionToken(rawToken);
  const db = getDb();
  try {
    db.prepare(`DELETE FROM sessions WHERE id = ?`).run(tokenHash);
  } catch (err) {
    console.error('[Session] 撤銷失敗:', err);
  }
}




export function invalidateAllUserSessions(userId: string): void {
  const db = getDb();
  try {
    db.prepare(`DELETE FROM sessions WHERE user_id = ?`).run(userId);
  } catch (err) {
    console.error('[Session] 撤銷使用者所有 Session 失敗:', err);
  }
}
