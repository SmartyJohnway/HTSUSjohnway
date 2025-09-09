// app2_multisearch.js
// 用途：輸入一次關鍵字，快速生成各網站的搜尋連結；一切以官方原文為準。

function q(s) {
  return encodeURIComponent(s || '');
}

const ENGINES = [
  { id: 'usitc', label: 'USITC HTS', url: kw => `https://hts.usitc.gov/?query=${q(kw)}` },
  { id: 'cbp', label: 'CBP CROSS/Guidance', url: kw => `https://www.cbp.gov/trade/search?search_api_fulltext=${q(kw)}` },
  { id: 'bis', label: 'BIS', url: kw => `https://www.bis.doc.gov/index.php?option=com_search&searchword=${q(kw)}` },
  { id: 'fr', label: 'Federal Register', url: kw => `https://www.federalregister.gov/search?term=${q(kw)}` },
  { id: 'regs', label: 'Regulations.gov', url: kw => `https://www.regulations.gov/search?query=${q(kw)}` },
  { id: 'dataweb', label: 'USITC DataWeb', url: kw => `https://dataweb.usitc.gov/?search=${q(kw)}` }
];

export function initApp2(root) {
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
  btn.addEventListener('click', () => {
    ENGINES.forEach(e => window.open(e.url(kw.value), '_blank'));
  });

  renderList();
}