import React, { createContext, useState, useContext, ReactNode } from 'react';

type Tab = 'query' | 'hts' | 'sources';

interface SearchContextType {
  activeTab: Tab;
  setActiveTab: (tab: Tab) => void;
  htsSearchTerm: string;
  searchHtsCode: (code: string) => void;
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
  const [htsSearchTerm, setHtsSearchTerm] = useState('');

  const searchHtsCode = (code: string) => {
    setHtsSearchTerm(code);
    setActiveTab('hts');
  };

  const value = {
    activeTab,
    setActiveTab,
    htsSearchTerm,
    searchHtsCode,
  };

  return <SearchContext.Provider value={value}>{children}</SearchContext.Provider>;
};
