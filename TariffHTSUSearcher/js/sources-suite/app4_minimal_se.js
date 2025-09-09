// app4_minimal_se.js
// 用途：以輕量索引快速搜尋 HTS / FR / Regs 彙整資料；僅供輔助，請以官方文本為準。

// ===== Tokenizer with CJK bigram support =====
function tokenize(input) {
  if (!input) return [];
  const s = ("" + input).toLowerCase();
  const keepDots = s.replace(/[^0-9a-z\u4e00-\u9fff\.]+/gi, ' ').trim();
  const asciiParts = keepDots
    .split(/\s+/)
    .flatMap(t => {
      if (!t) return [];
      const parts = [t];
      if (t.includes('.')) parts.push(...t.split('.').filter(Boolean));
      return parts;
    })
    .filter(Boolean);
  const cjk = s.match(/[\u4e00-\u9fff]+/g) || [];
  const bigrams = [];
  for (const word of cjk) {
    if (word.length === 1) bigrams.push(word);
    for (let i = 0; i < word.length - 1; i++) {
      bigrams.push(word.slice(i, i + 2));
    }
  }
  return Array.from(new Set([...asciiParts, ...bigrams]));
}

// ===== MinimalSearchEngine =====
class MinimalSearchEngine {
  constructor(fields) {
    this.index = new Map();
    this.docs = new Map();
    this.fields = fields;
  }
  add(doc) {
    if (!doc || !doc.id) return;
    this.docs.set(doc.id, doc);
    for (const f of this.fields) {
      const val = doc[f.name];
      if (!val) continue;
      const tokens = tokenize(String(val));
      for (const t of tokens) {
        if (!this.index.has(t)) this.index.set(t, new Map());
        const posting = this.index.get(t);
        posting.set(doc.id, (posting.get(doc.id) || 0) + f.weight);
      }
    }
  }
  addAll(docs) {
    docs?.forEach(d => this.add(d));
  }
  search(q, opts) {
    const limit = (opts && opts.limit) || 50;
    const tokens = tokenize(q);
    if (!tokens.length) return [];
    const score = new Map();
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
    return Array.from(score.entries())
      .map(([id, s]) => ({ id, s, doc: this.docs.get(id) }))
      .sort((a, b) => b.s - a.s)
      .slice(0, limit)
      .map(x => x.doc);
  }
}

let ENGINE = null;
let DOCS = [];

// Fetch index from Netlify Function or static file
export async function fetchIndex() {
  const endpoints = [
    '/.netlify/functions/get-index',
    'search/index.json',
    '/search/index.json',
    'index.json'
  ];
  for (const url of endpoints) {
    try {
      const r = await fetch(url, { cache: 'no-store' });
      if (r.ok) {
        const payload = await r.json();
        return payload.docs || payload.items || [];
      }
    } catch (e) {
      // ignore and try next
    }
  }
  return [];
}

export function query(q) {
  if (!ENGINE || !q.trim()) return [];
  return ENGINE.search(q, { limit: 100 });
}

export async function initApp4(root) {
  root.innerHTML = `
    <p class="text-sm mb-3">用途：以輕量索引快速搜尋已彙整的資料；僅供輔助，請以官方文本為準。</p>
    <div class="flex gap-2 mb-3 items-center">
      <input id="mse-key" class="border px-2 py-1 flex-1" placeholder="輸入關鍵字，如 9903.81.90 或 steel">
      <button id="mse-btn" class="px-3 py-1 border rounded">搜尋</button>
    </div>
    <div id="mse-count" class="text-xs text-gray-500 mb-2"></div>
    <ul id="mse-results" class="space-y-2 text-sm"></ul>
  `;

  const input = root.querySelector('#mse-key');
  const btn = root.querySelector('#mse-btn');
  const list = root.querySelector('#mse-results');
  const count = root.querySelector('#mse-count');

  DOCS = await fetchIndex();
  ENGINE = new MinimalSearchEngine([
    { name: 'title', weight: 3 },
    { name: 'text', weight: 1 },
    { name: 'type', weight: 0.5 }
  ]);
  ENGINE.addAll(DOCS);
  count.textContent = `資料筆數：${DOCS.length}`;

  function render(results) {
    if (!results.length) {
      list.innerHTML = '<li class="text-gray-500">無結果</li>';
      return;
    }
    list.innerHTML = results
      .map(r => `
        <li class="border p-2 rounded">
          <div class="text-xs text-gray-500">${r.type || ''}</div>
          <div class="font-medium">${r.title || ''}</div>
          <div class="text-gray-700">${r.text || ''}</div>
        </li>`)
      .join('');
  }

  function handleSearch() {
    const kw = input.value;
    render(query(kw));
  }

  btn.addEventListener('click', handleSearch);
  input.addEventListener('keydown', e => {
    if (e.key === 'Enter') handleSearch();
  });

  render([]);
}

// expose for debugging if needed
if (typeof window !== 'undefined') {
  window.initApp4 = initApp4;
  window.app4Query = query;
}
