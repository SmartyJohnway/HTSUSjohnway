import React, { createContext, useState, useContext, ReactNode, useCallback } from 'react';
import { useNotifier } from './NotificationContext';
import { useResearchTrail } from './ResearchTrailContext';
import cache from '../utils/cache';

// Types moved from HtsDatabase.tsx
interface HtsFootnote { columns: string[]; value: string; }
export interface HtsItem { htsno: string; indent: string; description: string; superior: string | null; units: string[]; general: string; special: string; other: string; col2: string; quotaQuantity: string | null; additionalDuties: string | null; footnotes: HtsFootnote[] | null; statisticalSuffix?: string; }

// Utility function moved from HtsDatabase.tsx
function check232Applicability(item: HtsItem, allItems: HtsItem[]): boolean {
    const is232Related = item.footnotes?.some(f => f.value?.includes('subchapter III, chapter 99') || f.value?.includes('note 16') || f.value?.includes('note 19')) ?? false;
    if (!is232Related && item.statisticalSuffix) {
        const parentHts = item.htsno.split('.').slice(0, -1).join('.');
        const parentItem = allItems.find(i => i.htsno === parentHts);
        if (parentItem) return check232Applicability(parentItem, allItems);
    }
    return is232Related;
}


type Tab = 'query' | 'hts' | 'sources' | 'matrix';

interface SearchContextType {
  activeTab: Tab;
  setActiveTab: (tab: Tab) => void;

  // HTS Search State
  htsSearchTerm: string;
  searchHtsCode: (code: string) => void;
  performHtsSearch: (term: string, show232Only: boolean) => Promise<void>;
  htsResults: HtsItem[];
  isHtsLoading: boolean;
}

const SearchContext = createContext<SearchContextType | undefined>(undefined);

export const useSearch = () => {
  const context = useContext(SearchContext);
  if (!context) {
    throw new Error('useSearch must be used within a SearchProvider');
  }
  return context;
};

interface SearchProviderProps {
  children: ReactNode;
}

export const SearchProvider = ({ children }: SearchProviderProps) => {
  const [activeTab, setActiveTab] = useState<Tab>('query');

  // HTS Search State
  const [htsSearchTerm, setHtsSearchTerm] = useState('');
  const [htsResults, setHtsResults] = useState<HtsItem[]>([]);
  const [isHtsLoading, setIsHtsLoading] = useState(false);
  const { addNotification } = useNotifier();
  const { addTrailItem } = useResearchTrail();

  const searchHtsCode = (code: string) => {
    setHtsSearchTerm(code);
    setActiveTab('hts');
  };

  const performHtsSearch = useCallback(async (term: string, show232Only: boolean) => {
    const termToSearch = term.trim();
    if (termToSearch.length < 2) {
      addNotification('請輸入至少 2 個字元以進行搜尋', 'info');
      return;
    }

    addTrailItem({ type: 'search', term: termToSearch });

    const cacheKey = { searchTerm: termToSearch, show232Only };
    const cachedResults = cache.get<HtsItem[]>(cacheKey);
    if (cachedResults) {
      setHtsResults(cachedResults);
      addNotification(`從快取載入 ${cachedResults.length} 筆結果`, 'success');
      return;
    }

    setIsHtsLoading(true);
    addNotification('正在查詢 USITC API...', 'info');
    try {
      const proxyUrl = `/.netlify/functions/hts-proxy?keyword=${encodeURIComponent(termToSearch)}`;
      const response = await fetch(proxyUrl);
      const data = await response.json();

      if (!response.ok || data.error) throw new Error(data.error || 'Proxy returned an error');
      if (!Array.isArray(data.results)) throw new Error('API 回傳的資料格式不正確');

      const allResults: HtsItem[] = data.results;
      const filtered = show232Only ? allResults.filter(item => check232Applicability(item, allResults)) : allResults;

      setHtsResults(filtered);
      cache.set(cacheKey, filtered);
      addNotification(`成功取得 ${filtered.length} 筆結果`, 'success');
    } catch (err: any) {
      addNotification(`查詢失敗: ${err.message}`, 'error');
      setHtsResults([]);
    } finally {
      setIsHtsLoading(false);
    }
  }, [addNotification, addTrailItem]);

  const value = {
    activeTab,
    setActiveTab,
    htsSearchTerm,
    searchHtsCode,
    performHtsSearch,
    htsResults,
    isHtsLoading,
  };

  return <SearchContext.Provider value={value}>{children}</SearchContext.Provider>;
};
