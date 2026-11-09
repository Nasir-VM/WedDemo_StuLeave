# XX大學課堂學生請假系統 — 資安防禦架構與威脅模型對照書 (SECURITY.md)

本系統依據 **OWASP Top 10 (2021)**、**NIST SP 800-63B** 數位身分認證標準與**個資保護最小化原則**進行全端資安防禦工程設計。

---

## 1. 威脅模型與已實作防護對照表 (Threat Model & Defenses Matrix)

| 威脅類別 / 攻擊向量 | 風險說明 | 本系統已實作防禦措施 | 對應程式碼位置 |
|---|---|---|---|
| **SQL Injection (SQLi)** | 惡意使用者藉由表單或搜尋注入 SQL 語句破壞資料庫或外洩資料 | 1. 100% 採用 SQLite Prepared Statements 與具名/位置參數綁定，**嚴禁任何字串拼接**。<br>2. 所有篩選欄位以白名單對應。<br>3. 所有請求參數經 **zod** 強型別、正則與長度校驗。 | `src/db/queries/*.ts`<br>`src/pages/api/**/*.ts` |
| **資料庫死結 (Deadlock & SQLITE_BUSY)** | 高並發請假或審核時引發鎖升級競爭與資料遺失 | 1. **單例連線 (Singleton)** 與 **寫入序列化互斥佇列 (Write Queue)**。<br>2. 所有交易強制使用 **`BEGIN IMMEDIATE`** 預先鎖定。<br>3. 跨表寫入固定順序：`leave_requests` → `leave_attachments` → `audit_log`。<br>4. **指數退避加隨機抖動 (Exponential Backoff with Jitter)** 重試最多 5 次。<br>5. 審核採**樂觀鎖**：`UPDATE ... WHERE id = ? AND status = 'pending'` 檢查異動筆數。 | `src/db/index.ts`<br>`src/db/queries/leaves.ts` |
| **暴力破解與帳號枚舉** | 攻擊者透過字典檔暴力碰撞密碼，或由錯誤提示探測帳號是否存在 | 1. **應用層 Rate Limiting**：登入每分鐘限 5 次，連續失敗 10 次強制鎖定 15 分鐘。<br>2. **常數時間驗證**：即使帳號不存在亦執行虛擬 argon2id 運算，消除 Timing Attack。<br>3. 登入錯誤回傳統一通用訊息，不洩漏帳號是否存在。 | `src/lib/security/rate-limit.ts`<br>`src/pages/api/auth/login.ts` |
| **跨站請求偽造 (CSRF)** | 惡意網站誘導已登入學生或教師發送偽造核准或申請請求 | 1. 所有寫入操作（POST/PUT/DELETE）校驗 **CSRF Token**。<br>2. 採用 **HMAC-SHA256** 簽名與 `crypto.timingSafeEqual` 防時序差攻擊。<br>3. 伺服器端比對 **Origin / Referer** 標頭。 | `src/lib/security/csrf.ts`<br>`src/middleware/index.ts` |
| **跨站腳本攻擊 (XSS)** | 攻擊者在請假事由或審核意見中植入 JavaScript 竊取憑證 | 1. 視圖層全面字串跳脫（`escapeHtml` 與 Astro 自動跳脫機制）。<br>2. 嚴格部署 **Content-Security-Policy (CSP)**：禁止外部未信任腳本執行，鎖定 `object-src 'none'`、`base-uri 'self'`。 | `src/lib/security/headers.ts`<br>`src/lib/security/sanitize.ts` |
| **越權存取與 IDOR (水平/垂直越權)** | 學生修改或撤回他人假單、下載未經授權附件，或教師審核非自己開授課程 | 1. **伺服器端強制權限驗證**：API 與頁面端點逐筆校驗 session 使用者與資料庫紀錄擁有權。<br>2. 附件下載必須為：假單本人、授課教師或管理員。<br>3. 學生僅能撤回自己且處於 `pending` 之申請。 | `src/pages/api/attachments/[id].ts`<br>`src/pages/api/leaves/withdraw.ts`<br>`src/pages/api/leaves/review.ts` |
| **惡意檔案上傳 (Malicious Upload)** | 攻擊者上傳偽裝成 JPG/PNG/PDF 的可執行木馬或腳本 | 1. **Magic Bytes 二進位特徵碼驗證**，拒絕任何偽裝副檔名。<br>2. 單檔嚴格限制 ≤ 5MB。<br>3. 檔案存放於 **Web Root 之外**的專屬 Volume。<br>4. 檔名採 `crypto.randomUUID()` 隨機命名，杜絕路徑穿越。<br>5. 下載設定 `Content-Disposition` 與 `X-Content-Type-Options: nosniff`。 | `src/lib/security/upload.ts`<br>`src/pages/api/attachments/[id].ts` |
| **CSV 注入 (Formula Injection)** | 匯出統計時惡意公式（如 `=cmd|...`）在管理者本機 Excel 執行木馬 | 1. 匯出 CSV 前自動偵測欄位是否以 `=`, `+`, `-`, `@`, `\t`, `\r` 開頭。<br>2. 危險開頭欄位**強制於最前方加上單引號 (`'`)**，轉化為純文字顯示。<br>3. 加入 UTF-8 BOM 防 Excel 亂碼。 | `src/lib/security/sanitize.ts`<br>`src/pages/stats/export.csv.ts` |
| **Session 劫持與固定 (Session Fixation)** | 攻擊者竊取 Session 或預先植入 Token 劫持已認證身分 | 1. Session Token 具備 256-bit 加密隨機強度。<br>2. 資料庫僅儲存 **SHA-256 雜湊**，防範 DB 外洩即失效。<br>3. 登入成功時**強制重新產生 Session ID** (Session Rotation)。<br>4. Cookie 設定 **`HttpOnly`**, **`Secure`**, **`SameSite=Lax`**，閒置 30 分鐘自動逾時。 | `src/lib/auth/session.ts`<br>`src/pages/api/auth/login.ts` |
| **容器提權與主機逃逸** | 應用程式遭入侵後攻擊者嘗試獲取 Docker 宿主機 root 權限 | 1. 容器以 **非 root 使用者 (node)** 執行。<br>2. 根檔案系統宣告為 **`read_only: true`**。<br>3. 放棄全部 Linux Capabilities (**`cap_drop: ALL`**)。<br>4. 啟用 **`no-new-privileges: true`**。<br>5. 設定 CPU 與記憶體限制，防資源耗盡。 | `Dockerfile`<br>`docker-compose.yml` |

---

## 2. Cloudflare 邊緣防護建議配置 (Edge WAF & Security Rules)

搭配 Cloudflared Tunnel 對外服務時，建議在 Cloudflare Zero Trust / Cloudflare Dashboard 啟用下列防護：

### 2.1 WAF 自訂防火牆規則 (Custom Rules)
1. **阻擋異常國家/地區存取**：
   - 規則：`not (ip.geoip.country in {"TW"}) and not (cf.threat_score < 10)`
   - 動作：Managed Challenge（質詢）
2. **敏感管理後台 IP 白名單或 Access 保護**：
   - 路徑：`http.request.uri.path starts_with "/admin"`
   - 動作：搭配 **Cloudflare Access (Zero Trust)** 進行校園 Email OTP 或 SSO 雙重驗證。

### 2.2 Rate Limiting Rules (邊緣層頻率限制)
1. **登入防爆破**：
   - 條件：`http.request.uri.path eq "/api/auth/login" and http.request.method eq "POST"`
   - 限制：每 IP 每分鐘超過 5 次請求，阻擋 15 分鐘。
2. **全站 DDoS 防護**：
   - 條件：全站請求
   - 限制：每 IP 每 10 秒超過 100 次請求，執行 JavaScript Challenge。

### 2.3 Bot 與攻擊防禦模式啟用時機
- **Bot Fight Mode**：建議常態啟用（Free / Pro 方案皆支援），自動攔截常見掃描器與字典爆破機器人。
- **Under Attack Mode**：當遭受大規模七層 DDoS 攻擊造成伺服器負載升高時開啟，所有訪客進入網站前強制通過 5 秒 Managed Challenge。

---

## 3. 安全標頭評分自我檢驗 (Security Headers)

本系統 Middleware 預設於所有 HTTP 回應注入下列標頭，於 `securityheaders.com` 檢測可直接達到 **A / A+ 級標準**：
- `Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline'; ...; frame-ancestors 'none'; object-src 'none';`
- `Strict-Transport-Security: max-age=31536000; includeSubDomains; preload`
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy: camera=(), microphone=(), geolocation=()`
- `Cross-Origin-Opener-Policy: same-origin`
- `Cross-Origin-Resource-Policy: same-origin`
