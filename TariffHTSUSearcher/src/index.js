import { check232Applicability } from './core/footnote-judge.js';
import { renderCards } from './ui/render-cards.js';

export function initializeHtsApiApp() {
  const searchInput = document.getElementById('htsSearchInput');
  const searchBtn = document.getElementById('htsSearchBtn');
  const resultsContainer = document.getElementById('htsResultsContainer');
  const loader = document.getElementById('htsLoader');
  const welcomeMessage = document.getElementById('htsWelcomeMessage');
  const statusContainer = document.getElementById('htsStatusContainer');

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

  async function performApiSearch() {
    const searchTerm = searchInput.value.trim();
    const show232Only = document.getElementById('show232Only').checked;

    if (searchTerm.length < 2) {
      const message = show232Only
        ? '請輸入至少 2 個字元以搜尋 232 條款相關項目。'
        : '請輸入至少 2 個字元以進行搜尋。';
      resultsContainer.innerHTML = `<div class="text-center py-10"><p class="text-lg text-gray-500">${message}</p></div>`;
      return;
    }

    setLoading(true);

    const apiBaseUrl = (typeof window !== 'undefined' && window.API_BASE_URL)
      ? window.API_BASE_URL
      : '/.netlify/functions/hts-proxy';
    const proxyUrl = `${apiBaseUrl}?keyword=${encodeURIComponent(searchTerm)}`;
    const directUrl = `https://hts.usitc.gov/reststop/search?keyword=${encodeURIComponent(searchTerm)}`;

    const existingErrorNote = document.getElementById('htsErrorNote');
    if (existingErrorNote) {
      existingErrorNote.classList.add('hidden');
    }

    try {
      let data;
      try {
        const response = await fetch(proxyUrl);
        const contentType = response.headers.get('content-type') || '';
        if (!response.ok || !contentType.includes('application/json')) {
          throw new Error('Proxy returned non-JSON');
        }
        data = await response.json();
      } catch (proxyError) {
        const response = await fetch(directUrl, {
          headers: { 'User-Agent': 'Tariff-Query-App/1.0' }
        });
        const contentType = response.headers.get('content-type') || '';
        if (!response.ok || !contentType.includes('application/json')) {
          throw new Error('查詢服務暫時無法使用，請稍後再試');
        }
        const fallbackData = await response.json();
        data = { results: Array.isArray(fallbackData) ? fallbackData : [] };
      }

      if (!Array.isArray(data.results)) {
        throw new Error('API 回傳的資料格式不正確');
      }

      const filteredResults = show232Only
        ? data.results.filter(item => check232Applicability(item, data.results))
        : data.results;

      window.currentSearchResults = filteredResults;
      renderCards(filteredResults, { searchInput, resultsContainer, welcomeMessage });
    } catch (error) {
      console.error("API Search Error:", error);
      resultsContainer.innerHTML = `<div class="text-center py-10"><p class="text-lg text-red-600">查詢服務暫時無法使用，請稍後再試。</p><p class="text-sm text-gray-500 mt-1">${error.message}</p></div>`;
      let note = document.getElementById('htsErrorNote');
      if (!note) {
        note = document.createElement('div');
        note.id = 'htsErrorNote';
        note.className = 'text-center text-red-600 py-2';
        statusContainer.appendChild(note);
      }
      note.textContent = '查詢服務暫時無法使用，請稍後再試。';
      note.classList.remove('hidden');
    } finally {
      setLoading(false);
    }
  }

  searchBtn.addEventListener('click', performApiSearch);
  searchInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      performApiSearch();
    }
  });

  let lastClickedLink = null;
  document.addEventListener('click', async (e) => {
    if (e.target.classList.contains('footnote-link')) {
      e.preventDefault();
      const htsCode = e.target.dataset.hts;
      const detailId = e.target.dataset.detailId;
      const detailsContainer = document.getElementById(detailId);
      if (!detailsContainer) return;

      if (lastClickedLink && lastClickedLink !== e.target) {
        const lastDetailId = lastClickedLink.dataset.detailId;
        const lastContainer = document.getElementById(lastDetailId);
        if (lastContainer) {
          lastContainer.classList.add('hidden');
        }
      }

      lastClickedLink = e.target;

      if (detailsContainer.classList.contains('hidden')) {
        detailsContainer.classList.remove('hidden');
        detailsContainer.innerHTML = '<div class="text-gray-500 text-sm py-2">搜尋中...</div>';
        try {
          const response = await fetch(`/.netlify/functions/hts-proxy?keyword=${encodeURIComponent(htsCode)}`);
          const contentType = response.headers.get('content-type') || '';
          const isJson = contentType.includes('application/json');
          const data = isJson ? await response.json() : await response.text();
          if (!response.ok) {
            const message = isJson ? (data.error || '搜尋失敗') : '搜尋失敗';
            throw new Error(message);
          }
          if (!isJson || !data.results?.length) throw new Error('找不到相關資訊');
          const result = data.results[0];
          detailsContainer.innerHTML = `
                          <div class="bg-gray-50 rounded-lg p-3 text-sm border border-gray-200">
                              <div class="flex justify-between items-start">
                                  <div class="font-medium text-gray-900">${result.description || '無描述'}</div>
                                  <button class="text-gray-400 hover:text-gray-600 close-details" data-hts="${htsCode}">
                                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                                      </svg>
                                  </button>
                              </div>
                              <div class="mt-2 space-y-1 text-gray-600">
                                  ${result.general ? `<div>第一欄 (普通): ${result.general}</div>` : ''}
                                  ${result.special ? `<div>第一欄 (特殊): ${result.special}</div>` : ''}
                                  ${result.other ? `<div>第二欄: ${result.other}</div>` : ''}
                              </div>
                          </div>`;
        } catch (error) {
          detailsContainer.innerHTML = `
                          <div class="text-red-500 text-sm py-2 bg-red-50 rounded-lg px-3">
                              ${error.message}
                          </div>`;
        }
      } else {
        detailsContainer.classList.add('hidden');
      }
    }

    if (e.target.closest('.close-details')) {
      const htsCode = e.target.closest('.close-details').dataset.hts;
      const detailsContainer = document.getElementById(`footnote-details-${htsCode.replace(/\./g, '-')}`);
      if (detailsContainer) {
        detailsContainer.classList.add('hidden');
      }
    }
  });

  return {
    performApiSearch,
    renderResults: (items) => renderCards(items, { searchInput, resultsContainer, welcomeMessage }),
    check232Applicability
  };
}

if (typeof window !== 'undefined') {
  window.initializeHtsApiApp = initializeHtsApiApp;
}