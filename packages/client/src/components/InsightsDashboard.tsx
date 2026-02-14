import { useState, useEffect } from 'react';
import { fetchInsights, refreshInsights, InsightsData } from '../api/client';

function formatAge(isoDate: string): string {
  const ms = Date.now() - new Date(isoDate).getTime();
  const minutes = Math.floor(ms / 60000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export default function InsightsDashboard() {
  const [data, setData] = useState<InsightsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchInsights()
      .then(setData)
      .catch(() => setData({ lastGenerated: null, html: null }))
      .finally(() => setLoading(false));
  }, []);

  async function handleRefresh() {
    setRefreshing(true);
    try {
      const result = await refreshInsights();
      setData(result);
    } catch (e) {
      console.error('Failed to refresh insights:', e);
    } finally {
      setRefreshing(false);
    }
  }

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center text-gray-400">
        Loading insights...
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <div className="flex items-center gap-3 p-4 border-b border-gray-700/50">
        {data?.lastGenerated && (
          <span className="text-xs text-gray-400 bg-gray-800 px-2 py-1 rounded">
            Last generated: {formatAge(data.lastGenerated)}
          </span>
        )}
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-indigo-600/20 text-indigo-300 rounded-md hover:bg-indigo-600/30 transition-colors disabled:opacity-50"
        >
          <svg className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          {refreshing ? 'Generating...' : 'Refresh Report'}
        </button>
      </div>

      {data?.html ? (
        <iframe
          srcDoc={data.html}
          className="flex-1 w-full border-0 bg-white"
          title="Claude Code Insights"
        />
      ) : (
        <div className="flex-1 flex items-center justify-center text-gray-500">
          No insights report found. Click "Refresh Report" to generate one.
        </div>
      )}
    </div>
  );
}
