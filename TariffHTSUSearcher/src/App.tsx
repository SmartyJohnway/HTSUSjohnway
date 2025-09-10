import React, { useState } from 'react';
import TariffQuery from './components/TariffQuery';
import HtsDatabase from './components/HtsDatabase';
import Section232SearchApp from './apps/Section232SearchApp';
import { RegulationsMatrix } from './apps/RegulationsMatrix';
import { useSearch } from './context/SearchContext';
import Button from './components/ui/Button';
import Modal from './components/ui/Modal';
import ResearchTrailContent from './components/ResearchTrailContent';

type Tab = 'query' | 'hts' | 'sources' | 'matrix';

const TABS: { key: Tab; label: string }[] = [
  { key: 'matrix', label: '法規交叉矩陣' },
  { key: 'query', label: '關稅查詢' },
  { key: 'hts', label: 'HTSUS 稅則資料庫 (API)' },
  { key: 'sources', label: '官方來源與進階工具' },
];

function App() {
  const { activeTab, setActiveTab } = useSearch();
  const [isTrailModalOpen, setIsTrailModalOpen] = useState(false);

  const renderContent = () => {
    switch (activeTab) {
      case 'matrix':
        return <RegulationsMatrix />;
      case 'query':
        return <TariffQuery />;
      case 'hts':
        return <HtsDatabase />;
      case 'sources':
        return <Section232SearchApp />;
      default:
        return <RegulationsMatrix />;
    }
  };

  return (
    <div className="container mx-auto p-4 md:p-8 max-w-6xl">
      <header className="text-center mb-8">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900">美國鋼鋁及稅則查詢系統</h1>
        <p className="text-gray-600 mt-2">整合關稅規則查詢與官方 HTSUS API 資料庫 (React 統一版)</p>
      </header>

      {/* Tab Navigation */}
      <div className="mb-6 border-b border-gray-200">
        <nav className="flex -mb-px space-x-2 md:space-x-6" aria-label="Tabs">
          {TABS.map(tab => (
            <Button
              key={tab.key}
              variant="ghost"
              onClick={() => setActiveTab(tab.key)}
              className={`whitespace-nowrap py-4 px-1 md:px-2 border-b-2 font-medium text-base md:text-lg rounded-none ${
                activeTab === tab.key
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500'
              }`}
            >
              {tab.label}
            </Button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div>
        {renderContent()}
      </div>

      <footer className="text-center mt-12 text-sm text-gray-500">
        <p>資料來源：美國海關暨邊境保衛局(CBP)及商務部(DOC)公告；HTSUS資料庫由USITC API提供。</p>
        <p className="mt-1">本系統僅供參考，最終解釋請以美國官方公告為準。</p>
        <div className="mt-2 flex items-center justify-center gap-2">
          <span>製作者: Johnway</span>
          <button
            onClick={() => setIsTrailModalOpen(true)}
            className="text-xs text-gray-400 hover:text-blue-600 hover:underline"
            title="顯示研究軌跡"
          >
            (顯示軌跡)
          </button>
        </div>
      </footer>

      <Modal
        isOpen={isTrailModalOpen}
        onClose={() => setIsTrailModalOpen(false)}
        title="研究軌跡"
      >
        <ResearchTrailContent />
      </Modal>
    </div>
  );
}

export default App;
