// components/DynamicChart.tsx
'use client';

import React, { Suspense, lazy } from 'react';

interface ChartProps {
  symbol: string;
  timeframe: string;
}

// Lazy-load named export TradingChart to keep the bundle lean.
const Chart = lazy(async () => import('./Chart').then((m) => ({ default: m.TradingChart })));

export default function DynamicChart({ symbol, timeframe }: ChartProps): JSX.Element {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center h-full text-white/70 text-sm">
          Memuat Chart...
        </div>
      }
    >
      <Chart symbol={symbol} timeframe={timeframe} />
    </Suspense>
  );
}
