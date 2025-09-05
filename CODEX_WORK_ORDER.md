# CODEX_WORK_ORDER.md

> **單一依據**：以 `HTSUSjohnway-main.zip` 為**主系統**（已可部署的 Web App），`section232-app.zip` 僅作**參考與資產來源**（樣式、元件、腳本），逐步吸收其功能到主系統。

---

## 1) 專案任務與範圍
把既有 **HTSUSjohnway-main** 擴充為一站式關稅工具：
- 支援**中/英自然語言**輸入→產生 **HTSUS 候選碼（Top-N）**。
- 套用 **Section 201 / 301 / 232 / IEEPA 對等關稅**，輸出 **Chapter 99**、**疊加/不疊加**與**最終稅負算式**。
- 以 **CBP CROSS 裁決**作為**真實判例**驗證與說理。
- 全部資訊以 **官方最新公告**為準（USITC HTS、Federal Register、USTR、BIS/DOC、CBP）。

> 內部使用、Netlify 部署；避免付費 Token。

---

## 2) 採用工具與資料來源（無變）
- **AI / NLP**
  - **LibreTranslate**（開源翻譯）：中⇄英；公共節點或自建 Docker。
  - **Transformers.js + ONNX Runtime Web (WebGPU)**：瀏覽器端跑文字分類/檢索，無需 API Key。
  - **AdvaitBERT (HS Code AI Explainability)**：作為**可解釋/輔助**與離線參考（可在 HF Spaces 部署 Demo）。
- **官方資料（權威）**
  - **USITC HTS**：JSON/CSV/XLS + Revision/Change Record（**唯一權威**的條文與基礎稅率）。
  - **Federal Register API / GovInfo**：抓取 **Proclamations / EO / Notices** + 正式 PDF。
  - **USTR**：Section 301 清單與排除（含 9903.88.xx 與到期日）。
  - **BIS/DOC/CBP**：Section 232（鋼/鋁/銅）公告、FAQ、CSMS。
  - **CBP CROSS**：裁決資料庫（作為「真實判例」）。

---

## 3) 目錄/架構（以 HTSUS 為主）
```
/apps
  /htsus/HTSUSjohnway-main     # ★ 主站原始碼（已可部署）
  /section232-reference        # 參考專案（section232-app 解壓後置於此；只抽取需要的元件/樣式/腳本）

/netlify/functions             # Netlify Functions（抓資料/代理/CROSS）
/public/models                 # ONNX/詞典/索引（供前端 Transformers.js 使用）
/data                          # 由 Functions 產生的 JSON（HTS 索引、章99映射、FR 清單等）

netlify.toml                   # 根層 Netlify 設定（build、functions、排程）
README.md
CODEX_WORK_ORDER.md            # 本文件
```

> `section232-reference` 僅供參考，不直接部署；逐步把其中有用的 UI/邏輯整併進主站。

---

## 4) Build/Deploy（以 HTSUS 為主）
- **建置**：若 `HTSUSjohnway-main` 為純靜態站（HTML/CSS/JS），Netlify 可直接發佈該目錄；
  - 若存在打包流程（如 Vite/Webpack），以其 `build` 指令為主，發佈到 `dist/`。
- **部署目標**：`apps/htsus/HTSUSjohnway-main` 為 Netlify **publish** 目錄；
- **Node 版本**：`NODE_VERSION=18`（或與主站現況一致）。
- **資產**：`/public/models` 與 `/data` 以 Netlify Copy/Artifacts 方式部署到主站可讀路徑。

---

## 5) Netlify Functions（新增於根層，供主站使用）
> 以無金鑰為原則，全部走官方開放 API 或自建服務。

- `netlify/functions/refresh-hts.mjs`
  - 從 **USITC** 抓取最新 HTS JSON/CSV + Revision/Change Record。
  - 產出：`/data/hts_catalog.json`、`/data/hts_change_log.json`。
- `netlify/functions/scan-fr.mjs`
  - 用 **Federal Register API** 以關鍵字（232/201/301/IEEPA/Chapter 99）與文件型別（Proclamation/Notice/EO）週期拉取。
  - 產出：`/data/fr_actions.json`（含文件號、連結、生效/到期日）。
- `netlify/functions/regs-resolve.mjs`
  - 把 FR 公告解析為**章 99**映射、**疊加/不疊加**規則（232 鋼/鋁 50%、232 銅 50%、301 排除延長等）。
  - 產出：`/data/reg_matrix.json`（201/301/232/IEEPA → Chapter 99 → 算式）。
- `netlify/functions/cross.mjs`
  - 代理查詢 **CBP CROSS**（以候選 HTS + 關鍵詞）；回傳裁決摘要/鏈結。
- `netlify/functions/translate.mjs`
  - 代理 **LibreTranslate**（可改用自建節點）；避免瀏覽器直連公共端點的 CORS/節流問題。

**排程（`netlify.toml`）**
```toml
[functions]
  node_bundler = "esbuild"
  directory = "netlify/functions"

[build.environment]
  NODE_VERSION = "18"

# 每日 02:00 UTC 抓 HTS；每 6 小時掃描 FR；每日 05:00 解析規則
[[scheduled.functions]]
  name = "refresh-hts"
  cron = "0 2 * * *"

[[scheduled.functions]]
  name = "scan-fr"
  cron = "0 */6 * * *"

[[scheduled.functions]]
  name = "regs-resolve"
  cron = "0 5 * * *"
```

---

## 6) 前端整合（直接落在 HTSUS 主站）
- **單一搜尋框（中/英）** → 流程：
  1. 送 `/api/translate`（若為中文）→ 英文描述；
  2. 前端 **Transformers.js + ONNX**：對 **HTS 條文/附註**與**歷史關鍵詞**建索引，輸出 **Top-N 候選碼**；
  3. 送 `/api/cross`：以候選碼+關鍵詞抓取 **CROSS** 最近裁決（近 10 年）；
  4. 讀 `/data/reg_matrix.json`：計算 **201/301/232/IEEPA** 套用、**章99**、**疊加/不疊加**與**最終稅負算式**；
  5. 顯示三層卡片：**候選 HTS**｜**規制/章99**｜**判例**，並附上 **USITC/FR/CBP/USTR** 原文鏈結與日期。
- **雙語策略**：關鍵 UI 採雙語字串，其餘交給瀏覽器翻譯；HTS 條文**保留英文原文**並可選擇顯示機器翻譯。

---

## 7) 規則重點（必須程式化的條文/日期）
- **Section 232 鋼/鋁**：Proclamation 10947（2025‑06‑04 起課 **50%**；與 **對等關稅**有**不疊加**條款；材質分攤；不得 drawback）。
- **Section 232 銅**：Proclamation 10962（2025‑08‑05 FR 刊登；銅與衍生品 **50%**，僅就銅含量部分）。
- **Section 301（中國）**：USTR 2025‑08‑28 公告延長部分排除至 **2025‑11‑29**（9903.88.xx）。
- **IEEPA 對等關稅**：EO 14257（2025‑04‑02；7/31 修正）；基準 10%，與 232 之 **不疊加**依 FR/CBP FAQ 實作。
- **Section 201**：太陽能/洗衣機等全球保障措施；若碰到，顯示 TRQ/期限與 FR 依據。

> **原則**：任何稅負輸出都必須同頁標示 **FR 文件號/USITC Revision/公告日期**。

---

## 8) 測試集（首批）
- **ERW / OCTG 鋼管**：以用途/製程/材質/端部逐筆驗證（7306 vs 7304 vs OCTG 細目）。
- **製管設備**：成形機（8462.x）、高頻焊機（8515.21）、水壓測試機（9024.80）等。
- **部件**：管模/輥具（8207.x）、電動機（8501.x）、線纜（8544.x → 涉 232 銅）。
- 每筆核對 **CROSS** 與 **最終章99** 算式。

---

## 9) 實作優先序（給 Codex）
1. **把主站（HTSUSjohnway-main）保留原功能不變**，新增：
   - `/data/**` 的讀取與「資料版號（Revision/FR 日期）」顯示。
   - 單一搜尋框 + 三層卡片 UI（可先以原 UI 風格實作，樣式從 `section232-reference` 借用）。
2. **Functions**：`refresh-hts` → `scan-fr` → `regs-resolve` → `cross` → `translate`。
3. **Transformers.js 植入**：先上 **嵌入檢索/關鍵詞匹配** 產生 Top‑N，再逐步調 AdvaitBERT Demo 作解釋面板。
4. **驗證**：用測試集跑出「候選→規制→章99→算式」並人工覆核。

---

## 10) 注意事項
- `section232-reference` **不部署**；僅抽取 UI/腳本逐步移植到主站。
- 任何本地舊檔（例：`tariff_rules.json`）**只作範例**，**不得**作為演算依據。
- 所有對外顯示的規則/稅率，**必須同頁提供**官方來源與日期。

