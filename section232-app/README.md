# Section 232 Multi‑Source Finder (v2.1)

**重點修正：** 取消 `flexsearch` 外部依賴，改用內建 MinimalSearchEngine，避免在受限環境中因 CDN 模組載入失敗而無法建置。

## 功能
- **App1** 官方/權威入口卡片（USITC/CBP/BIS/FR/Regulations/QuantGov）
- **App2** 一次輸入關鍵字 → 產生多站最佳化搜尋連結
- **App3** API/CSV 直通車（USITC HTS REST、FR API、Regulations.gov、GovInfo Bulk、Data.gov CKAN 等）
- **App4** 索引搜尋（Beta）：載入 `search/index.json` 或使用內建樣本，零依賴全文檢索

## 專案結構
```
section232-app/
├─ netlify/
│  └─ functions/
│     ├─ refresh-hts.mjs          # 拉 HTS 匯出 → Netlify Blobs
│     ├─ refresh-fr232.mjs        # 拉 Federal Register 232 → Blobs
│     ├─ refresh-regs232.mjs      # 拉 Regulations.gov 232 → Blobs
│     └─ build-search-index.mjs    # 合併成 search/index.json
├─ public/
│  └─ sample-index.json           # App4 內建樣本（可直接載入）
├─ src/
│  ├─ App.tsx                     # React 主應用（4 個分頁）
│  └─ main.tsx
├─ index.html
├─ netlify.toml                   # Scheduled Functions（cron）
├─ package.json
├─ tsconfig.json
└─ vite.config.ts
```

## 本地開發
```bash
npm install
npm run dev
# 開啟 http://localhost:5173
```

## 佈署（Netlify）
1. **建立站台**：將此專案連到 Netlify（Git 或 ZIP 上傳）。  
2. **環境變數**（必要）：  
   - `REGS_API_KEY`：Regulations.gov v4 API 金鑰  
3. **功能服務**：Netlify 會依 `netlify.toml` 建立排程 Functions，產生並儲存資料到 **Netlify Blobs**。  
4. **App4** 索引端點：  
   - 預設使用 `/sample-index.json`（示範）  
   - 若開啟 Functions 與 Blobs，改用 `/.netlify/blobs/data/search/index.json`

> 若你需要 USITC DataWeb 的 API，請另外在 Functions 加上 Token 與抓取程式。

## 測試
- App4 內建 **測試按鈕**，會驗證：
  - 精確碼搜尋 `9903.81.90` 能命中 HTS 範例
  - 英文關鍵字 `ERW steel pipe` 能命中相關文件
  - CJK bigram 解析基本可用
- 你也可以替換 `public/sample-index.json` 補充更多樣本來擴充測試涵蓋率。

## 已知限制 / 待辦
- Tailwind 樣式未整合（僅 className，不影響功能）。如需完整樣式，可自行加入 Tailwind 設定。
- App4 搜尋目前偏向「OR 加權」，若需嚴格 AND 或前綴搜尋，我們可在引擎上加選項。

## 你期望的搜尋行為？
請回覆：
1) 欄位權重是否需要調整（目前 `title:3 / text:1 / type:0.5`）  
2) 關鍵字邏輯偏好（OR/AND、前綴匹配）  
3) 是否要對 HTS 代碼做前綴特化（例如輸入 `9903.81` 時，優先排名 `9903.81.xx`）
