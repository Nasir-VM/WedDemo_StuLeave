import { describe, it, expect, beforeAll } from 'vitest';
import crypto from 'crypto';
import { runSeed } from '../scripts/seed';
import { getDb, executeWriteTransaction } from '../src/db/index';
import { createLeaveRequest } from '../src/db/queries/leaves';

describe('高併發寫入與防死結測試 (Concurrency & Anti-Deadlock Tests)', () => {
  beforeAll(async () => {
    await runSeed();
  });

  it('模擬 50 個並行請求同時寫入，驗證無死結、無 SQLITE_BUSY 錯誤且資料完全不遺失', async () => {
    const CONCURRENT_COUNT = 50;
    const meta = { ipAddress: '127.0.0.1', userAgent: 'ConcurrencyTestRunner' };

    console.log(`🚀 正在發起 ${CONCURRENT_COUNT} 個並行寫入請求...`);

    const startTime = Date.now();

    
    const tasks = Array.from({ length: CONCURRENT_COUNT }, (_, index) => {
      
      const dayOffset = index + 1;
      const formattedDate = `2027-01-${String(dayOffset).padStart(2, '0')}`;

      return createLeaveRequest(
        {
          studentId: 'S112003',
          courseId: 'EE101',
          leaveType: 'sick',
          startDate: formattedDate,
          endDate: formattedDate,
          periods: [2],
          reason: `高並發壓力寫入測試任務 #${index + 1}`
        },
        meta
      );
    });

    
    const results = await Promise.all(tasks);

    const elapsed = Date.now() - startTime;
    console.log(`✅ ${CONCURRENT_COUNT} 個並行交易全部順利完成，耗時: ${elapsed}ms (平均每筆 ${(elapsed / CONCURRENT_COUNT).toFixed(1)}ms)`);

    
    expect(results.length).toBe(CONCURRENT_COUNT);
    results.forEach((id) => {
      expect(typeof id).toBe('string');
      expect(id.length).toBeGreaterThan(10);
    });

    
    const db = getDb();
    const countRow = db.prepare(`
      SELECT COUNT(*) as total 
      FROM leave_requests 
      WHERE reason LIKE '高並發壓力寫入測試任務%'
    `).get() as { total: number };

    expect(countRow.total).toBe(CONCURRENT_COUNT);

    
    const auditCount = db.prepare(`
      SELECT COUNT(*) as total 
      FROM audit_log 
      WHERE action = 'SUBMIT_LEAVE' AND user_id = 'S112003'
    `).get() as { total: number };

    expect(auditCount.total).toBe(CONCURRENT_COUNT);
  }, 30000);

  it('模擬併發樂觀鎖競爭：多位審核者同時審核同一筆待審假單，僅允許一筆成功，其餘安全拒絕', async () => {
    const meta = { ipAddress: '127.0.0.1', userAgent: 'OptimisticLockTest' };
    
    
    const targetLeaveId = await createLeaveRequest(
      {
        studentId: 'S112002',
        courseId: 'CS101',
        leaveType: 'official',
        startDate: '2026-12-01',
        endDate: '2026-12-01',
        periods: [3],
        reason: '樂觀鎖審核衝突測試'
      },
      meta
    );

    
    const reviewAttempts = Array.from({ length: 10 }, (_, i) => {
      return executeWriteTransaction((txDb) => {
        const res = txDb.prepare(`
          UPDATE leave_requests
          SET status = 'approved', review_comment = ?, reviewed_by = 'admin', reviewed_at = datetime('now', 'localtime')
          WHERE id = ? AND status = 'pending'
        `).run(`審核嘗試 #${i + 1}`, targetLeaveId);

        return res.changes;
      });
    });

    const outcomes = await Promise.all(reviewAttempts);

    
    const successCount = outcomes.filter((changes) => changes === 1).length;
    const ignoredCount = outcomes.filter((changes) => changes === 0).length;

    expect(successCount).toBe(1);
    expect(ignoredCount).toBe(9);
  });
});
