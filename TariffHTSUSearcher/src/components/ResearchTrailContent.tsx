import React from 'react';
import { useResearchTrail, TrailItem } from '../context/ResearchTrailContext';
import Button from './ui/Button';
const TrailItemCard = ({ item }: { item: TrailItem }) => {
  const renderContent = () => {
    switch (item.type) {
      case 'search':
        return (
          <>
            <span className="font-semibold">搜尋:</span>
            <span className="ml-2 font-mono bg-gray-100 px-2 py-1 rounded">{item.term}</span>
          </>
        );
      case 'view_hts':
        return (
          <>
            <span className="font-semibold">查看:</span>
            <div className="mt-1">
              <p className="font-mono text-blue-600">{item.hts}</p>
              <p className="text-gray-600 text-sm truncate">{item.description}</p>
            </div>
          </>
        );
      default:
        return null;
    }
  };

  return (
    <div className="border-b border-gray-200 px-4 py-3 last:border-b-0">
      <div className="flex items-center justify-between text-sm">
        {renderContent()}
        <time className="text-xs text-gray-400 self-start ml-4 flex-shrink-0">
          {item.timestamp.toLocaleTimeString()}
        </time>
      </div>
    </div>
  );
};


const ResearchTrailContent = () => {
  const { trail, clearTrail } = useResearchTrail();

  const handleExport = () => {
    if (trail.length === 0) {
      alert('研究軌跡是空的，沒有可匯出的內容。');
      return;
    }

    const header = `# 研究軌跡報告\n\n產生時間: ${new Date().toLocaleString()}\n\n---\n\n`;

    const body = trail
      .slice() // Create a copy to avoid reversing the original state
      .reverse() // Export in chronological order
      .map(item => {
        const time = `\`${item.timestamp.toLocaleTimeString()}\``;
        if (item.type === 'search') {
          return `* ${time} **搜尋**: \`${item.term}\``;
        }
        if (item.type === 'view_hts') {
          return `* ${time} **查看**: \`${item.hts}\` - ${item.description}`;
        }
        return '';
      })
      .join('\n');

    const markdownContent = header + body;
    const blob = new Blob([markdownContent], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `research-trail-${new Date().toISOString().split('T')[0]}.md`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-grow overflow-y-auto -mx-4 -my-3">
        {trail.length === 0 ? (
          <div className="text-center text-gray-500 p-8">
            <p>尚未有任何研究活動。</p>
          </div>
        ) : (
          <div>
            {trail.map((item, index) => (
              <TrailItemCard key={index} item={item} />
            ))}
          </div>
        )}
      </div>

      <div className="pt-4 mt-4 border-t border-gray-200">
        <div className="flex gap-2">
          <Button onClick={handleExport} className="flex-1">匯出 (Markdown)</Button>
          <Button onClick={clearTrail} variant="secondary" className="flex-1">清除軌跡</Button>
        </div>
      </div>
    </div>
  );
};

export default ResearchTrailContent;
