// pages/chart/page.tsx
'use client';

import React, { useCallback, useEffect, useState } from 'react';
import DynamicChart from '../../../components/DynamicChart';

export default function ChartPage(): JSX.Element {
  const [symbol, setSymbol] = useState<string>('BINANCE:BTCUSDT');
  const [timeframe, setTimeframe] = useState<string>('1D');

  // Simple theme toggle: uses Tailwind "class" strategy.
  const toggleTheme = useCallback((): void => {
    if (typeof document === 'undefined') return;
    document.documentElement.classList.toggle('dark');
  }, []);

  // Ensure dark is default (optional)
  useEffect(() => {
    if (!document.documentElement.classList.contains('dark')) {
      document.documentElement.classList.add('dark');
    }
  }, []);

  const tfs = ['1m', '5m', '15m', '1H', '4H', '1D', '1W'] as const;

  return (
    <div className="min-h-dvh bg-black text-white flex flex-col">
      {/* App bar with safe area */}
      <header className="sticky top-0 z-20 bg-black/90 backdrop-blur border-b border-white/10">
        <div
          className="max-w-md mx-auto px-4 pt-5 pb-3"
          style={{ paddingTop: 'calc(1rem + env(safe-area-inset-top))' }}
        >
          <div className="flex items-center justify-between">
            <div className="text-sm uppercase tracking-widest text-white/70">Pro Chart</div>
            <button
              type="button"
              onClick={toggleTheme}
              aria-label="Toggle theme"
              className="rounded-full border border-white/10 px-3 py-1 text-xs hover:bg-white/5"
            >
              Dark
            </button>
          </div>

          {/* Symbol and price header (price here is illustrative) */}
          <div className="mt-3 flex items-center justify-between">
            <div className="text-xl font-semibold">{symbol.split(':')[1] ?? symbol}</div>
            <div className="text-right">
              <div className="text-lg font-bold">67,420</div>
              <div className="text-xs text-white/70">+2.45% 24h</div>
            </div>
          </div>

          {/* Timeframe pills */}
          <div className="mt-4 grid grid-cols-7 gap-2">
            {tfs.map((tf) => (
              <button
                key={tf}
                type="button"
                onClick={() => setTimeframe(tf)}
                className={[
                  'px-2 py-2 text-xs rounded-md font-medium transition-all',
                  timeframe === tf
                    ? 'bg-white text-black'
                    : 'border border-white/10 hover:bg-white/5',
                ].join(' ')}
                aria-pressed={timeframe === tf}
              >
                {tf}
              </button>
            ))}
          </div>

          {/* Symbol select */}
          <div className="mt-3">
            <label htmlFor="symbol" className="sr-only">
              Symbol
            </label>
            <select
              id="symbol"
              value={symbol}
              onChange={(e) => setSymbol(e.target.value)}
              className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-white/30 focus:outline-none"
            >
              <option value="BINANCE:BTCUSDT">BTC/USDT</option>
              <option value="BINANCE:ETHUSDT">ETH/USDT</option>
              <option value="NASDAQ:AAPL">Apple (AAPL)</option>
              <option value="NASDAQ:GOOGL">Google (GOOGL)</option>
              <option value="TVC:GOLD">Gold</option>
            </select>
          </div>
        </div>
      </header>

      {/* Chart area */}
      <main className="flex-1 max-w-md mx-auto w-full px-4 py-2">
        <div className="rounded-xl overflow-hidden border border-white/10 bg-neutral-950 h-[60vh]">
          <DynamicChart symbol={symbol} timeframe={timeframe} />
        </div>

        {/* Stats strip */}
        <div className="mt-4 grid grid-cols-3 gap-3">
          <div className="rounded-lg border border-white/10 p-3 bg-black/20">
            <div className="text-[10px] uppercase tracking-wider text-white/60">Open</div>
            <div className="text-sm font-semibold">67,120</div>
          </div>
          <div className="rounded-lg border border-white/10 p-3 bg-black/20">
            <div className="text-[10px] uppercase tracking-wider text-white/60">High</div>
            <div className="text-sm font-semibold">68,050</div>
          </div>
          <div className="rounded-lg border border-white/10 p-3 bg-black/20">
            <div className="text-[10px] uppercase tracking-wider text-white/60">Low</div>
            <div className="text-sm font-semibold">66,880</div>
          </div>
        </div>
      </main>

      {/* Bottom navigation */}
      <nav
        className="sticky bottom-0 bg-black/90 backdrop-blur border-t border-white/10"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        <div className="max-w-md mx-auto px-6 py-3 grid grid-cols-4 gap-4">
          <button type="button" className="flex flex-col items-center gap-1">
            <span className="size-5 rounded-full border border-white/10 bg-white/5" />
            <span className="text-[11px]">Chart</span>
          </button>
          <button type="button" className="flex flex-col items-center gap-1">
            <span className="size-5 rounded-full border border-white/10" />
            <span className="text-[11px]">Order</span>
          </button>
          <button type="button" className="flex flex-col items-center gap-1">
            <span className="size-5 rounded-full border border-white/10" />
            <span className="text-[11px]">P/L</span>
          </button>
          <button type="button" className="flex flex-col items-center gap-1">
            <span className="size-5 rounded-full border border-white/10" />
            <span className="text-[11px]">More</span>
          </button>
        </div>
      </nav>
    </div>
  );
}
