import React, { useState, useEffect, useMemo } from 'react';
import { useSearch } from '../context/SearchContext';
import { useNotifier } from '../context/NotificationContext';

// ... (types remain the same) ...
interface TariffDetail { hts?: string; sub_hts?: string; desc?: string; }
interface TariffTariffs { sec232?: { applicable: boolean; rate: string; note: string }; sec301?: { applicable: boolean; rate: string; note: string }; ad_cvd?: { applicable: boolean; note: string }; }
interface TariffItem { description: string; chapter: string; material: string; isDerivative: boolean; details?: TariffDetail[]; tariffs?: TariffTariffs; }


// Sub-component for rendering each result card
const ResultCard = ({ item }: { item: TariffItem }) => {
  const [isOpen, setIsOpen] = useState(false);
  const { searchHtsCode } = useSearch();

  const materialClass = item.material.includes('Steel') && item.material.includes('Aluminum')
    ? 'bg-indigo-100 text-indigo-800'
    : (item.material.includes('Steel') ? 'bg-blue-100 text-blue-800' : 'bg-gray-200 text-gray-800');
  const materialText = item.material.includes('Steel') && item.material.includes('Aluminum')
    ? '鋼/鋁'
    : (item.material.includes('Steel') ? '鋼鐵' : '鋁');

  const handleHtsCodeClick = (code: string) => {
    if (code) searchHtsCode(code);
  };

  const renderTariffInfo = (tariffs?: TariffTariffs) => {
    if (!tariffs) return null;
    return (
      <div className="mt-4 pt-4 border-t border-dashed border-gray-300 space-y-4">
        <h4 className="text-base font-semibold text-gray-800">關稅適用性分析</h4>
        {tariffs.sec232?.applicable && (
          <div className="flex items-start">
            <div className="flex-shrink-0 w-28 text-sm font-semibold text-red-700 bg-red-100 px-3 py-1 rounded-full text-center">Section 232</div>
            <div className="ml-4">
              <p className="text-base font-bold text-red-700">{tariffs.sec232.rate}</p>
              <p className="text-sm text-gray-600">{tariffs.sec232.note}</p>
            </div>
          </div>
        )}
        {tariffs.sec301?.applicable && (
          <div className="flex items-start">
             <div className="flex-shrink-0 w-28 text-sm font-semibold text-yellow-800 bg-yellow-100 px-3 py-1 rounded-full text-center">Section 301</div>
             <div className="ml-4"><p className="text-base font-bold text-yellow-800">{tariffs.sec301.rate}</p><p className="text-sm text-gray-600">{tariffs.sec301.note}</p></div>
          </div>
        )}
        {tariffs.ad_cvd?.applicable && (
          <div className="flex items-start">
            <div className="flex-shrink-0 w-28 text-sm font-semibold text-purple-800 bg-purple-100 px-3 py-1 rounded-full text-center">AD / CVD</div>
            <div className="ml-4"><p className="text-base font-bold text-purple-800">高度風險</p><p className="text-sm text-gray-600">{tariffs.ad_cvd.note}</p></div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg overflow-hidden transition-shadow duration-300 hover:shadow-xl border border-gray-200">
      <div
        className="p-6 cursor-pointer hover:bg-gray-50 transition-colors flex justify-between items-center"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex-grow pr-4">
          <div className="flex justify-between items-start gap-4">
            <h2 className="text-xl font-bold text-gray-900">
              {item.description}
              {item.isDerivative && <span className="text-sm font-semibold bg-green-100 text-green-800 px-2.5 py-1 rounded-full ml-3 align-middle">新增衍生品</span>}
            </h2>
            <span className={`text-sm font-semibold px-3 py-1 rounded-full ${materialClass} flex-shrink-0 mt-1`}>{materialText}</span>
          </div>
          <p className="text-base text-gray-500 mt-2">相關 HTSUS 章節: {item.chapter}</p>
        </div>
        <svg
          className={`transform transition-transform duration-300 w-7 h-7 text-gray-400 flex-shrink-0 ml-4 ${isOpen ? 'rotate-90' : ''}`}
          xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
      </div>
      {isOpen && (
        <div className="details-container px-6 pb-6 pt-2 overflow-hidden">
          <div className="divide-y divide-gray-200">
            {item.details?.map((detail, index) => (
              <div key={index} className="py-3 flex items-start">
                <span
                  className="hts-code-link text-base font-mono text-blue-600 w-36 flex-shrink-0 cursor-pointer hover:underline"
                  onClick={(e) => { e.stopPropagation(); handleHtsCodeClick(detail.hts || detail.sub_hts || '')}}
                >
                  {detail.hts || detail.sub_hts}
                </span>
                <span className="text-base text-gray-700">{detail.desc || ''}</span>
              </div>
            ))}
          </div>
          {renderTariffInfo(item.tariffs)}
        </div>
      )}
    </div>
  );
};


const TariffQuery = () => {
  const [tariffData, setTariffData] = useState<TariffItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentFilter, setCurrentFilter] = useState<'All' | 'Steel' | 'Aluminum'>('All');
  const { addNotification } = useNotifier();

  useEffect(() => {
    addNotification('正在讀取關稅規則...', 'info');
    fetch('/tariff_rules.json')
      .then(response => {
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        return response.json();
      })
      .then(data => {
        if (!Array.isArray(data)) throw new Error('JSON is not an array.');
        setTariffData(data);
        addNotification(`成功載入 ${data.length} 筆規則`, 'success');
      })
      .catch(error => {
        addNotification(`錯誤: ${error.message}`, 'error');
      })
      .finally(() => setIsLoading(false));
  }, [addNotification]);

  const filteredData = useMemo(() => {
    if (tariffData.length === 0) return [];

    return tariffData.filter(item => {
        const lowerSearchTerm = searchTerm.toLowerCase().trim();
        const matchesFilter = currentFilter === 'All' || item.material.includes(currentFilter);
        if (!matchesFilter) return false;
        if (lowerSearchTerm === '') return true;
        const matchesMain = item.description.toLowerCase().includes(lowerSearchTerm) || item.chapter.toLowerCase().includes(lowerSearchTerm);
        const matchesDetails = item.details?.some(d =>
            (d.hts || d.sub_hts || '').toLowerCase().includes(lowerSearchTerm) ||
            (d.desc || '').toLowerCase().includes(lowerSearchTerm)
        );
        return matchesMain || matchesDetails;
    }).sort((a, b) => (a.isDerivative ? 0 : 1) - (b.isDerivative ? 0 : 1));
  }, [tariffData, searchTerm, currentFilter]);

  return (
    <div>
      <div className="bg-white p-6 rounded-2xl shadow-lg mb-8 sticky top-4 z-10">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-grow">
            <input
              type="text"
              placeholder={isLoading ? "請先載入資料..." : "輸入中文/英文關鍵字或HTSUS碼..."}
              className="w-full p-4 pl-12 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow disabled:opacity-50"
              disabled={isLoading}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <svg className="w-6 h-6 text-gray-400 absolute top-1/2 left-4 transform -translate-y-1/2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" /></svg>
          </div>
          <div className="flex items-center justify-center space-x-2 bg-gray-100 p-1 rounded-xl">
            {(['All', 'Steel', 'Aluminum'] as const).map(filter => {
                const filterText = filter === 'All' ? '全部' : (filter === 'Steel' ? '鋼鐵' : '鋁');
                return (
                    <button
                        key={filter}
                        onClick={() => setCurrentFilter(filter)}
                        className={`filter-btn px-4 py-2 rounded-lg font-semibold transition-colors duration-200 ${currentFilter === filter ? 'bg-blue-500 text-white shadow' : 'bg-white text-gray-700 hover:bg-blue-100'}`}
                    >
                        {filterText}
                    </button>
                )
            })}
          </div>
        </div>
      </div>

      <main className="space-y-6 mt-8">
        {isLoading && (
            <div className="text-center py-16"><p className="text-lg">載入中...</p></div>
        )}
        {!isLoading && filteredData.length === 0 && (
            <div className="text-center py-16">
                <svg className="mx-auto h-16 w-16 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V7a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                <h3 className="mt-4 text-xl font-medium text-gray-900">找不到結果</h3>
                <p className="mt-2 text-base text-gray-500">請嘗試使用不同的關鍵字或調整篩選條件。</p>
            </div>
        )}
        {filteredData.map((item, index) => (
          <ResultCard key={index} item={item} />
        ))}
      </main>
    </div>
  );
};

export default TariffQuery;
