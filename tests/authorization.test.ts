import { describe, it, expect, beforeAll } from 'vitest';
import { runSeed } from '../scripts/seed';
import {
  createLeaveRequest,
  withdrawLeaveRequest,
  reviewLeaveRequest,
  checkDuplicateLeave,
  getLeaveById
} from '../src/db/queries/leaves';
import { getUserById } from '../src/db/queries/users';

describe('授權與權限邊界測試 (Authorization & Anti-IDOR Tests)', () => {
  beforeAll(async () => {
    await runSeed();
  });

  it('學生 A 不可撤回學生 B 的請假申請 (Anti-IDOR)', async () => {
    
    const meta = { ipAddress: '127.0.0.1', userAgent: 'TestRunner' };
    
    
    await expect(
      withdrawLeaveRequest('seed-leave-001', 'S112002', meta)
    ).rejects.toThrow('無法撤回');

    
    const leave = getLeaveById('seed-leave-001');
    expect(leave?.status).toBe('pending');
  });

  it('不可撤回非待審核 (如已核准) 的請假單', async () => {
    
    const meta = { ipAddress: '127.0.0.1', userAgent: 'TestRunner' };
    await expect(
      withdrawLeaveRequest('seed-leave-002', 'S112001', meta)
    ).rejects.toThrow('無法撤回');
  });

  it('教師不可審核非自己開授課程之請假單 (Anti-IDOR)', async () => {
    
    
    const meta = { ipAddress: '127.0.0.1', userAgent: 'TestRunner' };
    await expect(
      reviewLeaveRequest('seed-leave-001', 'T002', 'teacher', 'approved', '核准', meta)
    ).rejects.toThrow('無權限審核非自己授課之課程假單');
  });

  it('駁回請假單時若未填寫意見應被拒絕', async () => {
    const meta = { ipAddress: '127.0.0.1', userAgent: 'TestRunner' };
    await expect(
      reviewLeaveRequest('seed-leave-001', 'T001', 'teacher', 'rejected', '', meta)
    ).rejects.toThrow('駁回申請時必須填寫審核意見');
  });

  it('學生本人可以成功撤回自己的 pending 請假單', async () => {
    const meta = { ipAddress: '127.0.0.1', userAgent: 'TestRunner' };
    const success = await withdrawLeaveRequest('seed-leave-001', 'S112001', meta);
    expect(success).toBe(true);

    const leave = getLeaveById('seed-leave-001');
    expect(leave?.status).toBe('withdrawn');
  });

  it('防重複機制：已存在待審核或核准時段，不可重複送出', async () => {
    const meta = { ipAddress: '127.0.0.1', userAgent: 'TestRunner' };

    
    const leaveId = await createLeaveRequest(
      {
        studentId: 'S112002',
        courseId: 'CS101',
        leaveType: 'sick',
        startDate: '2026-11-20',
        endDate: '2026-11-20',
        periods: [3, 4],
        reason: '牙痛看診'
      },
      meta
    );
    expect(leaveId).toBeDefined();

    
    const isDup = checkDuplicateLeave('S112002', 'CS101', '2026-11-20', '2026-11-20', [3]);
    expect(isDup).toBe(true);

    await expect(
      createLeaveRequest(
        {
          studentId: 'S112002',
          courseId: 'CS101',
          leaveType: 'personal',
          startDate: '2026-11-20',
          endDate: '2026-11-20',
          periods: [3, 4],
          reason: '重複申請測試'
        },
        meta
      )
    ).rejects.toThrow('同一課程在該日期與節次時段已存在請假申請');
  });

  it('首次登入必須標記 must_change_password = 1', () => {
    const s1 = getUserById('S112001');
    expect(s1?.must_change_password).toBe(1);

    const s2 = getUserById('S112002');
    expect(s2?.must_change_password).toBe(0);
  });
});
