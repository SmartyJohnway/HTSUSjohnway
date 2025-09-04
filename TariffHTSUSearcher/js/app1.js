const safe = (typeof window !== "undefined" && window.safe) || require("../infra/guard").safe;

// --- APP 1: STEEL/ALUMINUM TARIFFS (DATA-DRIVEN REFACTOR) ---
function initializeApp1() {
    // --- App 1 State & DOM ---
    let tariffData = []; // Data is now loaded dynamically
    const searchInput = document.getElementById('searchInput');
    const resultsContainer = document.getElementById('resultsContainer');
    const noResults = document.getElementById('noResults');
    const filterButtons = document.querySelectorAll('.filter-btn');
    const fileInput = document.getElementById('tariffFileInput');
    const statusMessage = document.getElementById('app1Status');
    const welcomeMessage = document.getElementById('app1Welcome');
    const loaderUI = document.getElementById('app1Loader');
    let currentFilter = 'All';

    // --- App 1 Functions ---
    const loadTariffRules = safe(async () => {
        statusMessage.textContent = '正在載入關稅規則...';
        statusMessage.classList.remove('text-red-700', 'text-green-700');
        statusMessage.classList.add('text-blue-700');

        const response = await fetch('./tariff_rules.json');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();

        if (!Array.isArray(data)) {
            throw new Error('JSON is not an array.');
        }
        tariffData = data;
        statusMessage.textContent = `成功載入關稅規則，包含 ${tariffData.length} 筆規則。`;
        statusMessage.classList.remove('text-blue-700');
        statusMessage.classList.add('text-green-700');
        loaderUI.classList.remove('bg-blue-50', 'border-blue-200');
        loaderUI.classList.add('bg-green-50', 'border-green-200');

        searchInput.disabled = false;
        searchInput.placeholder = "輸入中文/英文關鍵字或HTSUS碼 (例如: 鋼管, pipe, 8407)...";
        welcomeMessage.classList.add('hidden');
        performSearch();
    }, (error) => {
        statusMessage.textContent = `錯誤: 無法載入資料。(${error.message})`;
        statusMessage.classList.remove('text-blue-700');
        statusMessage.classList.add('text-red-700');
        loaderUI.classList.remove('bg-blue-50', 'border-blue-200');
        loaderUI.classList.add('bg-red-50', 'border-red-200');
    });

    function handleFilterClick(e) {
        const text = e.currentTarget.textContent;
        if (text === '全部') currentFilter = 'All';
        else if (text === '鋼鐵') currentFilter = 'Steel';
        else if (text === '鋁') currentFilter = 'Aluminum';
        updateFilterButtons(e.currentTarget);
        performSearch();
    }

    function handleHtsCodeClick(e) {
        if (e.target.classList.contains('hts-code-link')) {
            const code = e.target.textContent.trim();
            // Always switch to HTS tab and search via API
            document.getElementById('tabHts').click();
            const htsInput = document.getElementById('htsSearchInput');
            const htsSearchBtn = document.getElementById('htsSearchBtn');
            if (htsInput) {
                htsInput.value = code;
                htsSearchBtn.click(); // Trigger API search
                htsInput.focus();
            }
        }
    }

    function renderTariffInfo(tariffs) {
        if (!tariffs) {
            tariffs = { sec232: { applicable: true, rate: '50%', note: '此為8/18新增之衍生品關稅 (針對鋼/鋁內容物)' } };
        }
        let tariffHtml = '<div class="mt-4 pt-4 border-t border-dashed border-gray-300 space-y-3">';
        tariffHtml += '<h4 class="text-sm font-bold text-gray-800">關稅適用性分析</h4>';
        if (tariffs.sec232?.applicable) tariffHtml += `<div class="flex items-start"><div class="flex-shrink-0 w-24 text-xs font-semibold text-red-700 bg-red-100 px-2 py-1 rounded-full text-center">Section 232</div><div class="ml-4"><p class="text-sm font-bold text-red-700">${tariffs.sec232.rate}</p><p class="text-xs text-gray-500">${tariffs.sec232.note}</p></div></div>`;
        if (tariffs.sec301?.applicable) tariffHtml += `<div class="flex items-start"><div class="flex-shrink-0 w-24 text-xs font-semibold text-yellow-800 bg-yellow-100 px-2 py-1 rounded-full text-center">Section 301</div><div class="ml-4"><p class="text-sm font-bold text-yellow-800">${tariffs.sec301.rate}</p><p class="text-xs text-gray-500">${tariffs.sec301.note}</p></div></div>`;
        if (tariffs.ad_cvd?.applicable) tariffHtml += `<div class="flex items-start"><div class="flex-shrink-0 w-24 text-xs font-semibold text-purple-800 bg-purple-100 px-2 py-1 rounded-full text-center">AD / CVD</div><div class="ml-4"><p class="text-sm font-bold text-purple-800">高度風險</p><p class="text-xs text-gray-500">${tariffs.ad_cvd.note}</p></div></div>`;
        tariffHtml += '</div>';
        return tariffHtml;
    }

    const renderResults = safe((results) => {
        resultsContainer.innerHTML = '';
        if (tariffData.length === 0) {
            welcomeMessage.classList.remove('hidden');
            noResults.classList.add('hidden');
            return;
        }
        welcomeMessage.classList.add('hidden');
        noResults.classList.toggle('hidden', results.length > 0);

        results.forEach((item, index) => {
            const materialClass = item.material.includes('Steel') && item.material.includes('Aluminum') ? 'bg-indigo-100 text-indigo-800' : (item.material.includes('Steel') ? 'bg-blue-100 text-blue-800' : 'bg-gray-200 text-gray-800');
            const materialText = item.material.includes('Steel') && item.material.includes('Aluminum') ? '鋼/鋁' : (item.material.includes('Steel') ? '鋼鐵' : '鋁');
            let titleTag = item.isDerivative ? `<span class="text-xs font-medium bg-green-100 text-green-800 px-2 py-0.5 rounded-full ml-2">8/18 新增 50%</span>` : '';
            const detailsHtml = item.details?.map(detail => `<div class="py-2 px-4 flex items-start border-t border-gray-200 hover:bg-gray-50"><span class="hts-code-link text-sm font-mono text-gray-500 w-32 flex-shrink-0 cursor-pointer">${detail.hts || detail.sub_hts}</span><span class="text-sm text-gray-700">${detail.desc || ''}</span></div>`).join('') || '';
            const tariffInfoHtml = renderTariffInfo(item.tariffs);
            const card = `<div class="bg-white rounded-xl shadow-md overflow-hidden transition-shadow duration-300 hover:shadow-lg"><div id="header-${index}" class="p-5 cursor-pointer hover:bg-gray-50 transition-colors flex justify-between items-center"><div class="flex-grow"><div class="flex justify-between items-start gap-4"><h2 class="text-lg font-bold text-gray-900">${item.description} ${titleTag}</h2><span class="text-xs font-semibold px-2 py-1 rounded-full ${materialClass} flex-shrink-0 mt-1">${materialText}</span></div><p class="text-sm text-gray-500 mt-2">相關 HTSUS 章節: ${item.chapter}</p></div><svg id="chevron-${index}" class="chevron w-6 h-6 text-gray-400 flex-shrink-0 ml-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" /></svg></div><div id="details-${index}" class="details-container px-5 pb-5 overflow-hidden transition-all">${detailsHtml}${tariffInfoHtml}</div></div>`;
            resultsContainer.innerHTML += card;
        });

        results.forEach((_, index) => {
            const header = document.getElementById(`header-${index}`);
            if (header) {
                header.addEventListener('click', () => {
                    document.getElementById(`details-${index}`).classList.toggle('open');
                    document.getElementById(`chevron-${index}`).classList.toggle('open');
                });
            }
        });
    }, (error) => {
        resultsContainer.innerHTML = `<div class="text-center py-10 text-red-600">渲染失敗：${error.message}</div>`;
    });

    function performSearch() {
        if (tariffData.length === 0) {
            renderResults([]);
            return;
        }
        const searchTerm = searchInput.value.toLowerCase().trim();
        const filteredData = tariffData.filter(item => {
            const matchesFilter = currentFilter === 'All' || item.material.includes(currentFilter);
            if (!matchesFilter) return false;
            const matchesMain = item.description.toLowerCase().includes(searchTerm) || item.chapter.toLowerCase().includes(searchTerm);
            const matchesDetails = item.details?.some(d => (d.hts || d.sub_hts).toLowerCase().includes(searchTerm) || (d.desc || '').toLowerCase().includes(searchTerm));
            return searchTerm === '' || matchesMain || matchesDetails;
        }).sort((a, b) => a.isDerivative - b.isDerivative);
        renderResults(filteredData);
    }

    function updateFilterButtons(activeButton) {
        filterButtons.forEach(btn => {
            btn.classList.remove('bg-blue-500', 'text-white', 'shadow');
            btn.classList.add('bg-white', 'text-gray-700');
        });
        activeButton.classList.add('bg-blue-500', 'text-white', 'shadow');
        activeButton.classList.remove('bg-white', 'text-gray-700');
    }

    // --- App 1 Initialization ---
    filterButtons.forEach(button => button.addEventListener('click', handleFilterClick));
    searchInput.addEventListener('input', performSearch);
    resultsContainer.addEventListener('click', handleHtsCodeClick);

    // 自動載入 tariff_rules.json
    loadTariffRules();
    performSearch(); // Initial render (will show welcome message)
}