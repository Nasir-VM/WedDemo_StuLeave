import { describe, it, expect, beforeEach } from 'vitest';
import { hashPassword, verifyPassword } from '../src/lib/auth/password';
import { generateCsrfToken, verifyCsrfToken } from '../src/lib/security/csrf';
import { detectMimeTypeFromMagicBytes } from '../src/lib/security/upload';
import { sanitizeCsvField, generateSafeCsv, escapeHtml } from '../src/lib/security/sanitize';
import { rateLimiter } from '../src/lib/security/rate-limit';

describe('資安單元測試 (Security Unit Tests)', () => {
  describe('1. 密碼雜湊與驗證 (argon2id)', () => {
    it('應能正確雜湊並驗證密碼，且能抵禦錯誤密碼', async () => {
      const password = 'StrongPassword123!@#';
      const hash = await hashPassword(password);

      expect(hash).toMatch(/^\$argon2id\$/);
      expect(await verifyPassword(hash, password)).toBe(true);
      expect(await verifyPassword(hash, 'WrongPassword123!')).toBe(false);
      expect(await verifyPassword(hash, '')).toBe(false);
    });
  });

  describe('2. CSRF Token 防護', () => {
    it('產生的 CSRF Token 應能通過常數時間比對驗證', () => {
      const sessionId = 'session_test_token_1234567890abcdef';
      const token = generateCsrfToken(sessionId);

      expect(verifyCsrfToken(token, sessionId)).toBe(true);
      expect(verifyCsrfToken(token, 'different_session_id')).toBe(false);
      expect(verifyCsrfToken('tampered.token', sessionId)).toBe(false);
      expect(verifyCsrfToken(null, sessionId)).toBe(false);
    });
  });

  describe('3. 檔案 Magic Bytes 特徵碼防偽', () => {
    it('應正確辨識合法 JPEG、PNG 與 PDF 檔案二進位頭部', () => {
      
      const jpegBuf = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46]);
      expect(detectMimeTypeFromMagicBytes(jpegBuf)).toBe('image/jpeg');

      
      const pngBuf = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
      expect(detectMimeTypeFromMagicBytes(pngBuf)).toBe('image/png');

      
      const pdfBuf = Buffer.from([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x37]);
      expect(detectMimeTypeFromMagicBytes(pdfBuf)).toBe('application/pdf');
    });

    it('應拒絕偽裝為圖片的可執行檔或文字檔', () => {
      const fakeBuf = Buffer.from('MZ\x90\x00\x03\x00\x00\x00'); 
      expect(detectMimeTypeFromMagicBytes(fakeBuf)).toBeNull();

      const scriptBuf = Buffer.from('<?php echo "evil"; ?>');
      expect(detectMimeTypeFromMagicBytes(scriptBuf)).toBeNull();
    });
  });

  describe('4. CSV Injection 防範 (Formula Injection)', () => {
    it('以 =, +, -, @, \\t, \\r 開頭的欄位必須自動加上單引號前綴', () => {
      expect(sanitizeCsvField('=1+1')).toBe(`"'=1+1"`);
      expect(sanitizeCsvField('+cmd|"/c calc"!A0')).toBe(`"'+cmd|""/c calc""!A0"`);
      expect(sanitizeCsvField('-100')).toBe(`"'-100"`);
      expect(sanitizeCsvField('@SUM(A1:A10)')).toBe(`"'@SUM(A1:A10)"`);
      expect(sanitizeCsvField('\tDDE("cmd")')).toBe(`"'\tDDE(""cmd"")"`);

      
      expect(sanitizeCsvField('陳小華')).toBe('"陳小華"');
      expect(sanitizeCsvField('病假')).toBe('"病假"');
    });

    it('匯出 CSV 應包含 UTF-8 BOM 且正確跳脫', () => {
      const csv = generateSafeCsv(['姓名', '事由'], [['小明', '=2+2']]);
      expect(csv.startsWith('\uFEFF')).toBe(true);
      expect(csv).toContain(`"'=2+2"`);
    });
  });

  describe('5. XSS 跳脫處理', () => {
    it('應正確跳脫 HTML 危險字元', () => {
      const evil = '<script>alert("xss")</script>&\'';
      const escaped = escapeHtml(evil);
      expect(escaped).toBe('&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;&amp;&#39;');
    });
  });

  describe('6. 應用層 Rate Limiting 與連續失敗鎖定', () => {
    beforeEach(() => {
      rateLimiter.resetAll();
    });

    it('每分鐘登入嘗試超過 5 次應被限制', () => {
      const ip = '192.168.1.100';
      const user = 'student1';

      for (let i = 0; i < 5; i++) {
        const check = rateLimiter.checkLoginLimit(ip, user);
        expect(check.allowed).toBe(true);
      }

      
      const blocked = rateLimiter.checkLoginLimit(ip, user);
      expect(blocked.allowed).toBe(false);
      expect(blocked.reason).toContain('嘗試登入過於頻繁');
    });

    it('連續 10 次登入失敗應觸發 15 分鐘鎖定', () => {
      const ip = '192.168.1.101';
      const user = 'student2';

      for (let i = 0; i < 9; i++) {
        const fail = rateLimiter.recordLoginFailure(ip, user);
        expect(fail.locked).toBe(false);
      }

      const tenthFail = rateLimiter.recordLoginFailure(ip, user);
      expect(tenthFail.locked).toBe(true);

      
      const check = rateLimiter.checkLoginLimit(ip, user);
      expect(check.allowed).toBe(false);
      expect(check.reason).toContain('已被暫時鎖定 15 分鐘');
    });
  });
});
