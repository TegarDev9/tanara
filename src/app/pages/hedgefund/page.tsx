'use client';

import { useState } from 'react';
import { Sparkles, TrendingUp, AlertTriangle, Clock, Brain, BarChart3 } from 'lucide-react';
import type { Agent, AgentKey, AgentRec, ApiResponse, Stance } from '@/app/api/hedgefund/types';

// Fungsi sanitasi sederhana untuk client, karena sanitasi utama ada di server
const sanitizeClientText = (text: string | null | undefined): string => {
  if (!text) return '';
  // Cukup ganti kutipan untuk estetika, karena karakter berbahaya sudah dihapus server
  return text
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
};

// --- Komponen UI ---

const StanceBadge = ({ stance }: { stance: AgentRec['stance'] }) => {
  const styles: Record<Stance, string> = {
    bullish: 'bg-white text-black border border-gray-300 shadow-sm',
    bearish: 'bg-black text-white border border-gray-700 shadow-sm',
    neutral: 'bg-gray-100 text-gray-900 border border-gray-400 shadow-sm',
  };
  return (
    <div className="relative">
      <span className={`px-3 py-1.5 text-xs font-bold rounded-full uppercase tracking-wider ${styles[stance]} backdrop-blur-sm`}>
        {stance}
      </span>
    </div>
  );
};

const AgentCard = ({ agent, rec }: { agent: Agent; rec: AgentRec }) => (
  <div className="group relative bg-white border border-gray-200 rounded-3xl p-6 hover:border-black transition-all duration-500 hover:shadow-2xl hover:shadow-black/10 transform hover:-translate-y-1">
    <div className="absolute inset-0 bg-gradient-to-br from-gray-50/50 to-transparent rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
    <div className="relative z-10">
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center gap-2">
          <Brain className="h-5 w-5 text-gray-700" />
          <h3 className="font-bold text-black text-lg tracking-tight">{agent.name}</h3>
        </div>
        <StanceBadge stance={rec.stance} />
      </div>
      <p className="text-sm text-gray-600 italic mb-6 leading-relaxed border-l-2 border-gray-200 pl-4">
        &ldquo;{sanitizeClientText(agent.tagline)}&rdquo;
      </p>
      <div className="space-y-4 text-sm flex-grow">
        <div className="bg-gray-50 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <BarChart3 className="h-4 w-4 text-gray-700" />
            <strong className="text-black font-semibold">Investment Thesis</strong>
          </div>
          <p className="text-gray-700 leading-relaxed">{sanitizeClientText(rec.thesis)}</p>
        </div>
        <div className="bg-black rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="h-4 w-4 text-white" />
            <strong className="text-white font-semibold">Risk Assessment</strong>
          </div>
          <p className="text-gray-300 leading-relaxed">{sanitizeClientText(rec.risk)}</p>
        </div>
      </div>
      <div className="mt-6 pt-4 border-t border-gray-200 flex items-center justify-between">
        <span className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Timeframe</span>
        <span className="text-sm font-bold text-black bg-gray-100 px-3 py-1 rounded-full">
          {rec.timeframe}
        </span>
      </div>
    </div>
  </div>
);

const LoadingSpinner = () => (
  <div className="flex flex-col items-center justify-center py-16">
    <div className="relative">
      <div className="w-16 h-16 border-4 border-gray-200 rounded-full animate-spin" />
      <div className="w-16 h-16 border-4 border-black border-t-transparent rounded-full animate-spin absolute top-0 left-0" />
    </div>
    <p className="mt-6 text-lg font-medium text-gray-700">Processing Analysis...</p>
    <p className="text-sm text-gray-500 mt-1">Please wait while our AI agents work</p>
  </div>
);

// --- Komponen Halaman Utama ---
export default function HedgeFundPage() {
  const [symbol, setSymbol] = useState('btc');
  const [hedgeFundData, setHedgeFundData] = useState<ApiResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFetchAnalysis = async () => {
    if (!symbol.trim()) {
      setError('Symbol cannot be empty.');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    setHedgeFundData(null);

    try {
      const response = await fetch(`/api/hedgefund?symbol=${symbol.toLowerCase().trim()}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `API request failed with status ${response.status}`);
      }
      
      setHedgeFundData(data as ApiResponse);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'An unknown error occurred.';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const getAgentByKey = (key: AgentKey) =>
    hedgeFundData?.meta.agents.find((a: Agent) => a.key === key);

  return (
    <div className="min-h-screen bg-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,_rgba(0,0,0,0.05)_1px,_transparent_0)] bg-[length:20px_20px]" />
      <main className="relative container mx-auto px-4 py-12 md:py-20 max-w-7xl">
        <header className="text-center mb-16">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-black rounded-2xl mb-8 shadow-lg">
            <Sparkles className="h-10 w-10 text-white" />
          </div>
          <h1 className="text-6xl md:text-7xl font-black tracking-tight text-black mb-6">
            AI Fund
            <span className="block text-gray-600 text-5xl md:text-6xl mt-2">Intelligence</span>
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed font-medium">
            Advanced multi-agent analysis powered by legendary investment minds and cutting-edge quantitative models
          </p>
        </header>

        <div className="max-w-2xl mx-auto mb-16">
          <div className="bg-white border border-gray-300 rounded-2xl p-2 shadow-lg hover:shadow-xl transition-shadow duration-300">
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                value={symbol}
                onChange={e => setSymbol(e.target.value)}
                placeholder="Enter symbol (e.g., BTC, AAPL, NVDA)"
                className="flex-1 bg-transparent border-0 rounded-xl px-6 py-4 text-lg placeholder-gray-400 focus:outline-none text-black font-medium"
                onKeyUp={e => e.key === 'Enter' && handleFetchAnalysis()}
              />
              <button
                onClick={handleFetchAnalysis}
                disabled={isLoading}
                className="bg-black text-white font-bold text-lg px-8 py-4 rounded-xl hover:bg-gray-900 disabled:bg-gray-400 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105 shadow-lg active:scale-95"
              >
                {isLoading ? 'Analyzing...' : 'Analyze Now'}
              </button>
            </div>
          </div>
        </div>

        <div className="space-y-12">
          {isLoading && <LoadingSpinner />}
          {error && (
            <div className="max-w-2xl mx-auto bg-black text-white p-6 rounded-2xl border border-gray-800">
              <div className="flex items-center gap-4">
                <AlertTriangle className="h-6 w-6" />
                <div>
                  <h3 className="font-bold text-lg">Analysis Error</h3>
                  <p className="text-gray-300">{error}</p>
                </div>
              </div>
            </div>
          )}
          {hedgeFundData && (
            <div className="space-y-12 animate-in slide-in-from-bottom duration-700">
              {hedgeFundData.price.data && (
                <div className="max-w-4xl mx-auto bg-gradient-to-r from-black to-gray-800 text-white rounded-3xl p-8 shadow-2xl">
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-3 mb-4">
                      <TrendingUp className="h-8 w-8" />
                      <h2 className="text-3xl font-bold">
                        {hedgeFundData.symbol.toUpperCase()} Live Price
                      </h2>
                    </div>
                    <div className="text-6xl md:text-7xl font-black font-mono tracking-tighter mb-4">
                      ${hedgeFundData.price.data.price?.toLocaleString()}
                    </div>
                    <div className="flex items-center justify-center gap-2 text-gray-300">
                      <Clock className="h-4 w-4" />
                      <span className="text-sm">
                        Updated: {new Date(hedgeFundData.price.data.lastRefreshed || Date.now()).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              )}
              {hedgeFundData.price.error && (
                <div className="max-w-2xl mx-auto bg-gray-100 border border-gray-300 text-black p-6 rounded-2xl">
                  <strong className="font-semibold">Price Data Notice:</strong> {hedgeFundData.price.error}
                </div>
              )}
              <div>
                <h2 className="text-4xl font-black text-center mb-12 text-black">
                  Expert Analysis
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                  {hedgeFundData.agents.data &&
                    Object.entries(hedgeFundData.agents.data).map(([key, rec]) => {
                      const agent = getAgentByKey(key as AgentKey);
                      return agent ? <AgentCard key={key} agent={agent} rec={rec} /> : null;
                    })}
                </div>
              </div>
              {hedgeFundData.agents.error && (
                <div className="max-w-2xl mx-auto bg-gray-100 border border-gray-300 text-black p-6 rounded-2xl">
                  <strong className="font-semibold">Analysis Notice:</strong> {hedgeFundData.agents.error}
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
