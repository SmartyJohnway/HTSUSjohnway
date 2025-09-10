import React, { useState } from 'react';

// Define the data structure for a row in our table
interface RegulationRow {
  regulation: string;
  taxRate: string;
  legalSource: string;
  effectiveDate: string;
  exclusion: string;
  dataSource: string;
}

// Define the columns for our table
const columns = [
  { accessor: 'regulation', header: '法規/措施' },
  { accessor: 'taxRate', header: '稅率' },
  { accessor: 'legalSource', header: '法源依據' },
  { accessor: 'effectiveDate', header: '生效區間' },
  { accessor: 'exclusion', header: '排除條款' },
  { accessor: 'dataSource', header: '資料來源' },
];

export function RegulationsMatrix() {
  const [htsCode, setHtsCode] = useState('7306.30');
  const [data, setData] = useState<RegulationRow[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async () => {
    if (!htsCode.trim()) {
      setError('請輸入 HTS Code。');
      return;
    }
    setIsLoading(true);
    setError(null);
    setData([]);

    try {
      // Fetch from both APIs concurrently
      const [htsRes, frRes] = await Promise.all([
        fetch(`/api/hts-proxy?keyword=${encodeURIComponent(htsCode)}`),
        fetch(`/api/fr-proxy?conditions[term]=${encodeURIComponent(htsCode)}&per_page=5`)
      ]);

      if (!htsRes.ok) throw new Error(`HTS API 查詢失敗: ${htsRes.statusText}`);
      if (!frRes.ok) throw new Error(`Federal Register API 查詢失敗: ${frRes.statusText}`);

      const htsData = await htsRes.json();
      const frData = await frRes.json();

      // --- Data Transformation Logic ---
      // This is a simplified transformation. A real implementation would be more complex.
      const transformedData: RegulationRow[] = [];

      // Example: Create a row from HTS data
      if (htsData.results && htsData.results.length > 0) {
        const item = htsData.results[0];
        transformedData.push({
          regulation: 'HTSUS General Rate',
          taxRate: item.general || 'N/A',
          legalSource: `HTSUS ${item.htsno}`,
          effectiveDate: 'Current',
          exclusion: item.special || 'See special rates',
          dataSource: 'HTS API'
        });
      }

      // Example: Create rows from Federal Register data
      if (frData.results && frData.results.length > 0) {
        frData.results.forEach((doc: any) => {
          transformedData.push({
            regulation: 'Federal Register Notice',
            taxRate: 'Varies',
            legalSource: doc.document_number,
            effectiveDate: doc.effective_on || 'N/A',
            exclusion: 'See document text.',
            dataSource: 'Federal Register API'
          });
        });
      }

      if (transformedData.length === 0) {
        setError('找不到與此 HTS Code 相關的法規資訊。');
      }

      setData(transformedData);

    } catch (e: any) {
      setError(e.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-4">法規交叉矩陣查詢</h2>
      <div className="flex items-center space-x-4 mb-6">
        <input
          type="text"
          value={htsCode}
          onChange={(e) => setHtsCode(e.target.value)}
          placeholder="輸入 HTS Code..."
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          disabled={isLoading}
        />
        <button
          onClick={handleSearch}
          className="px-6 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
          disabled={isLoading}
        >
          {isLoading ? '查詢中...' : '查詢'}
        </button>
      </div>

      {error && <div className="text-red-600 bg-red-50 p-3 rounded-lg mb-4">{error}</div>}

      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border border-gray-200">
          <thead className="bg-gray-100">
            <tr>
              {columns.map((col) => (
                <th key={col.accessor} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {isLoading ? (
              <tr>
                <td colSpan={columns.length} className="text-center py-8 text-gray-500">
                  讀取中...
                </td>
              </tr>
            ) : data.length > 0 ? (
              data.map((row, rowIndex) => (
                <tr key={rowIndex}>
                  {columns.map((col) => (
                    <td key={col.accessor} className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {row[col.accessor as keyof typeof row]}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={columns.length} className="text-center py-8 text-gray-500">
                  {error ? '查詢出錯，請重試。' : '請輸入 HTS Code 並點擊查詢。'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
