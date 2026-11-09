import { describe, it, expect, beforeAll } from 'vitest';
import { runSeed } from '../scripts/seed';
import { getUserByIdOrEmail, listUsers } from '../src/db/queries/users';
import { listLeavesForReview } from '../src/db/queries/leaves';
import { getOverviewStats } from '../src/db/queries/stats';

describe('防 SQL Injection 測試 (SQL Injection Resistance Tests)', () => {
  beforeAll(async () => {
    await runSeed();
  });

  it('登入使用者查詢應抵禦經典 SQL 注入 payload (admin\' OR \'1\'=\'1)', () => {
    const maliciousInput = "admin' OR '1'='1";
    const user = getUserByIdOrEmail(maliciousInput);
    
    expect(user).toBeNull();
  });

  it('登入使用者查詢應抵禦註解式攻擊 (admin\' --)', () => {
    const maliciousInput = "admin' --";
    const user = getUserByIdOrEmail(maliciousInput);
    expect(user).toBeNull();
  });

  it('使用者列表關鍵字搜尋應抵禦 UNION SELECT 注入', () => {
    const maliciousSearch = "' UNION SELECT id, email, password_hash, role, NULL, NULL, 1, 'now', 'now', 'hacked' FROM users --";
    const result = listUsers({ search: maliciousSearch });
    
    expect(result.total).toBe(0);
    expect(result.users.length).toBe(0);
  });

  it('審核假單搜尋應抵禦 DROP TABLE 注入', () => {
    const maliciousSearch = "test'; DROP TABLE users; --";
    const result = listLeavesForReview({ search: maliciousSearch });
    expect(result.total).toBe(0);

    
    const adminUser = getUserByIdOrEmail('admin');
    expect(adminUser).not.toBeNull();
    expect(adminUser?.id).toBe('admin');
  });

  it('統計圖表過濾器應抵禦日期間隔注入', () => {
    const maliciousDate = "2026-11-10' OR '1'='1";
    const stats = getOverviewStats({ startDate: maliciousDate });
    
    expect(stats).toBeDefined();
    expect(typeof stats.weekCount).toBe('number');
  });
});
