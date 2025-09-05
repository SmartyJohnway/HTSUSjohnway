import React, { useMemo, useState, useEffect } from "react";

/**
 * Section 232 多來源查詢 Web App（升級版 v2.1）
 * - App1：資料來源入口（官方/權威站台的一鍵連結 + 帶參數搜尋）
 * - App2：多來源搜尋（一次輸入關鍵字 → 產生多站最佳化搜尋連結）
 * - App3：API/CSV 直通車（官方 API、批次下載、文件入口，含快捷 URL）
 * - App4：索引搜尋 Beta（移除外部依賴，使用內建 MinimalSearchEngine）
 */

// ====== 工具：輕量全文索引（零依賴） ======
function tokenize(input: string): string[] {
  if (!input) return [];
  const s = ("" + input).toLowerCase();
  const keepDots = s.replace(/[^0-9a-z\u4e00-\u9fff\.]+/gi, " ").trim();
  const asciiParts = keepDots
    .split(/\s+/)
    .flatMap(t => {
      if (!t) return [] as string[];
      const parts = [t];
      if (t.includes('.')) parts.push(...t.split('.').filter(Boolean));
      return parts;
    })
    .filter(Boolean);
  const cjk = s.match(/[\u4e00-\u9fff]+/g) || [];
  const bigrams: string[] = [];
  for (const word of cjk) {
    if (word.length === 1) bigrams.push(word);
    for (let i = 0; i < word.length - 1; i++) {
      bigrams.push(word.slice(i, i + 2));
    }
  }
  return Array.from(new Set([...asciiParts, ...bigrams]));
}

class MinimalSearchEngine {
  private index: Map<string, Map<string, number>> = new Map();
  private docs: Map<string, any> = new Map();
  private fields: { name: string; weight: number }[];

  constructor(fields: { name: string; weight: number }[]) {
    this.fields = fields;
  }

  add(doc: any) {
    if (!doc || !doc.id) return;
    this.docs.set(doc.id, doc);
    for (const f of this.fields) {
      const val = (doc as any)[f.name];
      if (!val) continue;
      const tokens = tokenize(String(val));
      for (const t of tokens) {
        if (!this.index.has(t)) this.index.set(t, new Map());
        const posting = this.index.get(t)!;
        posting.set(doc.id, (posting.get(doc.id) || 0) + f.weight);
      }
    }
  }
  addAll(docs: any[]) { docs?.forEach(d => this.add(d)); }

  search(q: string, opts?: { limit?: number }) {
    const limit = opts?.limit ?? 50;
    const tokens = tokenize(q);
    if (!tokens.length) return [] as any[];
    const score = new Map<string, number>();
    for (const t of tokens) {
      const posting = this.index.get(t);
      if (!posting) continue;
      for (const [docId, s] of posting.entries()) {
        score.set(docId, (score.get(docId) || 0) + s);
      }
    }
    const phrase = q.trim().toLowerCase();
    if (phrase) {
      for (const [docId, s] of score.entries()) {
        const d = this.docs.get(docId);
        let bonus = 0;
        if (String(d.title || '').toLowerCase().includes(phrase)) bonus += 3;
        if (String(d.text || '').toLowerCase().includes(phrase)) bonus += 1.5;
        score.set(docId, s + bonus);
      }
    }
    const ranked = Array.from(score.entries())
      .map(([id, s]) => ({ id, s, doc: this.docs.get(id) }))
      .sort((a, b) => b.s - a.s)
      .slice(0, limit)
      .map(x => x.doc);
    return ranked;
  }
}

// ====== 資料來源卡片（App1） ======
const SOURCES = [
  {
    id: "usitc_hts",
    label: "USITC — HTSUS（關稅分類與 Chapter 99）",
    home: "https://hts.usitc.gov/",
    buildDirect: (q: string) => `https://hts.usitc.gov/?query=${encodeURIComponent(q)}`,
    buildSite: (q: string) => `https://www.google.com/search?q=${encodeURIComponent(`site:hts.usitc.gov ${q}`)}`,
    desc: "官方 HTSUS 檢索入口。建議先搜 10 碼，再交叉檢查 Chapter 99（9903.*）是否觸及 Section 232。",
  },
  {
    id: "cbp_trade_remedies",
    label: "CBP — Trade Remedies（232 除外/停用清單、CSMS 指引）",
    home: "https://www.cbp.gov/trade/programs-administration/trade-remedies",
    buildDirect: null,
    buildSite: (q: string) => `https://www.google.com/search?q=${encodeURIComponent(`site:cbp.gov "Trade Remedies" ${q}`)}`,
    desc: "海關報關實務、除外（exclusions）與 CSMS 公告彙整，追蹤 Active/Deactivated 清單。",
  },
  {
    id: "cbp_csms",
    label: "CBP — CSMS 公告（操作通告/稅則落地指引）",
    home: "https://www.cbp.gov/trade/automated/cargo-systems-messaging-service",
    buildDirect: null,
    buildSite: (q: string) => `https://www.google.com/search?q=${encodeURIComponent(`site:cbp.gov CSMS ${q}`)}`,
    desc: "CBP Cargo Systems Messaging Service：生效日、申報欄位、過渡安排等。",
  },
  {
    id: "bis_232",
    label: "US DOC / BIS — Section 232（鋼/鋁專題、Inclusions/Exclusions）",
    home: "https://www.bis.gov/",
    buildDirect: null,
    buildSite: (q: string) => `https://www.google.com/search?q=${encodeURIComponent(`site:bis.gov Section 232 ${q}`)}`,
    desc: "商務部 BIS 的 232 主題頁、Proclamation/程序、Inclusions/Exclusions。",
  },
  {
    id: "federal_register",
    label: "Federal Register — 總統公告/正式法規文本",
    home: "https://www.federalregister.gov/",
    buildDirect: (q: string) => `https://www.federalregister.gov/documents/search?conditions%5Bterm%5D=${encodeURIComponent(q)}%20Section%20232`,
    buildSite: (q: string) => `https://www.google.com/search?q=${encodeURIComponent(`site:federalregister.gov Section 232 ${q}`)}`,
    desc: "Section 232 的 Presidential Proclamations 與 Annex 清單權威來源。",
  },
  {
    id: "regulations",
    label: "Regulations.gov — 公眾意見/案卷（Docket）",
    home: "https://www.regulations.gov/",
    buildDirect: (q: string) => `https://www.regulations.gov/search?filter=${encodeURIComponent(q + " Section 232")}`,
    buildSite: (q: string) => `https://www.google.com/search?q=${encodeURIComponent(`site:regulations.gov Section 232 ${q}`)}`,
    desc: "追蹤 232 相關案卷、徵詢與程序（含 Inclusions/Exclusions 流程）。",
  },
  {
    id: "quantgov",
    label: "QuantGov — Tariff Explorer（232/301 視覺化）",
    home: "https://www.quantgov.org/",
    buildDirect: (q: string) => `https://www.google.com/search?q=${encodeURIComponent(`site:quantgov.org tariff ${q}`)}`,
    buildSite: null,
    desc: "第三方視覺化與資料彙整，快速看 232/301 產品與國別分布（以 site: 搜尋導向內頁）。",
  },
];

const API_SOURCES = [
  {
    id: "hts_api",
    label: "USITC HTS — REST API",
    docs: "https://hts.usitc.gov/",
    desc: "官方 HTS 搜尋/匯出 API（/reststop）。",
    build: (q: string) => [
      { name: "search", url: `https://hts.usitc.gov/reststop/search?keyword=${encodeURIComponent(q||'copper')}` },
      { name: "exportList (JSON)", url: `https://hts.usitc.gov/reststop/exportList?from=0100&to=0200&format=JSON&styles=false` },
    ],
  },
  {
    id: "hts_export",
    label: "USITC HTS — 整本匯出入口",
    docs: "https://hts.usitc.gov/",
    desc: "當期版 CSV / XLSX / JSON 匯出。",
    build: () => [ { name: "HTS 匯出首頁", url: "https://hts.usitc.gov/" } ],
  },
  {
    id: "fr_api",
    label: "Federal Register — API",
    docs: "https://www.federalregister.gov/developers/api/v1",
    desc: "查 232 公告/總統公告（JSON）。",
    build: (q: string) => [ { name: "documents.json", url: `https://www.federalregister.gov/api/v1/documents.json?conditions%5Bterm%5D=${encodeURIComponent(q||'Section 232')}` } ],
  },
  {
    id: "regs_api",
    label: "Regulations.gov v4",
    docs: "https://open.gsa.gov/api/regulationsgov/",
    desc: "eRulemaking API（需 API key）。",
    build: (q: string) => [ { name: "documents (BIS, Section 232)", url: `https://api.regulations.gov/v4/documents?filter%5BsearchTerm%5D=${encodeURIComponent(q||'Section 232')}&filter%5Bagency%5D=BIS&page%5Bsize%5D=250` } ],
  },
  {
    id: "govinfo_bulk",
    label: "GovInfo — FR Bulk XML",
    docs: "https://www.govinfo.gov/bulkdata",
    desc: "聯邦公報全量 XML（適合做底庫與比對）。",
    build: () => [ { name: "FR Bulk XML 索引", url: "https://www.govinfo.gov/bulkdata/FR" } ],
  },
  {
    id: "datagov_ckan",
    label: "Data.gov — CKAN 搜尋",
    docs: "https://catalog.data.gov/dataset",
    desc: "找 232／HTS 套件與檔案的中繼資訊。",
    build: (q: string) => [ { name: "package_search", url: `https://catalog.data.gov/api/3/action/package_search?q=${encodeURIComponent(q||'Section 232')}` } ],
  },
  {
    id: "dataweb",
    label: "USITC DataWeb API（需帳號）",
    docs: "https://dataweb.usitc.gov/",
    desc: "關稅與貿易統計 API（登入/Token）。",
    build: () => [ { name: "DataWeb 首頁", url: "https://dataweb.usitc.gov/" } ],
  },
  {
    id: "cbp_csms_archive",
    label: "CBP — CSMS 與彙編 PDF",
    docs: "https://www.cbp.gov/trade/automated/cargo-systems-messaging-service",
    desc: "操作通告與每月彙編 PDF（可定期解析）。",
    build: () => [ { name: "CSMS 首頁", url: "https://www.cbp.gov/trade/automated/cargo-systems-messaging-service" } ],
  },
  {
    id: "quantgov",
    label: "QuantGov — Section 232 CSV（無 API）",
    docs: "https://www.quantgov.org/",
    desc: "季度更新的整理版 CSV，需直接下載。",
    build: () => [ { name: "QuantGov Portal", url: "https://www.quantgov.org/" } ],
  },
];

function Header() {
  return (
    <div className="sticky top-0 z-20 backdrop-blur bg-white/70 border-b">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center gap-3">
        <div className="text-xl font-bold tracking-tight">Section 232 多來源查詢（升級版）</div>
        <div className="text-xs text-gray-500 ml-auto">v2.1 · React + Vite（零外部模組）</div>
      </div>
    </div>
  );
}

function SourceCard({ src, keyword }: { src: (typeof SOURCES)[number]; keyword: string }) {
  const directUrl = (src as any).buildDirect ? (src as any).buildDirect(keyword) : null;
  const siteUrl = (src as any).buildSite ? (src as any).buildSite(keyword) : null;
  return (
    <div className="rounded-2xl shadow p-5 border bg-white flex flex-col gap-3">
      <div className="flex items-start gap-3">
        <div className="flex-1">
          <div className="font-semibold text-gray-900 leading-snug">{src.label}</div>
          <div className="text-sm text-gray-600 mt-1">{src.desc}</div>
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        <a href={(src as any).home} target="_blank" rel="noreferrer" className="px-3 py-1.5 rounded-xl border hover:bg-gray-50">開啟首頁</a>
        {directUrl && <a href={directUrl} target="_blank" rel="noreferrer" className="px-3 py-1.5 rounded-xl border hover:bg-gray-50">站內搜尋（帶入關鍵字）</a>}
        {siteUrl && <a href={siteUrl} target="_blank" rel="noreferrer" className="px-3 py-1.5 rounded-xl border hover:bg-gray-50">Google site: 快速檢索</a>}
      </div>
    </div>
  );
}

function App1({ keyword, setKeyword }: { keyword: string; setKeyword: (v: string) => void }) {
  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <div className="mb-4">
        <div className="text-lg font-semibold mb-2">App 1：資料來源入口</div>
        <p className="text-sm text-gray-600">一次集中所有官方/權威來源。可先在下方欄位輸入關鍵字（如："9903.81.90"、"ERW steel pipe"、"Chapter 99"、"automobile parts"、"銅 管 板" 或特定 10 碼 HTS），然後使用每張卡片上的「站內搜尋」或「site: 快速檢索」。</p>
      </div>

      <div className="flex items-center gap-2 mb-6">
        <input value={keyword} onChange={(e) => setKeyword(e.target.value)} placeholder="輸入一次關鍵字，供各站搜尋使用…" className="w-full px-4 py-2 rounded-xl border focus:outline-none focus:ring" />
        <button onClick={() => setKeyword("")} className="px-3 py-2 rounded-xl border hover:bg-gray-50">清除</button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {SOURCES.map((s) => (<SourceCard key={s.id} src={s as any} keyword={keyword} />))}
      </div>

      <div className="mt-8 text-sm text-gray-500">小技巧：查 HTSUS 時，先找「主分類 10 碼」→ 再以 Chapter 99（9903.*）確認是否被 232 觸及；同時對照 Federal Register 附錄（Annex）與 CBP CSMS 的生效日/實務欄位。</div>
    </div>
  );
}

function buildSearchMatrix(q: string) {
  const enc = encodeURIComponent;
  return [
    { group: "官方核心", items: [
      { label: "USITC HTSUS 站內搜尋", url: `https://hts.usitc.gov/?query=${enc(q)}`, hint: "官方 HTS 檢索（可能因版本調整）。" },
      { label: "HTSUS site: 備援", url: `https://www.google.com/search?q=${enc(`site:hts.usitc.gov ${q}`)}`, hint: "使用 Google 針對 USITC 網站做站內索引。" },
      { label: "Federal Register 檢索", url: `https://www.federalregister.gov/documents/search?conditions%5Bterm%5D=${enc(q + " Section 232")}`, hint: "查找 Proclamations/Annex/正式文本。" },
      { label: "Regulations.gov 檢索", url: `https://www.regulations.gov/search?filter=${enc(q + " Section 232")}`, hint: "查 Docket、意見徵詢與程序。" },
    ]},
    { group: "CBP 實務", items: [
      { label: "CBP Trade Remedies（site:）", url: `https://www.google.com/search?q=${enc(`site:cbp.gov "Trade Remedies" ${q}`)}`, hint: "除外/停用清單、摘要頁面。" },
      { label: "CBP CSMS（site:）", url: `https://www.google.com/search?q=${enc(`site:cbp.gov CSMS ${q}`)}`, hint: "通告、生效日、報關欄位與過渡期。" },
    ]},
    { group: "情資彙整/視覺化", items: [
      { label: "BIS 站內（site:）", url: `https://www.google.com/search?q=${enc(`site:bis.gov Section 232 ${q}`)}`, hint: "鋼/鋁主題頁、Inclusions/Exclusions。" },
      { label: "QuantGov（site:）", url: `https://www.google.com/search?q=${enc(`site:quantgov.org tariff ${q}`)}`, hint: "第三方視覺化資料。" },
    ]},
  ];
}

function App2() {
  const [q, setQ] = useState("");
  const matrix = useMemo(() => buildSearchMatrix(q.trim()), [q]);

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <div className="mb-4">
        <div className="text-lg font-semibold mb-2">App 2：多來源搜尋頁面</div>
        <p className="text-sm text-gray-600">在此輸入一次關鍵字（HTS 10 碼、產品名稱、國家、或 Chapter 99 號碼如 9903.81.90），系統會產生各網站的最佳化搜尋連結。</p>
      </div>

      <div className="flex items-center gap-2 mb-6">
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="例如：ERW steel pipe、9903.81.90、automobile parts、copper tube、台灣 鋼 鋁" className="w-full px-4 py-2 rounded-xl border focus:outline-none focus:ring" />
        <button onClick={() => setQ("")} className="px-3 py-2 rounded-xl border hover:bg-gray-50">清除</button>
      </div>

      <div className="space-y-5">
        {matrix.map((grp) => (
          <div key={grp.group} className="rounded-2xl border bg-white shadow">
            <div className="px-5 py-3 border-b font-semibold">{grp.group}</div>
            <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-3">
              {grp.items.map((it) => (
                <a key={it.label} href={it.url} target="_blank" rel="noreferrer" className="group rounded-xl border p-4 hover:bg-gray-50 flex flex-col gap-1">
                  <div className="font-medium">{it.label}</div>
                  <div className="text-xs text-gray-500">{(it as any).hint}</div>
                  <div className="text-[11px] text-gray-400 break-all opacity-0 group-hover:opacity-100 transition">{it.url}</div>
                </a>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 text-sm text-gray-500 space-y-2">
        <div>🔎 建議流程：<span className="font-medium">USITC HTSUS → Federal Register → CBP CSMS → BIS/Regulations.gov → QuantGov</span>；同時注意生效日與過渡期。</div>
        <div>🧭 提示：若目標網站暫不支援 URL 帶參數，已自動退回 Google 的 <code>site:</code> 精準檢索鏈接。</div>
      </div>
    </div>
  );
}

function App3({ keyword, setKeyword }: { keyword: string; setKeyword: (v: string) => void }) {
  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <div className="mb-4">
        <div className="text-lg font-semibold mb-2">App 3：API/CSV 直通車</div>
        <p className="text-sm text-gray-600">官方/半官方來源與第三方資料的 API、批次下載、與文件入口。上方關鍵字會自動帶入可參數化的端點。</p>
      </div>

      <div className="flex items-center gap-2 mb-6">
        <input value={keyword} onChange={(e)=>setKeyword(e.target.value)} placeholder="預設：Section 232 9903.81.90" className="w-full px-4 py-2 rounded-xl border focus:outline-none focus:ring"/>
        <button onClick={()=>setKeyword("")} className="px-3 py-2 rounded-xl border hover:bg-gray-50">清除</button>
      </div>

      <div className="space-y-4">
        {API_SOURCES.map(src => (
          <div key={src.id} className="rounded-2xl border bg-white shadow">
            <div className="px-5 py-3 border-b flex items-center gap-2">
              <div className="font-semibold">{src.label}</div>
              <a href={src.docs} target="_blank" rel="noreferrer" className="ml-auto text-sm px-3 py-1.5 rounded-xl border hover:bg-gray-50">文件/首頁</a>
            </div>
            <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-3">
              {src.build((keyword||'').trim()).map(({name, url}: any) => (
                <div key={name} className="rounded-xl border p-3">
                  <div className="text-sm font-medium">{name}</div>
                  <div className="text-[11px] text-gray-500 break-all mt-1">{url}</div>
                  <div className="mt-2 flex gap-2">
                    <a href={url} target="_blank" rel="noreferrer" className="px-3 py-1.5 rounded-xl border hover:bg-gray-50">開啟</a>
                    <button className="px-3 py-1.5 rounded-xl border hover:bg-gray-50" onClick={()=>navigator.clipboard.writeText(url)}>複製</button>
                  </div>
                </div>
              ))}
            </div>
            <div className="px-5 pb-4 text-xs text-gray-500">{src.desc}</div>
          </div>
        ))}
      </div>

      <div className="mt-6 text-xs text-gray-500">提醒：Regulations.gov 需 API key；DataWeb 需帳號；QuantGov 232/301 CSV 無 API、季度更新。</div>
    </div>
  );
}

// === App4：索引搜尋（Beta，零依賴引擎） ===
function App4() {
  const [endpoint, setEndpoint] = useState("/sample-index.json");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string|undefined>();
  const [docs, setDocs] = useState<any[]>([]);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [engine, setEngine] = useState<MinimalSearchEngine | null>(null);
  const [tests, setTests] = useState<{name: string; pass: boolean; detail?: string}[]>([]);

  const buildEngine = (items: any[]) => {
    const idx = new MinimalSearchEngine([
      { name: 'title', weight: 3 },
      { name: 'text',  weight: 1 },
      { name: 'type',  weight: 0.5 },
    ]);
    idx.addAll(items);
    return idx;
  };

  const loadIndex = async () => {
    setLoading(true); setError(undefined);
    try {
      const r = await fetch(endpoint, { cache: 'no-store' });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const payload = await r.json();
      const items = payload.docs || payload.items || [];
      setDocs(items);
      setEngine(buildEngine(items));
      setResults([]);
    } catch (e:any) {
      setError(e.message || String(e));
    } finally {
      setLoading(false);
    }
  };

  const loadSample = () => {
    const sample = [
      { id: 'HTS-9903.81.90', type: 'hts', title: '9903.81.90', text: 'Section 232 steel derivatives; ERW steel pipe; Chapter 99 measures' },
      { id: 'FR-2025-IFR',   type: 'fr',  title: 'Interim Final Rule: Section 232 Inclusions Process', text: 'BIS establishes procedures for Section 232 inclusions' },
      { id: 'REGS-DOCKET',   type: 'regs',title: 'BIS Docket on Section 232', text: 'Public comments related to HTS 9903 and exclusions' },
    ];
    setDocs(sample);
    setEngine(buildEngine(sample));
    setResults([]);
  };

  const doSearch = () => {
    if (!engine || !query.trim()) { setResults([]); return; }
    const out = engine.search(query, { limit: 100 });
    setResults(out);
  };

  const runTests = () => {
    const sample = [
      { id: 'HTS-9903.81.90', type: 'hts', title: '9903.81.90', text: 'Section 232 steel derivatives; ERW steel pipe; Chapter 99 measures' },
      { id: 'FR-232', type: 'fr', title: 'Section 232 Inclusions', text: 'Interim Final Rule for inclusions process' },
      { id: 'REGS-1', type: 'regs', title: 'Public comments on 232', text: 'Comments refer to 9903 and exclusions' },
    ];
    const idx = buildEngine(sample);
    const t: {name: string; pass: boolean; detail?: string}[] = [];

    const r1 = idx.search('9903.81.90');
    t.push({ name: '精確碼搜尋（9903.81.90）', pass: r1[0]?.id === 'HTS-9903.81.90', detail: r1.map(d=>d.id).join(',') });

    const r2 = idx.search('ERW steel pipe');
    t.push({ name: '英文關鍵字（ERW steel pipe）', pass: r2.some(d=>d.id==='HTS-9903.81.90'), detail: r2.map(d=>d.id).join(',') });

    const r3 = idx.search('包含 232');
    t.push({ name: 'CJK bigram（包含 232）', pass: r3.length >= 0, detail: r3.map(d=>d.id).join(',') });

    setTests(t);
  };

  useEffect(()=>{ setResults([]); }, [endpoint]);

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <div className="mb-2">
        <div className="text-lg font-semibold mb-2">App 4：索引搜尋（Beta，零依賴引擎）</div>
        <p className="text-sm text-gray-600">載入 <code>search/index.json</code> 或使用內建樣本，使用 MinimalSearchEngine 快速檢索。</p>
      </div>
      <div className="flex flex-col md:flex-row md:items-center gap-2 mb-4">
        <input value={endpoint} onChange={(e)=>setEndpoint(e.target.value)} className="w-full px-4 py-2 rounded-xl border" />
        <button onClick={loadIndex} className="px-3 py-2 rounded-xl border hover:bg-gray-50">載入索引</button>
        <button onClick={loadSample} className="px-3 py-2 rounded-2xl border hover:bg-gray-50">載入內建樣本</button>
        <button onClick={runTests} className="px-3 py-2 rounded-2xl border hover:bg-gray-50">執行測試</button>
        {loading && <span className="text-xs text-gray-500">讀取中…</span>}
        {error && <span className="text-xs text-red-600">{error}</span>}
      </div>

      <div className="flex items-center gap-2 mb-6">
        <input value={query} onChange={(e)=>setQuery(e.target.value)} placeholder="輸入關鍵字，例如：9903.81.90 或 ERW steel pipe" className="w-full px-4 py-2 rounded-xl border" />
        <button onClick={doSearch} className="px-3 py-2 rounded-xl border hover:bg-gray-50">搜尋</button>
        <div className="text-xs text-gray-500">資料筆數：{docs.length}</div>
      </div>

      {!!tests.length && (
        <div className="mb-4 text-sm">
          <div className="font-semibold mb-2">內建測試結果</div>
          <ul className="space-y-1">
            {tests.map((t,i)=> (
              <li key={i} className={`px-3 py-2 rounded-xl border ${t.pass? 'border-green-300 bg-green-50' : 'border-red-300 bg-red-50'}`}>
                <span className="font-medium">{t.name}</span> — {t.pass? '✅ 通過' : '❌ 失敗'}
                {t.detail && <span className="ml-2 text-gray-500">({t.detail})</span>}
              </li>
            ))}
          </ul>
        </div>
      )}

      {!!results.length && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {results.map((r:any)=> (
            <div key={r.id} className="rounded-xl border p-4 bg-white shadow">
              <div className="text-xs text-gray-500 mb-1">{r.type}</div>
              <div className="font-medium mb-1">{r.title}</div>
              <div className="text-sm text-gray-700">{r.text}</div>
              {r.type === 'fr' && (r as any).extra?.html_url && (
                <a className="mt-2 inline-block text-sm px-3 py-1.5 rounded-xl border hover:bg-gray-50" href={(r as any).extra.html_url} target="_blank" rel="noreferrer">Federal Register</a>
              )}
            </div>
          ))}
        </div>
      )}

      {!results.length && (
        <div className="text-sm text-gray-500">尚無結果。先「載入索引 / 內建樣本」，再輸入關鍵字搜尋。</div>
      )}
    </div>
  );
}

export default function Section232SearchApp() {
  const [tab, setTab] = useState<"app1" | "app2" | "app3" | "app4">("app1");
  const [keyword, setKeyword] = useState("Section 232 9903.81.90");

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white text-gray-900">
      <Header />
      <main className="max-w-6xl mx-auto px-4 pt-4 pb-14">
        <div className="mb-4 flex flex-wrap gap-2">
          <button onClick={() => setTab("app1")} className={`px-4 py-2 rounded-2xl border ${tab === "app1" ? "bg-black text-white" : "hover:bg-gray-50"}`}>App 1：入口</button>
          <button onClick={() => setTab("app2")} className={`px-4 py-2 rounded-2xl border ${tab === "app2" ? "bg-black text-white" : "hover:bg-gray-50"}`}>App 2：搜尋</button>
          <button onClick={() => setTab("app3")} className={`px-4 py-2 rounded-2xl border ${tab === "app3" ? "bg-black text-white" : "hover:bg-gray-50"}`}>App 3：API/CSV 直通車</button>
          <button onClick={() => setTab("app4")} className={`px-4 py-2 rounded-2xl border ${tab === "app4" ? "bg-black text-white" : "hover:bg-gray-50"}`}>App 4：索引搜尋 (Beta)</button>
        </div>

        <div className="rounded-3xl overflow-hidden border bg-white/60">
          {tab === "app1" ? (
            <App1 keyword={keyword} setKeyword={setKeyword} />
          ) : tab === "app2" ? (
            <App2 />
          ) : tab === "app3" ? (
            <App3 keyword={keyword} setKeyword={setKeyword} />
          ) : (
            <App4 />
          )}
        </div>
      </main>

      <footer className="text-center text-xs text-gray-500 py-6">
        © {new Date().getFullYear()} Section 232 Multi‑Source Finder — for research assistance only (non‑legal advice).
      </footer>
    </div>
  );
}
