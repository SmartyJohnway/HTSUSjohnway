// app1_sources.js
// 用途：集中列出與關稅/232/301 相關的官方來源，一鍵前往；請以官方原文為準。

export const SOURCES = [
  { label: 'USITC HTS', url: 'https://hts.usitc.gov/', desc: '美國 HTS 官方查詢入口。' },
  { label: 'CBP', url: 'https://www.cbp.gov/', desc: '美國海關與邊境保護局，分類/裁定與關務指引。' },
  { label: 'BIS', url: 'https://www.bis.doc.gov/', desc: '工業與安全局，出口管制/規則/公告。' },
  { label: 'Federal Register', url: 'https://www.federalregister.gov/', desc: '聯邦公報，最終規則/臨時措施/公告。' },
  { label: 'Regulations.gov', url: 'https://www.regulations.gov/', desc: '法規草案與意見徵詢平台。' },
  { label: 'USITC DataWeb', url: 'https://dataweb.usitc.gov/', desc: 'USITC DataWeb 貿易資料查詢。' },
  { label: 'QuantGov', url: 'https://www.quantgov.org/', desc: 'QuantGov 法規計量分析資料。' }
];

export function initApp1(root) {
  const items = SOURCES.map(
    s => `<li class="text-sm"><a class="underline" target="_blank" href="${s.url}">${s.label}</a> - ${s.desc}</li>`
  ).join('');

  root.innerHTML = `
    <p class="text-sm mb-3">用途：集中列出官方/權威來源；一切以官方為準。</p>
    <ul class="space-y-1">${items}</ul>
  `;
}