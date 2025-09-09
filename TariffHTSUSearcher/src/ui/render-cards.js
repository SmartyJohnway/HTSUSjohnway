import { check232Applicability } from '../core/footnote-judge.js';
import { calculateTotalRates, formatRate } from '../core/compute.js';
import { parseRate } from '../core/rate-parse.js';
import { esc } from '../utils/escape.js';
import { highlightTerm } from '../utils/text.js';

function usitcLink(code) {
  return `https://hts.usitc.gov/search?query=${encodeURIComponent(code)}`;
}

export function renderCards(items, { searchInput, resultsContainer, welcomeMessage }) {
  resultsContainer.innerHTML = '';
  welcomeMessage.classList.add('hidden');

  if (!items || items.length === 0) {
    resultsContainer.innerHTML = `<div class="text-center py-10"><p class="text-lg text-gray-500">找不到符合條件的結果，請嘗試其他關鍵字。</p></div>`;
    return;
  }

  const fragment = document.createDocumentFragment();
  items.forEach(item => {
    const card = document.createElement('div');
    card.className = 'bg-white border border-gray-200 rounded-lg p-4 transition-all hover:bg-gray-50 hover:border-blue-300';
    const indentPx = (Number(item.indent) || 0) * 20;

    const itemIs232Related = check232Applicability(item, items);
    const {
      generalTotal: itemGeneralTotal,
      otherTotal: itemOtherTotal,
      hasAdditionalDuty
    } = calculateTotalRates(item, items);

    const searchTerm = searchInput.value.trim();
    let descriptionHtml = esc(item.description || '');
    if (searchTerm) {
      descriptionHtml = highlightTerm(descriptionHtml, searchTerm);
    }

    function findParentRate(list, currentItem) {
      if (currentItem.general && currentItem.general !== '') {
        return currentItem.general;
      }
      const currentIndent = parseInt(currentItem.indent || '0');
      const parentItems = list.filter(i =>
        i.htsno === currentItem.htsno.split('.').slice(0, -1).join('.') &&
        parseInt(i.indent || '0') < currentIndent
      );
      const parent = parentItems.sort((a, b) =>
        parseInt(b.indent || '0') - parseInt(a.indent || '0')
      )[0];
      return parent ? (parent.general || '') : '';
    }

    const actualRate = item.general || findParentRate(items, item);
    const baseGeneralRate = parseRate(actualRate);
    const baseOtherRate = parseRate(item.other);
    const showAdditionalDuty = itemIs232Related || hasAdditionalDuty;
    const additionalDutyText = itemIs232Related ? '含232條款' : '含額外關稅';

    const footnotes = item.footnotes?.map((f, footnoteIndex) => {
      const is232Footnote = f.value?.includes('232') ||
                            f.value?.includes('9903.80') ||
                            f.value?.includes('9903.85');

      const htsMatches = f.value.match(/99\d{2}\.\d{2}\.\d{2}/g) || [];
      let lastIndex = 0;
      let parts = [];
      htsMatches.forEach((code, codeIndex) => {
        const codeIndex2 = f.value.indexOf(code, lastIndex);
        if (codeIndex2 !== -1) {
          if (codeIndex2 > lastIndex) {
            parts.push(esc(f.value.substring(lastIndex, codeIndex2)));
          }
          const uniqueId = `footnote-${item.htsno.replace(/\./g, '-')}-${footnoteIndex}-${codeIndex}`;
          parts.push(`<a href="#" class="text-blue-600 hover:text-blue-800 footnote-link" data-hts="${code}" data-detail-id="${uniqueId}">${code}</a>`);
          lastIndex = codeIndex2 + code.length;
        }
      });
      if (lastIndex < f.value.length) {
        parts.push(esc(f.value.substring(lastIndex)));
      }
      const processedValue = parts.join('');

      return `
                    <div class="footnote-container relative">
                        <div class="text-xs ${is232Footnote ? 'text-red-600 font-medium' : 'text-gray-600'} mt-1">
                            <span class="font-medium">${esc(f.columns.join(', '))}:</span>
                            ${is232Footnote ? '🔔 ' : ''}${processedValue}
                        </div>
                        ${htsMatches.map((code, codeIndex) => `
                            <div id="footnote-${item.htsno.replace(/\./g, '-')}-${footnoteIndex}-${codeIndex}"
                                 class="footnote-details mt-2 ml-4 hidden">
                            </div>
                        `).join('')}
                    </div>
                `;
    }).join('') || '';

    const units = item.units?.length
      ? `<div class="text-sm text-gray-600 mt-2">單位: ${esc(item.units.join(', '))}</div>`
      : '';

    card.innerHTML = `
                <div style="padding-left:${indentPx}px;">
                    <div class="flex items-start justify-between gap-4">
                        <div class="flex-grow">
                            <div class="flex items-center gap-2 flex-wrap">
                                <p class="font-semibold text-lg">
                                    <a class="text-blue-600 hover:text-blue-800" href="${usitcLink(item.htsno)}" target="_blank" rel="noopener noreferrer">
                                        ${esc(item.htsno)}
                                        ${item.statisticalSuffix ? `<span class="text-gray-500 text-sm">.${esc(item.statisticalSuffix)}</span>` : ''}
                                    </a>
                                </p>
                                ${itemIs232Related ? `
                                    <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                        232條款相關項目
                                    </span>
                                ` : ''}
                            </div>
                            <p class="text-gray-800 mt-1">${descriptionHtml}</p>
                        </div>
                        <div class="text-xs bg-gray-100 px-2 py-1 rounded whitespace-nowrap">
                            縮排等級: ${esc(item.indent || '0')}
                        </div>
                    </div>

                    ${units}

                    <div class="mt-3 pt-3 border-t border-dashed border-gray-200">
                        <div class="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                            <div>
                                <p class="font-medium text-gray-500">第一欄 (普通)</p>
                                <p class="text-gray-700">
                                    ${esc(actualRate || '—')}
                                    ${item.general === '' ? '<span class="text-xs text-gray-500">(繼承自父項)</span>' : ''}
                                    ${(showAdditionalDuty && itemGeneralTotal > baseGeneralRate) ?
                                        `<span class="text-xs text-red-600 ml-2">
                                            → ${formatRate(itemGeneralTotal)}
                                            (${additionalDutyText})
                                        </span>` : ''}
                                </p>
                            </div>
                            <div>
                                <p class="font-medium text-gray-500">第一欄 (特殊)</p>
                                <p class="text-gray-700">${esc(item.special ?? '—')}</p>
                            </div>
                            <div>
                                <p class="font-medium text-gray-500">第二欄</p>
                                <p class="text-gray-700">
                                    ${esc(item.other ?? item.col2 ?? '—')}
                                    ${(showAdditionalDuty && itemOtherTotal > baseOtherRate) ?
                                        `<span class="text-xs text-red-600 ml-2">
                                            → ${formatRate(itemOtherTotal)}
                                            (${additionalDutyText})
                                        </span>` : ''}
                                </p>
                            </div>
                        </div>

                        ${item.quotaQuantity ?
                            `<div class="mt-2 text-sm">
                                <p class="font-medium text-gray-500">配額數量</p>
                                <p class="text-gray-700">${esc(item.quotaQuantity)}</p>
                            </div>` : ''
                        }

                        ${item.additionalDuties ?
                            `<div class="mt-2 text-sm">
                                <p class="font-medium text-gray-500">額外關稅</p>
                                <p class="text-gray-700">${esc(item.additionalDuties)}</p>
                            </div>` : ''
                        }

                        ${footnotes ?
                            `<div class="mt-3 pt-3 border-t border-dashed border-gray-200">
                                <p class="font-medium text-gray-500 text-sm mb-1">註腳說明</p>
                                ${footnotes}
                            </div>` : ''
                        }
                    </div>
                </div>`;
    fragment.appendChild(card);
  });

  resultsContainer.appendChild(fragment);
}
