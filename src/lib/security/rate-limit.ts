import { SECURITY_LIMITS } from '../../config/constants';

interface RateLimitRecord {
  timestamps: number[];
  failedAttempts: number;
  lockedUntil: number;
}

class RateLimiter {
  private records: Map<string, RateLimitRecord> = new Map();
  private cleanupInterval: NodeJS.Timeout;

  constructor() {
    
    this.cleanupInterval = setInterval(() => {
      const now = Date.now();
      for (const [key, record] of this.records.entries()) {
        record.timestamps = record.timestamps.filter((t) => now - t < 15 * 60 * 1000);
        if (record.timestamps.length === 0 && record.lockedUntil < now && record.failedAttempts === 0) {
          this.records.delete(key);
        }
      }
    }, 5 * 60 * 1000);
    this.cleanupInterval.unref();
  }

  private getRecord(key: string): RateLimitRecord {
    let rec = this.records.get(key);
    if (!rec) {
      rec = { timestamps: [], failedAttempts: 0, lockedUntil: 0 };
      this.records.set(key, rec);
    }
    return rec;
  }

  


  public checkLimit(key: string, limit: number, windowMs: number): { allowed: boolean; remaining: number; resetMs: number } {
    const now = Date.now();
    const rec = this.getRecord(key);

    rec.timestamps = rec.timestamps.filter((t) => now - t < windowMs);

    if (rec.timestamps.length >= limit) {
      const oldest = rec.timestamps[0];
      const resetMs = windowMs - (now - oldest);
      return { allowed: false, remaining: 0, resetMs: Math.max(0, resetMs) };
    }

    rec.timestamps.push(now);
    return {
      allowed: true,
      remaining: limit - rec.timestamps.length,
      resetMs: windowMs
    };
  }

  


  public checkLoginLimit(ip: string, username: string): { allowed: boolean; reason?: string; lockRemainingMs?: number } {
    const now = Date.now();
    const key = `login:${ip}:${username.toLowerCase().trim()}`;
    const rec = this.getRecord(key);

    
    if (rec.lockedUntil > now) {
      return {
        allowed: false,
        reason: '帳號或 IP 嘗試錯誤過多，已被暫時鎖定 15 分鐘，請稍後再試。',
        lockRemainingMs: rec.lockedUntil - now
      };
    }

    
    rec.timestamps = rec.timestamps.filter((t) => now - t < 60 * 1000);
    if (rec.timestamps.length >= 5) {
      return {
        allowed: false,
        reason: '嘗試登入過於頻繁（每分鐘上限 5 次），請稍候片刻再試。'
      };
    }

    rec.timestamps.push(now);
    return { allowed: true };
  }

  


  public recordLoginFailure(ip: string, username: string): { locked: boolean; failedCount: number } {
    const now = Date.now();
    const key = `login:${ip}:${username.toLowerCase().trim()}`;
    const rec = this.getRecord(key);

    rec.failedAttempts += 1;

    if (rec.failedAttempts >= SECURITY_LIMITS.MAX_LOGIN_ATTEMPTS_BEFORE_LOCK) {
      rec.lockedUntil = now + SECURITY_LIMITS.LOGIN_LOCKOUT_MS;
      rec.failedAttempts = 0; 
      return { locked: true, failedCount: SECURITY_LIMITS.MAX_LOGIN_ATTEMPTS_BEFORE_LOCK };
    }

    return { locked: false, failedCount: rec.failedAttempts };
  }

  


  public recordLoginSuccess(ip: string, username: string): void {
    const key = `login:${ip}:${username.toLowerCase().trim()}`;
    this.records.delete(key);
  }

  


  public checkUploadLimit(ip: string): { allowed: boolean; resetMs?: number } {
    const res = this.checkLimit(`upload:${ip}`, 10, 10 * 60 * 1000);
    return { allowed: res.allowed, resetMs: res.resetMs };
  }

  


  public checkApiLimit(ip: string): { allowed: boolean; remaining: number } {
    const res = this.checkLimit(`api:${ip}`, 60, 60 * 1000);
    return { allowed: res.allowed, remaining: res.remaining };
  }

  


  public resetAll(): void {
    this.records.clear();
  }
}

export const rateLimiter = new RateLimiter();
