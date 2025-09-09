// app3_datasets.js
// 用途：匯集官方 API、CSV、開放資料與其文件的入口，便於開發與批次分析。

export const SOURCES = [
  { label: 'USITC HTS API', url: 'https://hts.usitc.gov/api', desc: 'HTS 公開 API，提供關稅號查詢 JSON。' },
  { label: 'USITC DataWeb API', url: 'https://dataweb.usitc.gov/api', desc: 'DataWeb 貿易資料 API，需註冊。' },
  { label: 'Federal Register API', url: 'https://www.federalregister.gov/developers/api/v1', desc: '聯邦公報公開 API。' },
  { label: 'Regulations.gov API', url: 'https://api.regulations.gov/', desc: 'Regulations.gov 公開 API。' },
  { label: 'BIS Dataset (CSV)', url: 'https://www.bis.doc.gov/index.php/documents/technology-evaluation/ote-data/1889-licensing-dataset/file', desc: 'BIS 授權資料 CSV。' }
];

export function initApp3(root) {
  const items = SOURCES.map(
    s => `<li class="text-sm"><a class="underline" target="_blank" href="${s.url}">${s.label}</a> - ${s.desc}</li>`
  ).join('');

  root.innerHTML = `
    <p class="text-sm mb-3">用途：匯集官方 API/CSV 入口；請留意各來源使用條款與速率限制。</p>
    <ul class="space-y-1">${items}</ul>
  `;
}