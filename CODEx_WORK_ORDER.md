# CODEx_WORK_ORDER — 合併 `section232-app` 功能至 `TariffHTSUSearcher/Sources` 子套件
> 版本：2025-09-09 05:45:46（UTC）  
> 提供對象：GitHub Copilot / OpenAI Codex（VS Code）  
> 作者：Dr. J 專案（HTSUS / Section 232/301 工具整合）

---

## 0) 背景與目標（What/Why）
- **現況**
  - `TariffHTSUSearcher/`：Vanilla JS + Tailwind 的純前端工具，具 **App1（自建關稅規則查詢）**、**App2（USITC REST via Netlify Function 代理）**、**Sources（來源彙整）** 等。
  - `section232-app/`：React + TypeScript + Vite，包含四個子功能：
    - **App1：資料來源入口（Sources Hub）**
    - **App2：多來源搜尋器（Multi-Source Search）**
    - **App3：API/CSV 直通車（APIs & Datasets）**
    - **App4：索引搜尋 Beta（MinimalSearchEngine with CJK Bigram）**，後端以 Netlify Functions + Blobs 排程產製索引。
- **目標**
  1. 將 `section232-app` 的 **App1~App4** 功能完整移植（無缺漏）到 **`TariffHTSUSearcher` 專案內的「Sources」頁面**之下一層，形成 **「Sources Suite」**（四個子分頁）。
  2. **整併 GitHub 倉庫**：以 **單一倉庫/單一根資料夾 `TariffHTSUSearcher/`** 為主，不再保留第二個專案資料夾。
  3. 整合/移植 `section232-app/netlify/functions/*.mjs` 的資料擷取與索引建置排程，於 `TariffHTSUSearcher/netlify/functions/` 執行。
  4. 在移植後的每個來源（App1~App4）**附上簡短用途說明**與使用指引（UI 說明）。

---

## 1) 成品定義（Definition of Done / 驗收標準）
- `TariffHTSUSearcher/` 中的 **Sources** 區域新增一個子套件 **Sources Suite**，內含四個子分頁：**App1、App2、App3、App4（Beta）**，功能對應如下：
  - App1：集中列出官方/權威來源的**入口與說明**；可快速打開新分頁。
  - App2：使用者輸入一次關鍵字，即可**一鍵生成多站搜尋 URL**（USITC/CBP/BIS/FR/Regulations/DataWeb…）並打開。
  - App3：收錄**官方 API/CSV/Docs** 的固定連結；提供快速前往（附簡述）。
  - App4（Beta）：前端可**載入 MinimalSearchEngine 的索引**並執行關鍵字查詢；索引來源由 Netlify Functions 週期產生，並可由前端 API 讀取。
- `netlify/functions/` 內可運作：
  - `hts-proxy.js`（保留現有代理）
  - `refresh-hts.mjs`、`refresh-fr232.mjs`、`refresh-regs232.mjs`、`build-search-index.mjs`（可執行，並以 `netlify.toml` cron 觸發）
  - （可選）`get-index.mjs`：前端以 `/.netlify/functions/get-index` 取得索引 JSON
- `netlify.toml` 合併設定成功（base/publish/functions/redirects/cron）。
- README/Docs 更新（含使用說明、維運注意、資料來源法遵聲明）。
- E2E 測試路徑：1) App2 產出 URL 正確；2) App4 能載入索引並回傳結果；3) Netlify 部署成功，Functions 可呼叫；4) Sources 說明區塊完整。

---

## 2) 目標目錄結構（Target Layout，重點節錄）
```
TariffHTSUSearcher/
├─ index.html
├─ js/
│  ├─ main.js
│  ├─ app1.js               # 既有：自建關稅規則查詢
│  ├─ app2.js               # 既有：USITC REST via proxy
│  ├─ infra/
│  │  ├─ guard.js
│  │  └─ cache.js
│  └─ sources-suite/        # ★ 新增：Sources 子套件（原 section232-app App1~4）
│     ├─ sources-suite.js   # 入口/初始化（管理四子分頁）
│     ├─ app1_sources.js    # 資料來源入口/說明
│     ├─ app2_multisearch.js# 多來源搜尋器（URL 生成）
│     ├─ app3_datasets.js   # 官方 API/CSV/Docs 連結
│     └─ app4_minimal_se.js # MinimalSearchEngine 前端（Beta）
├─ netlify/
│  └─ functions/
│     ├─ hts-proxy.js
│     ├─ refresh-hts.mjs
│     ├─ refresh-fr232.mjs
│     ├─ refresh-regs232.mjs
│     ├─ build-search-index.mjs
│     └─ get-index.mjs      #（可選，若選擇由 Function 提供索引）
├─ data/
│  └─ tariff_rules.json
├─ dist/
│  └─ tailwind.css
├─ tailwind.config.js
├─ postcss.config.js
├─ netlify.toml             # 合併後的唯一設定
└─ README.md
```

---

## 3) App1~App4「來源與功用」說明（可直接放進 UI）
> 供 Codex 直接嵌入 `app1_sources.js`、`app2_multisearch.js`、`app3_datasets.js` 的說明字串

### App1：資料來源入口（Sources Hub）
- **用途**：集中列出與關稅/232/301 相關的**官方與權威**查詢入口，提供一鍵前往。
- **何時使用**：需要**原始權威來源**做最終核對或延伸閱讀。
- **典型內容**：USITC HTS、CBP（關務）、BIS（工業與安全局）、Federal Register（聯邦公報）、Regulations.gov（法規意見稿）、USITC DataWeb、QuantGov 等。
- **提醒**：**一切以官方為準**；本工具僅為導覽與輔助。

### App2：多來源搜尋器（Multi-Source Search）
- **用途**：輸入一次關鍵字，快速生成各網站最佳化搜尋連結（含 `site:` 或特定路徑條件）。
- **何時使用**：要**快速橫向比對**多個權威站點的結果或公告。
- **範例**：`steel pipe 7306` → 同時打開 USITC/CBP/BIS/FR/Regs/DataWeb 的搜尋頁。

### App3：API/CSV 直通車（APIs & Datasets）
- **用途**：匯集官方 API、CSV、開放資料與其**文件**的入口，便於**開發與批次分析**。
- **何時使用**：開發自動化查詢、批次抓取、或需要欄位定義/模式（schema）時。
- **提醒**：注意**使用條款/速率限制/授權**；依站方規範使用。

### App4（Beta）：索引搜尋（MinimalSearchEngine）
- **用途**：以極輕量索引支援快速搜尋（支援 ASCII token + **CJK bigram**），將 `HTS/FR/Regs` 等彙整後的精華文本存入索引。
- **資料流**：Netlify Functions 週期抓取（refresh-*.mjs）→ 整理（build-search-index.mjs）→ 儲存（Blobs/KV）→ 前端載入（`get-index.mjs` 或公開 URL）。
- **何時使用**：要在單一介面**快速篩查**已彙整的重點資料，而非逐站查詢。
- **提醒**：屬**輔助性**檢索；**不替代**官方全文或法規文件。

---

## 4) UI/前端整合設計（Vanilla JS）
### 4.1 `index.html`（在「Sources」區域內新增子分頁）
在現有的「來源彙整（Sources）」容器下方插入以下區塊（Codex 需找到對應容器並追加）：
```html
<!-- Sources Suite Tabs -->
<section id="sources-suite" class="mt-6">
  <div class="border-b flex gap-2 text-sm">
    <button class="px-3 py-2" data-suite-tab="suite-app1">App1 來源入口</button>
    <button class="px-3 py-2" data-suite-tab="suite-app2">App2 多來源搜尋</button>
    <button class="px-3 py-2" data-suite-tab="suite-app3">App3 API/CSV</button>
    <button class="px-3 py-2" data-suite-tab="suite-app4">App4 索引搜尋(Beta)</button>
  </div>

  <div id="suite-app1" class="mt-4 hidden"></div>
  <div id="suite-app2" class="mt-4 hidden"></div>
  <div id="suite-app3" class="mt-4 hidden"></div>
  <div id="suite-app4" class="mt-4 hidden"></div>
</section>
```

### 4.2 `js/main.js`（初始化 Sources Suite）
在現有初始化流程中，於 **切到 Sources 分頁時** 呼叫：
```js
import { initializeSourcesSuite } from './sources-suite/sources-suite.js';

function initializeSources() {
  // 既有 Sources 初始化...
  initializeSourcesSuite(); // ★ 新增：啟動四個子頁面
}
```

### 4.3 `js/sources-suite/sources-suite.js`（入口骨架）
```js
// js/sources-suite/sources-suite.js
import { renderApp1 } from './app1_sources.js';
import { renderApp2 } from './app2_multisearch.js';
import { renderApp3 } from './app3_datasets.js';
import { renderApp4 } from './app4_minimal_se.js';

export function initializeSourcesSuite() {
  const tabs = document.querySelectorAll('#sources-suite [data-suite-tab]');
  const panels = {
    'suite-app1': document.getElementById('suite-app1'),
    'suite-app2': document.getElementById('suite-app2'),
    'suite-app3': document.getElementById('suite-app3'),
    'suite-app4': document.getElementById('suite-app4'),
  };

  // Lazy render on first visit
  const rendered = new Set();

  function show(id) {
    Object.values(panels).forEach(el => el.classList.add('hidden'));
    panels[id].classList.remove('hidden');
    if (!rendered.has(id)) {
      if (id === 'suite-app1') renderApp1(panels[id]);
      if (id === 'suite-app2') renderApp2(panels[id]);
      if (id === 'suite-app3') renderApp3(panels[id]);
      if (id === 'suite-app4') renderApp4(panels[id]);
      rendered.add(id);
    }
  }

  tabs.forEach(btn => {
    btn.addEventListener('click', () => show(btn.dataset.suiteTab));
  });

  // default
  show('suite-app1');
}
```

### 4.4 `js/sources-suite/app2_multisearch.js`（核心邏輯示例）
```js
// build search URL helpers
function q(s) { return encodeURIComponent(s || ''); }
const ENGINES = [
  { id: 'usitc', label: 'USITC HTS', url: (kw) => `https://hts.usitc.gov/?query=${q(kw)}` },
  { id: 'cbp',   label: 'CBP CROSS/Guidance', url: (kw) => `https://www.cbp.gov/trade/search?search_api_fulltext=${q(kw)}` },
  { id: 'bis',   label: 'BIS', url: (kw) => `https://www.bis.doc.gov/index.php?option=com_search&searchword=${q(kw)}` },
  { id: 'fr',    label: 'Federal Register', url: (kw) => `https://www.federalregister.gov/search?term=${q(kw)}` },
  { id: 'regs',  label: 'Regulations.gov', url: (kw) => `https://www.regulations.gov/search?query=${q(kw)}` },
  // 可按需擴增...
];

export function renderApp2(root) {
  root.innerHTML = `
    <p class="text-sm mb-3">用途：輸入一次關鍵字，自動生成多站搜尋連結；請以官方原文為準。</p>
    <div class="flex gap-2 items-center">
      <input id="ms-keyword" class="border px-2 py-1 flex-1" placeholder="輸入關鍵字，如 7306 steel pipe">
      <button id="ms-open" class="px-3 py-1 border rounded">開啟全部</button>
    </div>
    <ul id="ms-list" class="mt-3 space-y-1"></ul>
  `;

  const kw = root.querySelector('#ms-keyword');
  const list = root.querySelector('#ms-list');
  const btn = root.querySelector('#ms-open');

  function renderList() {
    list.innerHTML = ENGINES.map(e => `
      <li class="text-sm">
        <a class="underline" target="_blank" href="${e.url(kw.value)}">→ ${e.label}</a>
      </li>`).join('');
  }
  kw.addEventListener('input', renderList);
  btn.addEventListener('click', () => ENGINES.forEach(e => window.open(e.url(kw.value), '_blank')));
  renderList();
}
```

### 4.5 `js/sources-suite/app4_minimal_se.js`（索引載入入口骨架）
```js
// 以 Netlify Function 提供索引：/.netlify/functions/get-index
async function fetchIndex() {
  const res = await fetch('/.netlify/functions/get-index');
  if (!res.ok) throw new Error('index fetch failed');
  return res.json();
}

function tokenizeCJK(str) {
  const out = [];
  for (let i = 0; i < str.length - 1; i++) out.push(str.slice(i, i+2));
  return out;
}

export async function renderApp4(root) {
  root.innerHTML = '<p class="text-sm">Beta：載入索引中…</p>';
  try {
    const index = await fetchIndex(); // { docs: 必須配合後端 Function/Blobs 提供 }
    // TODO：根據 index 結構實作查詢與排名（TF/權重）；此處留待填充
    root.innerHTML = `
      <div class="mb-2 text-sm">用途：快速檢索彙整資料（不替代官方全文）。</div>
      <input id="se-q" class="border px-2 py-1" placeholder="輸入關鍵字">
      <button id="se-run" class="px-2 py-1 border rounded">搜尋</button>
      <ul id="se-out" class="mt-3 space-y-2"></ul>
    `;
    // Codex：在此補上 query() 與渲染結果
  } catch (e) {
    root.innerHTML = '<div class="text-red-600 text-sm">索引載入失敗，請稍後重試或檢查 Functions。</div>';
    console.error(e);
  }
}
```

---

## 5) 後端整合（Netlify Functions）
### 5.1 來源
- 保留現有：`netlify/functions/hts-proxy.js`
- 從 `section232-app/netlify/functions/` 搬移：
  - `refresh-hts.mjs` / `refresh-fr232.mjs` / `refresh-regs232.mjs`：抓取資料，寫入 **Netlify Blobs/KV**
  - `build-search-index.mjs`：彙整與建置 MinimalSearchEngine 所需索引（JSON）
  - （新增）`get-index.mjs`：讀取 Blobs 返回索引給前端

### 5.2 `netlify.toml` 合併（示例）
```toml
[build]
  base = "TariffHTSUSearcher"
  publish = "."
  functions = "netlify/functions"

# SPA 轉址
[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200

# Cron（UTC）
[[scheduled.functions]]
  name = "refresh-hts"
  cron = "0 3 * * *"

[[scheduled.functions]]
  name = "refresh-fr232"
  cron = "30 3 * * *"

[[scheduled.functions]]
  name = "refresh-regs232"
  cron = "0 4 * * *"

[[scheduled.functions]]
  name = "build-search-index"
  cron = "0 5 * * *"
```

> 提示：若使用 **Netlify Blobs/KV**，請於專案設定開啟對應實驗/附加元件；`get-index.mjs` 以官方 SDK 讀取後回傳 JSON。

---

## 6) 重構/搬移步驟（建議以多個小 PR 逐步完成）
1. **建立分支**：`feat/merge-section232-into-sources`
2. **複製 Functions**：將 `section232-app/netlify/functions/*.mjs` 置於 `TariffHTSUSearcher/netlify/functions/`，補上 `get-index.mjs`（若前端走 API）。
3. **合併 netlify.toml**：加入 `[[scheduled.functions]]`；確認 `build`、`publish`、`functions` 指向正確。
4. **新增前端檔**：建立 `js/sources-suite/` 與四個子模組 + 入口（見 §4）。
5. **調整 index.html / main.js**：插入子分頁 DOM、初始化 `initializeSourcesSuite()`。
6. **填入 App1~3 資料內容**：以常數陣列維護來源清單（label、url、描述），供 UI 渲染。
7. **實作 App4 查詢**：依實際索引結構補上 ranking/渲染；確認 `/.netlify/functions/get-index` 可用。
8. **README/Docs**：更新整合後使用方式、維運、法遵聲明。
9. **測試與修正**：本地 `netlify dev`；檢查 Functions/cron；在試營運環境驗證。
10. **PR 審核與合併**：合併至 `main`；標註 release note。

---

## 7) 測試清單（QA）
- 前端
  - 切換 Sources Suite 四分頁無誤；App2 產生的 URL 正確且能打開。
  - App3 清單連結可用；描述完整。
  - App4：索引下載成功、輸入關鍵字可得可解釋之結果。
- 後端
  - Functions 可獨立觸發；Cron 生效（或以 CLI/Netlify UI 手動觸發）。
  - `build-search-index` 產出之索引大小與份量在可控範圍（避免前端載入過慢）。
- 部署
  - Netlify 部署成功；路由/代理正常；無 404/500。

---

## 8) 法遵與聲明（UI 須顯示）
- 本工具**僅為研究與輔助**；一切以**官方法規與公告**為準。
- API/資料之**授權/速率限制/使用條款**請遵循各來源規範；請勿濫用。

---

## 9) 提交指引（給 VS Code/Codex）
- 請嚴守檔案路徑與命名（見 §2）。
- 每一步以小提交（small commits）進行，訊息前綴：
  - `feat(sources-suite): ...`
  - `chore(functions): ...`
  - `docs: ...`
- 遵循現有程式碼風格；避免引入 React 依賴至 Vanilla 區。
- 發現跨檔重複工具（e.g., fetch 包裝/guard），先**不重構**；待功能就緒再統一收斂。

---

## 10) 附錄：App1~3 資料模板（Codex 可直接放入）
```js
// app1_sources.js / app3_datasets.js 中可用資料結構
export const SOURCES = [
  { label: 'USITC HTS', url: 'https://hts.usitc.gov/', desc: '美國 HTS 官方查詢入口。' },
  { label: 'CBP', url: 'https://www.cbp.gov/', desc: '美國海關與邊境保護局，分類/裁定與關務指引。' },
  { label: 'BIS', url: 'https://www.bis.doc.gov/', desc: '工業與安全局，出口管制/規則/公告。' },
  { label: 'Federal Register', url: 'https://www.federalregister.gov/', desc: '聯邦公報，最終規則/臨時措施/公告。' },
  { label: 'Regulations.gov', url: 'https://www.regulations.gov/', desc: '法規草案與意見徵詢平台。' },
  // ...視需要擴增
];
```

---

### 備註
- 若後端索引改由**靜態檔案**（例如 `public/index.json`）提供，可移除 `get-index.mjs`，改走 CDN/靜態路徑載入。
- 若 `section232-app` 既有程式有更完整的 MinimalSearchEngine 排序/高亮規則，請直接移植其演算法與資料結構；本工作單先提供骨架與掛鉤。