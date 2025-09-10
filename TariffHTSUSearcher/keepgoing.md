# keepgoing.md — 專案後續強化建議（鋼鐵產業專業經理人 × UI/UX 程式設計）

> 角色視角：出口 **ERW 鋼管**／**OCTG**、**ERW 製造設備與周邊**、**鋼捲原物料** 之專業經理人；結合資深前端/全端架構師對 UI/UX 與工程實作的落地方案。

## 一、當前痛點與缺口（以實務流程對照）
1. **多來源資料分散、版本不一致**
   - HTSUS 章節、臨時條款（Chapter 99）、Section 232/301/201 措施、BIS/CBP 公告、USITC DataWeb 統計等，更新頻率與格式不一，手動核對成本高。
2. **缺少交易決策所需的「上下文關聯」**
   - 稅則 → 加徵 → 排除 → 生效區間 → 原產地/出口國 → 最終客戶用途（OCTG vs 機械用）之關聯需一次看懂。
3. **實務輸出不足**
   - 報價單、關務備查附件、內部審核表單（合規 checklist）尚未自動化產出。
4. **CORS/速率限制/憑證保護**
   - 直接呼叫部分 API 受限，缺少穩定的代理層與快取策略。
5. **資料可信度追溯**
   - 缺少「來源指紋」（URL、抓取時間、版本號、法規引用段落）以備稽核。

## 二、應新增/強化的功能（落地優先序）
### P0（立即提升決策效率）
- **法規交叉矩陣（HTS × 章節99 × 232/301/201）**
  - 以 HTS Code 為列、措施/例外為欄，顯示是否適用、稅率、法源、期間與排除編號。
- **國別/原產地情境計算器**
  - 輸入「原產地、出口國、目的地、產品（HTS/描述/規格）」→ 產生總關稅負擔（含 MFN、232/301、AD/CVD 參考連結）。
- **資料指紋與版本化**
  - 每筆條目附：來源 URL、抓取/更新時間、法規片段引用（可展開）、資料版本（hash）。

### P1（營運落地）
- **報價單與合規附件自動化**
  - 以客戶 RFQ → 匯出含稅則與措施的 PDF/Excel 報價附件。
- **設備/備品備件稅則維護**
  - ERW 設備（成型機、焊接機、退火、UT、水切、捲料上料）與備件（輥輪、感應線圈）對應 HTS 與稅負清單。
- **OCTG 規格對應與用量估算**
  - 以外徑、厚度（wt/ft 映射）、等級（J/K/N/L/X 等）→ 輔助供應計畫。

### P2（長期資料資產）
- **市場監測儀表板**
  - USITC/MEX/EU 海關流量、Preston/OCTG 指標、能源井深/鑽井型態對應需求的長期趨勢。
- **PWA 離線模式**
  - 常用清單與最新法規快取；弱網環境（廠內/倉庫）可用。

## 三、資訊架構（IA）與 UI/UX 建議
- **首頁：任務導向四分象限**
  1. 查稅則與措施
  2. 報價與合規輸出
  3. 設備/備件資料庫
  4. 市場監測
- **搜尋即組合篩選**
  - 關鍵字 + 章節 + 國別 + 期間；結果面板有「措施章節」側欄可勾選（232/301/201/99章）。
- **表格可擴展行（Expandable Rows）**
  - 一行顯示稅則摘要；展開顯示法規片段、來源、時效、排除清單連結。

## 四、系統架構與資料流
- **前端**：React + Vite；資料層使用 React Query（快取/背景同步）；Zod 驗證。
- **API 層（Netlify Functions）**
  - Proxy + 正規化 + 緩存（KV/Edge）
  - Rate limiting（token bucket）
- **資料倉儲**：
  - `data/htsus/*.json`（快取靜態快照） + 版本號；`data/rules/*.json` 存措施。
- **追溯性**：
  - 每筆資料附 `source.url`、`source.fetchedAt`、`source.quote`、`law.version`。

## 五、工程落實清單（Issue 模板）
- [ ] 建立 `apps/sources` 清單結構（名稱、類型、URL、更新頻率、說明）
- [ ] 設計 `rules` schema：
  ```ts
  type Rule = {
    id: string; type: '232'|'301'|'201'|'99';
    hts: string; rate: number | string;
    effectiveFrom?: string; effectiveTo?: string;
    country?: string[]; except?: string[];
    source: { url: string; fetchedAt: string; quote?: string }
  }
  ```
- [ ] 開發 **交叉矩陣** UI（虛擬滾動、固定列頭）
- [ ] 新增 **情境計算器**（表單 + 結果卡片）
- [ ] 報價附件輸出（PDFKit / browser-print-friendly）
- [ ] PWA & 離線快取策略（workbox）
- [ ] 單元測試與 E2E（Vitest + Playwright）

## 六、資料治理與合規
- 建議每週排程更新快照，保留 6 個月歷史版本。
- 高風險變更（稅率調整）需 email/slack 通知與變更紀錄（changelog）。
- Source 白名單：BIS、CBP、USITC、Federal Register、USTR、White House。

## 七、里程碑（90 天）
- **T+14 天**：完成 rules schema、Sources 清單、交叉矩陣雛型
- **T+30 天**：完成情境計算器、報價附件 v1、PWA 快取
- **T+60 天**：串接 USITC DataWeb API，加入市場監測（月度匯入）
- **T+90 天**：版本化與審核流程上線，導入自動測試覆蓋 >60%

---

> 本建議文件與 README 由 AI 根據倉庫實際掃描結果撰寫，可直接放入倉庫根目錄，供工程/營運/合規多方協作與持續迭代。
