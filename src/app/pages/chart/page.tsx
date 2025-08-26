'use client';

import React, { useState } from 'react';
import DynamicChart from '../../../components/DynamicChart';

export default function ChartPage() {
  const [symbol, setSymbol] = useState('BINANCE:BTCUSDT');
  const [timeframe, setTimeframe] = useState('1D');

  return (
    <div className="flex flex-col h-screen bg-black text-white">
      <header className="p-4 text-lg font-semibold text-center sticky top-0 z-20 shadow-md bg-neutral-950 border-b border-neutral-800">
        Trading Chart
      </header>

      <div className="p-4 flex gap-6 bg-neutral-900 border-b border-neutral-800">
        {/* Symbol selector */}
        <div>
          <label htmlFor="symbol" className="block text-sm mb-1 text-neutral-400">
            Symbol
          </label>
          <select
            id="symbol"
            value={symbol}
            onChange={(e) => setSymbol(e.target.value)}
            className="bg-neutral-800 border border-neutral-700 rounded-md px-3 py-2 focus:ring-2 focus:ring-white/30 focus:outline-none"
          >
            <option value="BINANCE:BTCUSDT">BTC/USDT</option>
            <option value="BINANCE:ETHUSDT">ETH/USDT</option>
            <option value="NASDAQ:AAPL">Apple (AAPL)</option>
            <option value="NASDAQ:GOOGL">Google (GOOGL)</option>
            <option value="TVC:GOLD">Gold</option>
          </select>
        </div>

        {/* Timeframe selector */}
        <div>
          <label htmlFor="timeframe" className="block text-sm mb-1 text-neutral-400">
            Timeframe
          </label>
          <select
            id="timeframe"
            value={timeframe}
            onChange={(e) => setTimeframe(e.target.value)}
            className="bg-neutral-800 border border-neutral-700 rounded-md px-3 py-2 focus:ring-2 focus:ring-white/30 focus:outline-none"
          >
            <option value="1m">1 Minute</option>
            <option value="5m">5 Minutes</option>
            <option value="15m">15 Minutes</option>
            <option value="1H">1 Hour</option>
            <option value="4H">4 Hours</option>
            <option value="1D">1 Day</option>
            <option value="1W">1 Week</option>
          </select>
        </div>
      </div>

      <main className="flex-grow p-4">
        <div className="h-full w-full rounded-lg border border-neutral-800 overflow-hidden shadow-lg">
          <DynamicChart symbol={symbol} timeframe={timeframe} />
        </div>
      </main>
    </div>
  );
}
