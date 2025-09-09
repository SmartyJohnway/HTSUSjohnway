import React, { useState, useEffect, useMemo } from 'react';
import { useSearch, HtsItem } from '../context/SearchContext';
import Card from './ui/Card';
import Input from './ui/Input';
import Button from './ui/Button';
import Popover from './ui/Popover';
import { useNotifier } from '../context/NotificationContext';

// check232Applicability has been moved to SearchContext
// HtsItem type is now imported from SearchContext

const FootnoteDetails = ({ htsCode }: { htsCode: string }) => {
    const [details, setDetails] = useState<{ loading: boolean; error: string | null; data: HtsItem | null }>({ loading: true, error: null, data: null });
    const { addNotification } = useNotifier();

    useEffect(() => {
        const fetchDetails = async () => {
            try {
                const proxyUrl = `/.netlify/functions/hts-proxy?keyword=${encodeURIComponent(htsCode)}`;
                const response = await fetch(proxyUrl);
                const data = await response.json();
                if (!response.ok || data.error) throw new Error(data.error || '查詢失敗');
                if (!data.results?.length) throw new Error('找不到相關資料');
                setDetails({ loading: false, error: null, data: data.results[0] });
            } catch (error: any) {
                setDetails({ loading: false, error: error.message, data: null });
                addNotification(`無法載入註腳 ${htsCode}: ${error.message}`, 'error');
            }
        };
        fetchDetails();
    }, [htsCode, addNotification]);

    if (details.loading) return <div className="text-gray-500 text-sm p-2">查詢中...</div>;
    if (details.error) return <div className="text-red-600 text-sm p-2 bg-red-50 rounded">{details.error}</div>;
    if (!details.data) return null;

    const result = details.data;
    return (
         <div className="bg-gray-50 rounded-lg p-3 text-sm border border-gray-200">
            <div className="font-semibold text-gray-800">{result.description || '無描述'}</div>
            <div className="mt-2 space-y-1 text-gray-600">
                {result.general && <div>第一欄 (普通): {result.general}</div>}
                {result.special && <div>第一欄 (特): {result.special}</div>}
                {result.other && <div>第二欄: {result.other}</div>}
            </div>
        </div>
    );
};

const HtsResultCard = ({ item, allItems, searchTerm }: { item: HtsItem; allItems: HtsItem[]; searchTerm: string }) => {
    const { htsResults } = useSearch();
    const [isDetailsVisible, setIsDetailsVisible] = useState(false);

    const is232Related = useMemo(() => {
        const check = (currentItem: HtsItem): boolean => {
            const related = currentItem.footnotes?.some(f => f.value?.includes('subchapter III, chapter 99') || f.value?.includes('note 16') || f.value?.includes('note 19')) ?? false;
            if (!related && currentItem.statisticalSuffix) {
                const parentHts = currentItem.htsno.split('.').slice(0, -1).join('.');
                const parentItem = htsResults.find(i => i.htsno === parentHts);
                return parentItem ? check(parentItem) : false;
            }
            return related;
        };
        return check(item);
    }, [item, htsResults]);

    const descriptionHtml = useMemo(() => {
        if (!searchTerm) return item.description || '';
        const regex = new RegExp(searchTerm.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'), 'gi');
        return (item.description || '').replace(regex, `<mark class="bg-yellow-200 px-1 rounded-sm">${searchTerm}</mark>`);
    }, [item.description, searchTerm]);

    return (
        <Card>
            <div style={{ paddingLeft: `${(Number(item.indent) || 0) * 16}px` }}>
                <div className="flex items-start justify-between gap-4">
                    <div className="flex-grow">
                        <div className="flex items-center gap-3 flex-wrap">
                             <p className="font-mono text-lg tracking-wider">
                                <a className="text-blue-700 hover:text-blue-900 hover:underline" href={`https://hts.usitc.gov/search?query=${encodeURIComponent(item.htsno)}`} target="_blank" rel="noopener noreferrer">
                                    {item.htsno}
                                    {item.statisticalSuffix && <span className="text-gray-500">.{item.statisticalSuffix}</span>}
                                </a>
                            </p>
                            {is232Related && <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-800">232條款相關</span>}
                        </div>
                        <p className="text-gray-800 mt-2 text-base" dangerouslySetInnerHTML={{ __html: descriptionHtml }} />
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => setIsDetailsVisible(!isDetailsVisible)}>
                        {isDetailsVisible ? '隱藏細節' : '顯示細節'}
                    </Button>
                </div>

                {isDetailsVisible && (
                    <div className="mt-3 text-xs text-gray-500 space-y-1">
                        <div>縮排: {item.indent || '0'}</div>
                        {item.units?.length > 0 && <div>單位: {item.units.join(', ')}</div>}
                    </div>
                )}

                <div className="mt-4 pt-4 border-t border-dashed border-gray-200">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        <div><p className="font-medium text-gray-500 mb-1">第一欄 (普通)</p><p className="text-gray-900 font-semibold text-base">{item.general}</p></div>
                        <div><p className="font-medium text-gray-500 mb-1">第一欄 (特)</p><p className="text-gray-900 font-semibold text-base">{item.special}</p></div>
                        <div><p className="font-medium text-gray-500 mb-1">第二欄</p><p className="text-gray-900 font-semibold text-base">{item.other || item.col2}</p></div>
                    </div>
                    {item.footnotes && (
                        <div className="mt-4 pt-4 border-t border-dashed border-gray-200">
                            <p className="font-medium text-gray-600 text-base mb-2">註腳說明</p>
                            {item.footnotes.map((f, fIndex) => {
                                const is232Footnote = f.value?.includes('232') || f.value?.includes('9903.');
                                const htsMatches = f.value.match(/99\d{2}\.\d{2}\.\d{2}/g) || [];
                                return (
                                    <div key={fIndex} className="footnote-container relative mt-2">
                                        <div className={`text-sm ${is232Footnote ? 'text-red-700' : 'text-gray-700'}`}>
                                            <span className="font-semibold">{f.columns.join(', ')}:</span>
                                            {is232Footnote && ' 🔔 '}
                                            {f.value.split(/(99\d{2}\.\d{2}\.\d{2})/g).map((part, pIndex) =>
                                                htsMatches.includes(part) ? (
                                                    <Popover
                                                        key={pIndex}
                                                        trigger={
                                                            <a href="#" className="text-blue-600 hover:text-blue-800 font-semibold hover:underline" onClick={e => e.preventDefault()}>
                                                                {part}
                                                            </a>
                                                        }
                                                    >
                                                        <FootnoteDetails htsCode={part} />
                                                    </Popover>
                                                ) : part
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </Card>
    );
};

const HtsDatabase = () => {
    const {
        htsSearchTerm,
        performHtsSearch,
        htsResults,
        isHtsLoading,
    } = useSearch();

    const [localSearchTerm, setLocalSearchTerm] = useState(htsSearchTerm);
    const [show232Only, setShow232Only] = useState(false);

    useEffect(() => {
        if (htsSearchTerm) {
            setLocalSearchTerm(htsSearchTerm);
            performHtsSearch(htsSearchTerm, show232Only);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [htsSearchTerm]); // Only trigger when the global term changes

    const handleManualSearch = () => {
        performHtsSearch(localSearchTerm, show232Only);
    };

    // Sync local state when filter changes and a search term is present
    useEffect(() => {
        if (localSearchTerm) {
            performHtsSearch(localSearchTerm, show232Only);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [show232Only]);


    return (
        <div>
            <Card className="mb-8 sticky top-4 z-10">
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="relative flex-grow">
                        <Input
                            type="text"
                            placeholder="輸入英文關鍵字或 HTS 碼 (e.g., copper, 0101.21.00)..."
                            className="w-full p-3 pl-10"
                            value={localSearchTerm}
                            onChange={e => setLocalSearchTerm(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && handleManualSearch()}
                        />
                         <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                        </div>
                    </div>
                    <Button onClick={handleManualSearch} disabled={isHtsLoading} size="lg">
                        {isHtsLoading ? "查詢中..." : "搜尋"}
                    </Button>
                </div>
                <div className="flex items-center gap-2 px-1 pt-4">
                    <label className="inline-flex items-center cursor-pointer">
                        <input type="checkbox" className="form-checkbox h-5 w-5 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                            checked={show232Only}
                            onChange={e => setShow232Only(e.target.checked)}
                        />
                        <span className="ml-2 text-base text-gray-700">僅顯示 232 條款相關項目</span>
                    </label>
                </div>
            </Card>

            <main className="space-y-6">
                {isHtsLoading && (
                     <div className="flex flex-col items-center justify-center text-center py-16">
                        <svg className="animate-spin h-12 w-12 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                        <p className="mt-6 text-lg text-gray-600">正在透過代理查詢 USITC API 資料...</p>
                    </div>
                )}
                {!isHtsLoading && htsResults.length === 0 && (
                    <div className="text-center py-16">
                        <svg className="mx-auto h-16 w-16 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.916 17.916 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418" /></svg>
                        <h3 className="mt-4 text-xl font-medium text-gray-900">即時 HTSUS 查詢</h3>
                        <p className="mt-2 text-base text-gray-500">請在上方搜尋框輸入關鍵字，直接查詢美國官方稅則資料庫。</p>
                    </div>
                )}
                {htsResults.map(item => <HtsResultCard key={item.htsno} item={item} allItems={htsResults} searchTerm={localSearchTerm} />)}
            </main>
        </div>
    );
};

export default HtsDatabase;
