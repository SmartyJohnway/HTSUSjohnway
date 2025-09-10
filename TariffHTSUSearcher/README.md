# HTSUSjohnway-main

> 綜合關稅/鋼鋁規範查詢 Web App（本文件由 AI 於 2025-09-10 自動生成並校對）

本專案整合 **HTSUS 稅則查詢**、**Section 232/301/201 等政策來源彙整**、以及 **（可選）Netlify Functions 代理 API**，用於在瀏覽器端快速檢索關鍵稅則與政府資料來源，並提供可延伸的資料處理與可視化能力。

---

## 目錄（檔案結構摘要）
```
HTSUSjohnway-main/
  .gitignore
  LICENSE
TariffHTSUSearcher/
  README.md
  _headers
  index.html
  netlify.toml
  package-lock.json
  package.json
  postcss.config.js
  robots.txt
  tailwind.config.js
  tariff_rules.json
  tsconfig.json
  __tests__/
    ch99.test.js
    compute.test.js
    footnote-judge.test.js
    hts-tree.test.js
    rate-parse.test.js
  infra/
    cache.js
    guard.js
  netlify/
    functions/
      build-search-index.mjs
      get-index.mjs
      hts-proxy.js
      refresh-fr232.mjs
      refresh-hts.mjs
      refresh-regs232.mjs
      usitc-proxy.js
  src/
    App.tsx
    index.js
    main.tsx
    styles.css
    apps/
      Section232SearchApp.tsx
      main-section232.tsx
    components/
      HtsDatabase.tsx
      ResearchTrailContent.tsx
      TariffQuery.tsx
      ui/
        Button.tsx
        Card.tsx
        Input.tsx
        Modal.tsx
        Popover.tsx
    context/
      NotificationContext.tsx
      ResearchTrailContext.tsx
      SearchContext.tsx
    core/
      ch99.js
      compute.js
      footnote-judge.js
      hts-tree.js
      rate-parse.js
    styles/
      tailwind.css
    ui/
      render-cards.js
      state.js
    utils/
      cache.ts
      escape.js
      text.js
```
> *已自動略過 node_modules、.git、build/dist 等暫存資料夾。*

---

## 技術棧與框架
- **語言**：TypeScript / JavaScript、HTML、CSS（Tailwind 可選）
- **前端框架**：（自動偵測未明確，可能為純前端或 React 系列）
- **建置工具**：（未偵測到 Vite/Parcel/Webpack，可能為純前端）
- **部署**：Netlify（`netlify.toml` 存在：否/未偵測）
- **伺服函式**：（未偵測到 netlify functions）

---

## 安裝與開發
1. **安裝套件**
   ```bash
   npm install
   ```
2. **本機開發**
   ```bash
   npm run dev
   ```
3. **建置**
   ```bash
   npm run build
   ```
4. **預覽/本機伺服**
   ```bash
   npm run preview
   ```

> 若 `package.json` 的 scripts 與上述不同，以下為實際偵測：
```json
{}
```

**Dependencies（擷取）**
```json
{}
```

---

## 功能模組與路由（推測與歸納）
- **首頁 / 導覽**
  - 提供多 App/模組的入口（如：HTSUS 稅則查詢、來源彙整 / Sources、政策法規連結集）。
- **HTSUS 稅則查詢**
  - 以 CSV/JSON 或 API 查詢稅則，支援關鍵字/章節（Chapter）/品目（Heading）過濾。
  - 重要語法：`fetch(...)` 取得資料 → `Array.filter/map/reduce` 整理 → DOM/React 渲染表格。
- **Section 232/301/201 來源彙整（Sources）**
  - 集中列出 BIS、CBP、USITC DataWeb、Federal Register 與白宮聲明等官方來源，提供跳轉與簡述。
  - 重要語法：靜態 JSON/TS 定義清單 + 類型註記 + 元資訊（url、說明、更新日）。
- **（可選）代理 API（Netlify Functions）**
  - 解決 CORS 或隱藏 API Key：`netlify/functions/*.js`
  - 重要語法（示例）：
    ```js
    export async function handler(event) {
      const url = new URL("https://api.example.com/resource");
      const r = await fetch(url.href);
      return { statusCode: 200, body: await r.text() };
    }
    ```

---

## 關鍵檔案說明
- `index.html`：入口 HTML（若存在），掛載前端程式。
- `src/**`：主要前端程式碼（元件、樣式、工具函式）。
- `public/**`：靜態資源（icons、資料檔）。
- `netlify/functions/**`：代理 API 與伺服端輕量邏輯。
- `data/**` 或 `assets/**`：資料檔（CSV/JSON）。
- `netlify.toml`：部署與 Functions 設定（路由、重寫、環境變數）。
- `.env.example`：環境變數樣板。

---

## 常見實作片段（語法速查）
- **以 `fetch` 讀取本地 CSV/JSON**
  ```js
  const res = await fetch('/data/htsus.json');
  const items = await res.json();
  const result = items.filter(x => x.chapter === '84' && /ERW/i.test(x.description));
  ```

- **查詢參數解析（純前端）**
  ```js
  const params = new URLSearchParams(location.search);
  const q = params.get('q') || '';
  ```

- **表格分頁與排序（前端）**
  ```js
  const pageItems = items.slice(page*size, (page+1)*size);
  const sorted = [...items].sort((a,b) => a.code.localeCompare(b.code));
  ```

- **以 Netlify Functions 代理外部 API**
  ```js
  // netlify/functions/hts-proxy.js
  export async function handler(event) {
    const target = new URL('https://api.trade.gov/hts/search?q=' + encodeURIComponent(event.queryStringParameters.q || ''));
    const r = await fetch(target, { headers: { 'User-Agent': 'HTSUS App' } });
    return { statusCode: r.status, body: await r.text(), headers: { 'content-type': r.headers.get('content-type') || 'application/json' } };
  }
  ```

---

## 部署（Netlify）
1. 連結 GitHub 儲存庫。
2. Build 指令：`npm run build`；Publish 目錄視框架而定（如 `dist/` 或 `build/`）。
3. Functions：`netlify/functions` 自動偵測（或於 `netlify.toml` 指定）。
4. 環境變數：於 Netlify 網站 **Site settings → Environment variables** 設定。

---

## 開發建議
- 保持資料目錄與程式碼分離：`/data` 放 CSV/JSON；/src 寫邏輯。
- 強化型別與單元測試：以 TypeScript + Vitest/Jest 覆蓋關鍵工具函式。
- 以 Lazy Loading/Route-level Code Splitting 減少首屏包大小。
- 加上 PWA（離線查詢常用章節/清單、安裝到桌面）。

---

*此 README 依照倉庫實際掃描結果自動產生。如需更貼合你們內部命名與模組邏輯，可在此基礎上微調與補充。*
