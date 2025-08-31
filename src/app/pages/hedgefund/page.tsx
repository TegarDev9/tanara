'use client';

import { useState } from 'react';
import {
  Sparkles,
  AlertTriangle,
  Clock,
  Brain,
  BarChart3,
  ArrowRight,
  DollarSign,
} from 'lucide-react';
import type { Agent, AgentKey, AgentRec, ApiResponse, Stance } from '@/app/api/hedgefund/types';

// Client-side text sanitization
const sanitizeClientText = (text: string | null | undefined): string => {
  if (!text) return '';
  return text.replace(/&quot;/g, '"').replace(/&#39;/g, "'");
};

// Stance configuration
const stanceConfig: Record<Stance, { label: string; className: string }> = {
  bullish: {
    label: 'Bullish',
    className: 'bg-white text-black border-2 border-white',
  },
  bearish: {
    label: 'Bearish',
    className: 'bg-black text-white border-2 border-white',
  },
  neutral: {
    label: 'Neutral',
    className: 'bg-gray-900 text-white border-2 border-gray-700',
  },
};

// ---- Component: StanceBadge ----
const StanceBadge = ({ stance }: { stance: AgentRec['stance'] }) => {
  const config = stanceConfig[stance];
  return (
    <span
      className={`
        inline-block px-3 py-1 text-xs font-semibold rounded-full
        ${config.className}
        shadow-lg
        transition
      `}
    >
      {config.label}
    </span>
  );
};

// ---- Component: AgentCard ----
const AgentCard = ({ agent, rec }: { agent: Agent; rec: AgentRec }) => (
  <div
    className="
      group relative bg-gray-900 border border-gray-800 rounded-2xl p-6
      hover:border-white hover:shadow-2xl transition-all duration-300
      hover:-translate-y-1
      flex flex-col
    "
  >
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-black rounded-lg border border-white">
            <Brain className="h-5 w-5 text-white" />
          </div>
          <h3 className="font-semibold text-lg text-white">{agent.name}</h3>
        </div>
        <StanceBadge stance={rec.stance} />
      </div>

      {/* Tagline */}
      <p className="text-sm text-gray-400 italic leading-relaxed">
        &ldquo;{sanitizeClientText(agent.tagline)}&rdquo;
      </p>

      {/* Investment Thesis */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <BarChart3 className="h-4 w-4 text-white" />
          <span className="text-sm font-medium text-white">Investment Thesis</span>
        </div>
        <p className="text-sm text-gray-300 leading-relaxed">{sanitizeClientText(rec.thesis)}</p>
      </div>

      {/* Risk Assessment */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-red-500" />
          <span className="text-sm font-medium text-white">Risk Assessment</span>
        </div>
        <p className="text-sm text-gray-300 leading-relaxed">
          {sanitizeClientText(rec.risk)}
        </p>
      </div>

      {/* Timeframe */}
      <div className="pt-4 border-t border-gray-800">
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-500 uppercase tracking-wider">Timeframe</span>
          <span className="text-sm font-bold text-white">{rec.timeframe}</span>
        </div>
      </div>
    </div>
  </div>
);

// ---- Component: LoadingSpinner ----
const LoadingSpinner = () => (
  <div className="flex flex-col items-center justify-center py-12">
    <div className="relative h-16 w-16">
      <div className="absolute inset-0 border-4 border-gray-900 rounded-full animate-spin border-t-transparent"></div>
      <div className="absolute inset-0 border-4 border-white rounded-full animate-spin"></div>
    </div>
    <p className="mt-4 text-white font-semibold tracking-wide">Analyzing...</p>
  </div>
);

// ---- Component: ErrorMessage ----
const ErrorMessage = ({ message }: { message: string }) => (
  <div className="max-w-md mx-auto bg-gray-900 border border-red-500 rounded-xl p-6 text-white">
    <div className="flex items-start gap-3">
      <AlertTriangle className="h-5 w-5 text-red-500 mt-0.5" />
      <div>
        <h3 className="font-semibold">Error</h3>
        <p className="text-sm text-gray-300 mt-1">{message}</p>
      </div>
    </div>
  </div>
);

// ---- Component: PriceDisplay ----
const PriceDisplay = ({
  symbol,
  price,
  lastRefreshed,
}: {
  symbol: string;
  price: number;
  lastRefreshed: string;
}) => (
  <div className="bg-black text-white rounded-2xl p-8 text-center border-2 border-white shadow-lg">
    <div className="flex items-center justify-center gap-2 mb-4">
      <DollarSign className="h-6 w-6 text-green-400" />
      <h2 className="text-2xl font-bold">{symbol.toUpperCase()}</h2>
    </div>
    <div className="text-4xl md:text-5xl font-bold mb-4 font-mono">${price.toLocaleString()}</div>
    <div className="flex items-center justify-center gap-2 text-gray-400 text-xs">
      <Clock className="h-4 w-4" />
      <span>Updated: {new Date(lastRefreshed).toLocaleString()}</span>
    </div>
  </div>
);

// ---- Main Component: HedgeFundPage ----
export default function HedgeFundPage() {
  const [symbol, setSymbol] = useState('btc');
  const [hedgeFundData, setHedgeFundData] = useState<ApiResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch analysis function
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
      const message = err instanceof Error ? err.message : 'An unknown error occurred.';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const getAgentByKey = (key: AgentKey) =>
    hedgeFundData?.meta.agents.find((a: Agent) => a.key === key);

  return (
    <div className="min-h-screen bg-black">
      <main className="container mx-auto px-4 py-16 max-w-6xl">
        {/* Header */}
        <header className="text-center mb-16">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white rounded-xl mb-6 shadow-lg">
            <Sparkles className="h-8 w-8 text-black" />
          </div>
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-4 leading-tight drop-shadow-lg">
            AI Fund Intelligence
          </h1>
          <p className="text-lg text-gray-300 max-w-2xl mx-auto">
            Advanced multi-agent analysis powered by legendary investment minds
          </p>
        </header>
        {/* Search Input */}
        <div className="max-w-lg mx-auto mb-16">
          <div className="bg-gray-900 border border-white/10 rounded-xl p-2 shadow-lg">
            <div className="flex gap-2">
              <input
                type="text"
                value={symbol}
                onChange={(e) => setSymbol(e.target.value)}
                placeholder="Enter symbol (e.g., BTC, AAPL)"
                className="flex-1 bg-transparent border-0 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none"
                onKeyUp={(e) => e.key === 'Enter' && handleFetchAnalysis()}
              />
              <button
                onClick={handleFetchAnalysis}
                disabled={isLoading}
                className="
                  bg-white text-black font-bold px-6 py-3 rounded-lg 
                  hover:bg-gray-100 hover:text-black disabled:bg-gray-400 disabled:text-gray-700 disabled:cursor-not-allowed
                  transition-colors duration-200 flex items-center gap-2 shadow
                "
              >
                {isLoading ? 'Analyzing' : 'Analyze'}
                {!isLoading && <ArrowRight className="h-4 w-4" />}
              </button>
            </div>
          </div>
        </div>
        {/* Content */}
        <div className="space-y-12">
          {isLoading && <LoadingSpinner />}
          {error && <ErrorMessage message={error} />}
          {hedgeFundData && (
            <div className="space-y-12">
              {/* Price Display */}
              {hedgeFundData.price.data && hedgeFundData.price.data.price !== null && (
                <div className="max-w-md mx-auto">
                  <PriceDisplay
                    symbol={hedgeFundData.symbol}
                    price={hedgeFundData.price.data.price}
                    lastRefreshed={hedgeFundData.price.data.lastRefreshed || new Date().toISOString()}
                  />
                </div>
              )}
              {hedgeFundData.price.error && (
                <div className="max-w-md mx-auto bg-gray-900 border border-gray-700 rounded-xl p-4 text-white">
                  <p className="text-sm text-gray-400">
                    <span className="font-medium">Price Data Notice:</span> {hedgeFundData.price.error}
                  </p>
                </div>
              )}
              {/* Expert Analysis */}
              {hedgeFundData.agents.data && (
                <section>
                  <h2 className="text-3xl font-bold text-center mb-8 text-white">Expert Analysis</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {Object.entries(hedgeFundData.agents.data).map(([key, rec]) => {
                      const agent = getAgentByKey(key as AgentKey);
                      return agent ? <AgentCard key={key} agent={agent} rec={rec} /> : null;
                    })}
                  </div>
                </section>
              )}
              {hedgeFundData.agents.error && (
                <div className="max-w-md mx-auto bg-gray-900 border border-gray-700 rounded-xl p-4 text-white">
                  <p className="text-sm text-gray-400">
                    <span className="font-medium">Analysis Notice:</span> {hedgeFundData.agents.error}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
