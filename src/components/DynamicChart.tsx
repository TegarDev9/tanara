'use client';

import React, { Suspense, lazy } from 'react';

// Tipe props disederhanakan
interface ChartProps {
  symbol: string;
  timeframe: string;
}

// Menggunakan React.lazy untuk dynamic import.
// Path './Chart' mengasumsikan file ini berada di folder yang sama dengan Chart.tsx
const Chart = lazy(() => 
  import('./Chart').then(module => ({ default: module.TradingChart }))
);

const DynamicChart: React.FC<ChartProps> = ({ symbol, timeframe }) => {
  return (
    // Suspense diperlukan untuk menampilkan fallback UI saat komponen lazy sedang dimuat.
    <Suspense fallback={<div className="flex items-center justify-center h-full">Memuat Chart...</div>}>
      <Chart symbol={symbol} timeframe={timeframe} />
    </Suspense>
  );
};

export default DynamicChart;
