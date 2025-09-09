# ODEx_WORK_ORDER.md — Section 232 多來源查詢（App1~App6）整合與替換作業單

> 目標：在 **不影響既有功能的前提** 下，導入新元件 **Section232SearchApp.tsx**（含 App1~App6），並依據三種情境完成整合：  
> (A) **保留原首頁**的「關稅查詢」與「HTSUS 稅則資料庫 (API)」，只**取代「官方來源」底下的 app1~app4**（改為新 App1~App6 全顯示）  
> (B) **全面替換首頁**為新元件（App1~App6 全顯示）  
> (C) **新增獨立頁面**，App1~App6 **全部顯示**，同時保留原首頁（提供連結導流）

---

## 一、專案現況（請先核對）
- 入口為靜態頁 `index.html` + ESM 腳本 `src/index.js`（**無 React 打包流程**）。
- Netlify 設定：`netlify.toml` 目前為 `command = "echo 'No build command required'"`、`publish = "."`。
- 新元件：`src/apps/Section232SearchApp.tsx`（已由使用者上傳）。
- Tailwind：以 CDN 注入（或請檢查現有樣式載入方式）。

> 本工單採 **最小侵入法**：導入 `esbuild` 與 TSX 入口，輸出一支前端 ESM bundle，供新頁/區塊載入。

---

## 二、通用準備（A/B/C 共用）

### 1) package.json（新增最小依賴與腳本）
在 `package.json` 增加：
```jsonc
{
  "dependencies": {
    "react": "^18.3.1",
    "react-dom": "^18.3.1"
  },
  "devDependencies": {
    "esbuild": "^0.23.0",
    "typescript": "^5.4.0",
    "@types/react": "^18.2.66",
    "@types/react-dom": "^18.2.22"
  },
  "scripts": {
    "build:section232": "esbuild src/apps/main-section232.tsx --bundle --minify --format=esm --outfile=assets/section232-app.js",
    "build": "npm run build:section232"
  }
}
```

### 2) `tsconfig.json`（專案根目錄新增）
```jsonc
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "jsx": "react-jsx",
    "strict": true,
    "skipLibCheck": true
  },
  "include": ["src/**/*"]
}
```

### 3) React 入口（新增）
建立 `src/apps/main-section232.tsx`：
```tsx
import React from "react";
import { createRoot } from "react-dom/client";
import Section232SearchApp from "./Section232SearchApp";

const mount = document.getElementById("section232-root");
if (mount) {
  createRoot(mount).render(<Section232SearchApp />);
}
```

### 4) Netlify 建置（更新）
將 `netlify.toml` 的 build 指令改為：
```toml
[build]
  base    = "TariffHTSUSearcher"
  command = "npm run build"
  publish = "."
```
> 讓部署時自動執行 `esbuild`，輸出 `assets/section232-app.js`。

### 5) Tailwind（若使用 CDN）
確認新頁面/區塊的 HTML 中包含：
```html
<script src="https://cdn.tailwindcss.com"></script>
```

---

## 三、三種導入情境與操作

### (A) 保留原「關稅查詢」與「HTSUS 稅則資料庫 (API)」，只取代「官方來源」底下 app1~4
**策略**：維持首頁原有兩大功能版塊不變；將「官方來源」區塊替換為一個 **React 承載容器**，在該容器中掛載 **新 App（App1~App6 全顯示）**。

1) **建立承載容器頁（或區塊）**
   - 若「官方來源」原本是獨立頁面，將其檔案（例如 `official-sources.html`）改為：
     ```html
     <!doctype html>
     <html lang="zh-Hant">
     <head>
       <meta charset="utf-8" />
       <meta name="viewport" content="width=device-width,initial-scale=1" />
       <title>官方來源（升級版）</title>
       <script src="https://cdn.tailwindcss.com"></script>
     </head>
     <body class="bg-gray-50">
       <!-- React 掛載點： -->
       <div id="section232-root"></div>
       <!-- 打包輸出檔 -->
       <script type="module" src="./assets/section232-app.js"></script>
     </body>
     </html>
     ```
   - 若「官方來源」只是首頁的一個區塊，請將該區塊的 HTML 改為：
     ```html
     <section id="official-sources" class="...">
       <div id="section232-root"></div>
       <script type="module" src="./assets/section232-app.js"></script>
     </section>
     ```
     > 若首頁已有其他腳本，請確保不要重複載入 React。

2) **移除舊 app1~app4 的 DOM/JS**（僅限「官方來源」區塊）  
   - 刪除/註解舊的連結陣列或舊 JS 綁定，避免雙重 UI。  
   - 保留首頁其餘模組（「關稅查詢」、「HTSUS 稅則資料庫 (API)」等）**原樣不動**。

3) **結果**：首頁仍保留既有兩大功能；點進「官方來源」或在該區塊即能看到 **新 App1~App6 全部分頁**（取代原本 app1~4）。

---

### (B) 全面替換首頁（新 App1~App6 全部顯示）
**策略**：將新 React 介面直接作為首頁。

1) 將下列內容存為 `index.html`（如需備份原首頁，請先將舊檔另存 `index.legacy.html`）：
```html
<!doctype html>
<html lang="zh-Hant">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>Section 232 多來源查詢（首頁）</title>
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-gray-50">
  <div id="section232-root"></div>
  <script type="module" src="./assets/section232-app.js"></script>
</body>
</html>
```

2) 確認部署後，首頁即為 **App1~App6** 的新介面。

---

### (C) 新增獨立頁面（保留原首頁）+ App1~App6 全顯示
**策略**：不動現有首頁；新增一個新頁面 `section232.html`，提供導流連結。

1) 新增 `section232.html`：
```html
<!doctype html>
<html lang="zh-Hant">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>Section 232 多來源查詢（新版）</title>
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-gray-50">
  <div id="section232-root"></div>
  <script type="module" src="./assets/section232-app.js"></script>
</body>
</html>
```

2) 在現有首頁（`index.html`）醒目位置加入連結：
```html
<a href="/section232.html" class="text-blue-600 underline">
  👉 前往 Section 232 多來源查詢（新版 App1~App6）
</a>
```

> 如需自動導流，可在首頁 `<head>` 加入：  
> `<meta http-equiv="refresh" content="0; url=/section232.html">`  
> 或在 `netlify.toml` 新增 redirect（留意既有規則）。

---

## 四、驗收清單（A/B/C 皆需）
- Netlify build 成功，產生 `assets/section232-app.js`
- 新頁面或新區塊能正常載入 React 介面
- App1：官方來源卡片能帶入關鍵字、連結可用
- App2：多來源搜尋矩陣 URL 正確
- App3：API/CSV 端點顯示與複製功能正常
- App4：可載入 sample index → 搜尋 → 顯示測試結果
- App5（如使用）：貼入 DataWeb API 金鑰可取得 JSON（若 CORS 問題，後續加 proxy）
- App6：公告連結可開啟
- （A 情境）首頁之「關稅查詢」與「HTSUS 稅則資料庫 (API)」功能 **不受影響**

---

## 五、後續可選（如遇 CORS 或要加速）
- **Netlify Functions proxy**：對外部 API（如 DataWeb）建立 `/netlify/functions/*` 代理，處理 Auth 與 CORS。
- **快取策略**：對不易變動之清單採用 `stale-while-revalidate`。
- **索引檔**：將 `App4` 之索引 JSON 轉為靜態檔並排程更新（可用現有的 `[[scheduled.functions]]` 流程）。

---

## 變更摘要
- 新增：`src/apps/main-section232.tsx`、`tsconfig.json`
- 調整：`package.json`（dependencies、devDependencies、scripts）
- 調整：`netlify.toml`（build.command 改為 `npm run build`）
- 新增或修改頁面：
  - (A) 取代「官方來源」區塊/頁面 DOM 為 React 掛載容器
  - (B) `index.html` → 改為 React 版首頁
  - (C) 新增 `section232.html`，在首頁加入導流連結
