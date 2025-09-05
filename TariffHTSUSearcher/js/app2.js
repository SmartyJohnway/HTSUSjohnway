import { safe as safeCall } from "../infra/guard.js";
import cache from "../infra/cache.js";

// --- APP 2: HTSUS API TARIFF DATABASE ---
function initializeHtsApiApp() {
    // --- App 2 DOM ---
    const searchInput = document.getElementById('htsSearchInput');
    const searchBtn = document.getElementById('htsSearchBtn');
    const resultsContainer = document.getElementById('htsResultsContainer');
    const loader = document.getElementById('htsLoader');
    const welcomeMessage = document.getElementById('htsWelcomeMessage');
    const statusContainer = document.getElementById('htsStatusContainer');
    const show232OnlyCheckbox = document.getElementById('show232Only');

    // --- 232條款和稅率計算函數 ---
    function check232Applicability(item, allItems) {
        const is232Related = item.footnotes?.some(f => 
            f.value?.includes('subchapter III, chapter 99') ||
            f.value?.includes('note 16') || // 鋼
            f.value?.includes('note 19')    // 鋁
        ) ?? false;

        if (!is232Related && item.statisticalSuffix) {
            const parentHts = item.htsno.split('.').slice(0, -1).join('.');
            const parentItem = allItems.find(i => i.htsno === parentHts);
            if (parentItem) {
                return check232Applicability(parentItem, allItems);
            }
        }
        return is232Related;
    }

    function parseRate(rate) {
        if (!rate || rate === 'Free' || rate === '') return 0;
        const match = rate.match(/(\d+\.?\d*)/);
        return match ? parseFloat(match[0]) : 0;
    }
    
    // 在註腳中查找99章引用和232條款相關說明
    function findChapter99References(footnotes, column) {
        const refs = [];
        let has232Note = false;

        footnotes?.forEach(f => {
            if (f.columns.includes(column)) {
                // 檢查是包232條款相關說明
                if (f.value.includes('note 16') ||
                    f.value.includes('note 19') ||
                    f.value.includes('subchapter III, chapter 99')) {
                    has232Note = true;
                }
                // 查找99章引用
                const matches = f.value.match(/99\d{2}\.\d{2}\.\d{2}/g) || [];
                refs.push(...matches);
            }
        });

        return {
            refs: refs,
            has232Note: has232Note
        };
    }

    function parseChapter99Rate(rateText) {
        if (!rateText) return 0;
        // 優先處70%的情況
        if (rateText === '70%') {
            console.log('Found exact 70% rate');
            return 70;
        }
        if (rateText.includes('applicable subheading + 25%') || 
            rateText.includes('The duty provided in the applicable subheading + 25%')) {
            return 25;
        }
        const match = rateText.match(/(\d+\.?\d*)%/);
        return match ? parseFloat(match[1]) : 0;
    }

    function calculateTotalRates(item, allItems) {
        console.log('Calculating rates for:', item.htsno);
        if (!Array.isArray(allItems)) return { generalTotal: 0, otherTotal: 0 };
        
        const baseGeneralRate = parseRate(item.general);
        const baseOtherRate = parseRate(item.other);
        
        console.log('Base rates - General:', baseGeneralRate, 'Other:', baseOtherRate);
        
        // 分別獲取general和other列的99章引用
        const { refs: generalRefs, has232Note: hasGeneral232Note } = findChapter99References(item.footnotes, 'general');
        const { refs: otherRefs } = findChapter99References(item.footnotes, 'other');
        
        console.log('Found references - General:', generalRefs, '232 Note:', hasGeneral232Note);
        console.log('Found references - Other:', otherRefs);

        let additionalGeneralRate = 0;
        let additionalOtherRate = 0;

        // 處general列的額外稅率
        generalRefs.forEach(ref => {
            console.log('Processing general ref:', ref);
            const chapter99Item = allItems.find(i => i.htsno === ref);
            console.log('Found chapter99 item:', chapter99Item);
            if (chapter99Item?.general) {
                // 檢查是包+25%的表述
                if (chapter99Item.general.includes('applicable subheading + 25%') ||
                    chapter99Item.general.includes('The duty provided in the applicable subheading + 25%')) {
                    console.log('Found +25% rate in general');
                    additionalGeneralRate = Math.max(additionalGeneralRate, 25); // 使用最高的稅率
                } else {
                    const rate = parseChapter99Rate(chapter99Item.general);
                    additionalGeneralRate = Math.max(additionalGeneralRate, rate);
                }
            }
        });

        // 處other列的額外稅率
        otherRefs.forEach(ref => {
            console.log('Processing other ref:', ref);
            const chapter99Item = allItems.find(i => i.htsno === ref);
            console.log('Found chapter99 item for other:', chapter99Item);
            if (chapter99Item?.other) {
                const rate = parseChapter99Rate(chapter99Item.other);
                console.log('Found additional other rate:', rate);
                additionalOtherRate += rate;
            }
        });

        console.log('Additional rates - General:', additionalGeneralRate, 'Other:', additionalOtherRate);

        // 計算最終稅率
        let totalGeneralRate = baseGeneralRate;
        let totalOtherRate = baseOtherRate;

        if (hasGeneral232Note) {
            // 尋找 9903.91.01 (general列25%稅率)
            const general232Item = allItems.find(i => i.htsno === '9903.91.01');
            if (general232Item) {
                totalGeneralRate = 25;
            }

            // 尋找 9903.90.09 (other列70%稅率)
            const other232Item = allItems.find(i => i.htsno === '9903.90.09');
            if (other232Item) {
                totalOtherRate = baseOtherRate + 70;
            }
        }

        console.log('Final rates - General:', totalGeneralRate, 'Other:', totalOtherRate);

        // 返回計算果
        return {
            generalTotal: totalGeneralRate,
            otherTotal: totalOtherRate,
            hasAdditionalDuty: additionalGeneralRate > 0 || additionalOtherRate > 0
        };
    }

    function formatRate(rate) {
        return rate === 0 ? 'Free' : rate + '%';
    }

    // --- App 2 Functions ---
    function setLoading(isLoading) {
        if (isLoading) {
            loader.classList.remove('hidden');
            loader.classList.add('flex');
            welcomeMessage.classList.add('hidden');
            resultsContainer.innerHTML = '';
        } else {
            loader.classList.add('hidden');
            loader.classList.remove('flex');
        }
    }

    function esc(s) { return String(s ?? '').replace(/[&<>"']/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m])); }
    
    function usitcLink(code){ return `https://hts.usitc.gov/search?query=${encodeURIComponent(code)}`; }

    const renderResults = safeCall((items) => {
    resultsContainer.innerHTML = '';
    welcomeMessage.classList.add('hidden');

    if (!items || items.length === 0) {
        resultsContainer.innerHTML = `<div class="text-center py-10"><p class="text-lg text-gray-500">找不到符條件的果，請嘗試其他關鍵字。</p></div>`;
        return;
    }
        if (typeof document.createDocumentFragment !== 'function') {
            return;
        }

        const fragment = document.createDocumentFragment();

    const searchTerm = searchInput.value.trim();
    const batchSize = 20;
    let index = 0;

    function createCard(item) {
        const card = document.createElement('div');
        card.className = 'bg-white border border-gray-200 rounded-lg p-4 transition-all hover:bg-gray-50 hover:border-blue-300';
        const indentPx = (Number(item.indent) || 0) * 20;

        const itemIs232Related = check232Applicability(item, items);
        const { generalTotal: itemGeneralTotal, otherTotal: itemOtherTotal } = calculateTotalRates(item, items);

        let descriptionHtml = esc(item.description || '');
        if (searchTerm) {
            const regex = new RegExp(searchTerm.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'), 'gi');
            descriptionHtml = descriptionHtml.replace(regex, `<mark class="bg-yellow-200 px-1 rounded">${searchTerm}</mark>`);
        }

        function findParentRate(items, currentItem) {
            if (currentItem.general && currentItem.general !== '') {
                return currentItem.general;
            }

            const currentIndent = parseInt(currentItem.indent || '0');
            const parentItems = items.filter(i =>
                i.htsno === currentItem.htsno.split('.').slice(0, -1).join('.') &&
                parseInt(i.indent || '0') < currentIndent
            );

            const parent = parentItems.sort((a, b) =>
                parseInt(b.indent || '0') - parseInt(a.indent || '0')
            )[0];

            return parent ? (parent.general || '') : '';
        }

        const actualRate = item.general || findParentRate(window.currentSearchResults || [], item);

        const footnotes = item.footnotes?.map((f, footnoteIndex) => {
            const is232Footnote = f.value?.includes('232') ||
                                  f.value?.includes('9903.80') ||
                                  f.value?.includes('9903.85');

            const htsMatches = f.value.match(/99\d{2}\.\d{2}\.\d{2}/g) || [];
            let processedValue = f.value;
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

            processedValue = parts.join('');

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
                            ${check232Applicability(item, window.currentSearchResults) ? `
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
                                ${esc(actualRate || '')}
                                ${item.general === '' ? '<span class="text-xs text-gray-500">(繼承自父項)</span>' : ''}
                                ${(itemIs232Related && itemGeneralTotal > 0) ?
                                    `<span class="text-xs text-red-600 ml-2">
                                         ${formatRate(itemGeneralTotal)}
                                        (232條款)
                                    </span>`
                                    : ''}
                            </p>
                        </div>
                        <div>
                            <p class="font-medium text-gray-500">第一欄 (特)</p>
                            <p class="text-gray-700">${esc(item.special ?? '')}</p>
                        </div>
                        <div>
                            <p class="font-medium text-gray-500">第二欄</p>
                            <p class="text-gray-700">
                                ${esc(item.other ?? item.col2 ?? '')}
                                ${(itemIs232Related && itemOtherTotal > parseRate(item.other)) ?
                                    `<span class="text-xs text-red-600 ml-2">
                                         ${formatRate(itemOtherTotal)}
                                        (232條款)
                                    </span>`
                                    : ''}
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
        return card;
    }

    function renderBatch() {
        const fragment = document.createDocumentFragment();
        for (let i = 0; i < batchSize && index < items.length; i++, index++) {
            fragment.appendChild(createCard(items[index]));
        }
        resultsContainer.appendChild(fragment);
        if (index < items.length) {
            requestAnimationFrame(renderBatch);
        }
    }

    renderBatch();
}, (error) => {
        resultsContainer.innerHTML = `<div class="text-center py-10 text-red-600">渲染失敗：${error.message}</div>`;
    });
async function performApiSearch() {
        const searchTerm = searchInput.value.trim();
        const show232Only = show232OnlyCheckbox.checked;

        if (searchTerm.length < 2) {
            const message = show232Only
                ? '請輸入至少 2 個字元以尋 232 條款相關項目。'
                : '請輸入至少 2 個字元以進行尋。';
            resultsContainer.innerHTML = `<div class="text-center py-10"><p class="text-lg text-gray-500">${message}</p></div>`;
            return;
        }

        const cacheKey = { searchTerm, show232Only };
        const cachedResults = cache.get(cacheKey);
        if (cachedResults) {
            window.currentSearchResults = cachedResults;
            renderResults(cachedResults);
            return;
        }

        setLoading(true);

        // *** MODIFIED FOR NETLIFY PROXY ***
        const apiBaseUrl = (typeof window !== 'undefined' && window.API_BASE_URL)
            ? window.API_BASE_URL
            : '/.netlify/functions/hts-proxy';
        const proxyUrl = `${apiBaseUrl}?keyword=${encodeURIComponent(searchTerm)}`;
        const directUrl = `https://hts.usitc.gov/reststop/search?keyword=${encodeURIComponent(searchTerm)}`;

        try {
            let data;
            try {
                const response = await api.safe(proxyUrl);
                const contentType = response.headers.get('content-type') || '';
                if (!response.ok || !contentType.includes('application/json')) {
                    throw new Error('Proxy returned non-JSON');
                }
                data = await response.json();
            } catch (proxyError) {
                 const response = await api.safe(directUrl, {
                    headers: { 'User-Agent': 'Tariff-Query-App/1.0' }
                });
                const contentType = response.headers.get('content-type') || '';
                if (!response.ok || !contentType.includes('application/json')) {
                    throw new Error('查詢服務暫時無法使用，請稍後再試');
                }
                const fallbackData = await response.json();
                data = { results: Array.isArray(fallbackData) ? fallbackData : [] };
            }
            // 確保 data.results 是陣列
            if (!Array.isArray(data.results)) {
                throw new Error('API 回傳的資料格式不正確');
            }
            // 根據 show232Only 過濾果
            const filteredResults = show232Only
                ? data.results.filter(item => check232Applicability(item, data.results))
                : data.results;
            // 儲存所有果並快取
            window.currentSearchResults = filteredResults;
            cache.set(cacheKey, filteredResults);
            renderResults(filteredResults);
        } catch (error) {
            console.error("API Search Error:", error);
            resultsContainer.innerHTML = `<div class="text-center py-10"><p class="text-lg text-red-600">查詢服務暫時無法使用，請稍後再試。</p><p class="text-sm text-gray-500 mt-1">${error.message}</p></div>`;
        } finally {
            setLoading(false);
        }
    }

    // --- App 2 Initialization ---
    searchBtn.addEventListener('click', performApiSearch);
    searchInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            performApiSearch();
        }
    });
    const debouncedSearch = typeof debounce === "function" ? debounce(performApiSearch, 500) : performApiSearch;
    searchInput.addEventListener('input', debouncedSearch);
    show232OnlyCheckbox.addEventListener('change', debouncedSearch);

    // 處註腳中HTSUS代碼的點事件
    let lastClickedLink = null;

    document.addEventListener('click', async (e) => {
        if (e.target.classList.contains('footnote-link')) {
            e.preventDefault();
            const htsCode = e.target.dataset.hts;
            const detailId = e.target.dataset.detailId;
            const detailsContainer = document.getElementById(detailId);
            
            if (!detailsContainer) return;

            // 關閉之前打開的容器（如果有的話）
            if (lastClickedLink && lastClickedLink !== e.target) {
                const lastDetailId = lastClickedLink.dataset.detailId;
                const lastContainer = document.getElementById(lastDetailId);
                if (lastContainer) {
                    lastContainer.classList.add('hidden');
                }
            }
            
            // 更新最後點的連
            lastClickedLink = e.target;

            // 切換當前容器的顯示狀態
            if (detailsContainer.classList.contains('hidden')) {
                detailsContainer.classList.remove('hidden');
                detailsContainer.innerHTML = '<div class="text-gray-500 text-sm py-2">尋中...</div>';
                
                try {
                     const response = await api.safe(`/.netlify/functions/hts-proxy?keyword=${encodeURIComponent(htsCode)}`);
                    const contentType = response.headers.get('content-type') || '';
                    const isJson = contentType.includes('application/json');
                    const data = isJson ? await response.json() : await response.text();

                    if (!response.ok) {
                        const message = isJson ? (data.error || '尋失敗') : '尋失敗';
                        throw new Error(message);
                    }

                    if (!isJson || !data.results?.length) throw new Error('找不到相關資');

                    const result = data.results[0];
                    detailsContainer.innerHTML = `
                        <div class="bg-gray-50 rounded-lg p-3 text-sm border border-gray-200">
                            <div class="flex justify-between items-start">
                                <div class="font-medium text-gray-900">${result.description || '無描述'}</div>
                                <button class="text-gray-400 hover:text-gray-600 close-details"
                                        data-hts="${htsCode}">
                                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                            <div class="mt-2 space-y-1 text-gray-600">
                                ${result.general ? `<div>第一欄 (普通): ${result.general}</div>` : ''}
                                ${result.special ? `<div>第一欄 (特): ${result.special}</div>` : ''}
                                ${result.other ? `<div>第二欄: ${result.other}</div>` : ''}
                            </div>
                        </div>
                    `;
                } catch (error) {
                    detailsContainer.innerHTML = `
                        <div class="text-red-500 text-sm py-2 bg-red-50 rounded-lg px-3">
                            ${error.message}
                        </div>
                    `;
                }
            } else {
                detailsContainer.classList.add('hidden');
            }
        }

        // 處關閉按鈕的點
        if (e.target.closest('.close-details')) {
            const htsCode = e.target.closest('.close-details').dataset.hts;
            const detailsContainer = document.getElementById(`footnote-details-${htsCode.replace(/\./g, '-')}`);
            if (detailsContainer) {
                detailsContainer.classList.add('hidden');
            }
        }
    });

    return { performApiSearch, renderResults, check232Applicability, findChapter99References, parseChapter99Rate };
}
if (typeof window !== 'undefined') {
    window.initializeHtsApiApp = initializeHtsApiApp;
}

export { initializeHtsApiApp };