// src/app/pages/detail/page.tsx

import React from 'react';
import { PlusCircle, TrendingUp, ArrowRight, ScanLine } from 'lucide-react';

// Types
interface TradingEntry {
  id: number;
  date: string;
  pair: string;
  position: 'Long' | 'Short';
  entryPrice: number;
  exitPrice: number;
  lotSize: number;
  trendAnalysis: string;
  tradingEvaluation: string;
}

interface TradingSummary {
  totalPL: number;
  winRate: number;
  totalTrades: number;
}

interface ResultBadgeProps {
  isProfit: boolean;
}

interface TradingCardProps {
  entry: TradingEntry;
}

interface TradingTableProps {
  entries: TradingEntry[];
}

// Utils
const formatCurrency = (amount: number, pair: string): string => {
  const options: Intl.NumberFormatOptions = {
    style: 'currency',
    minimumFractionDigits: 0,
  };
  if (pair.toUpperCase().includes('USDT')) {
    options.currency = 'USD';
    options.minimumFractionDigits = 2;
    options.maximumFractionDigits = 2;
    return new Intl.NumberFormat('en-US', options).format(amount);
  }
  options.currency = 'IDR';
  return new Intl.NumberFormat('id-ID', options).format(amount);
};

const calculateProfitLoss = (entry: TradingEntry): number => {
  const multiplier = entry.pair.toUpperCase().includes('USDT') ? 1 : 100;
  return (entry.exitPrice - entry.entryPrice) * entry.lotSize * multiplier;
};

const calculateTradingSummary = (entries: TradingEntry[]): TradingSummary => {
  let wins = 0;
  let totalPL = 0;
  entries.forEach(entry => {
    const pl = calculateProfitLoss(entry);
    if (pl >= 0) wins++;
    totalPL += pl;
  });
  return {
    totalPL,
    winRate: Math.round((wins / entries.length) * 100),
    totalTrades: entries.length,
  };
};

// Components
const ResultBadge: React.FC<ResultBadgeProps> = ({ isProfit }) => (
  <span
    className={`inline-flex items-center gap-1.5 px-4 py-1 text-xs font-bold uppercase rounded-full border transition ${
      isProfit
        ? 'bg-white text-black border-white'
        : 'bg-transparent text-[#c7c7c7] border-white'
    }`}>
    {isProfit ? 'Win' : 'Loss'}
  </span>
);

const TradingCard: React.FC<TradingCardProps> = ({ entry }) => {
  const profitLoss = calculateProfitLoss(entry);
  const isProfit = profitLoss >= 0;
  return (
    <div className="bg-[#181818] border border-white/20 rounded-2xl p-6 shadow-2xl hover:scale-[1.01] transition">
      <div className="flex justify-between items-start mb-4">
        <div>
          <span className="font-black text-2xl text-white">{entry.pair}</span>
          <p className="text-xs text-[#b2b2b2]">{entry.date}</p>
        </div>
        <ResultBadge isProfit={isProfit} />
      </div>

      <div className="text-sm font-mono flex items-center justify-center text-center my-4 p-4 bg-[#111111] rounded-lg">
        <span>{entry.entryPrice}</span>
        <ArrowRight size={18} className="mx-4 text-white/60" />
        <span>{entry.exitPrice}</span>
      </div>
      <div className="text-center mb-5">
        <p className="text-xs text-[#b4b4b4] uppercase tracking-widest">Profit/Loss</p>
        <p className={`text-2xl font-black ${isProfit ? 'text-white' : 'text-[#bdbdbd]'}`}>
          {formatCurrency(profitLoss, entry.pair)}
        </p>
      </div>
      <div className="text-xs text-[#bbbbbb] space-y-3">
        <div>
          <h4 className="font-semibold text-[#ededed] mb-1">Analisis Tren</h4>
          <p>{entry.trendAnalysis}</p>
        </div>
        <div>
          <h4 className="font-semibold text-[#ededed] mb-1">Evaluasi Trading</h4>
          <p>{entry.tradingEvaluation}</p>
        </div>
      </div>
    </div>
  );
};

const TradingTable: React.FC<TradingTableProps> = ({ entries }) => (
  <div className="hidden md:block bg-[#181818] rounded-2xl overflow-hidden border border-white/20 shadow-2xl">
    <div className="overflow-x-auto">
      <table className="min-w-full text-sm">
        <thead className="bg-[#111111] text-left">
          <tr>
            <th className="p-5 font-bold tracking-widest text-[#d7d7d7] uppercase bg-transparent border-b border-white/10">Pair/Saham</th>
            <th className="p-5 font-bold tracking-widest text-[#d7d7d7] uppercase bg-transparent border-b border-white/10">Hasil</th>
            <th className="p-5 font-bold tracking-widest text-[#d7d7d7] uppercase bg-transparent border-b border-white/10 text-right">Profit/Loss</th>
            <th className="p-5 font-bold tracking-widest text-[#d7d7d7] uppercase bg-transparent border-b border-white/10">Analisis Tren & Setup</th>
            <th className="p-5 font-bold tracking-widest text-[#d7d7d7] uppercase bg-transparent border-b border-white/10">Evaluasi Trading</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/10">
          {entries.map(entry => {
            const pl = calculateProfitLoss(entry);
            const isProfit = pl >= 0;
            return (
              <tr key={entry.id} className="hover:bg-white/5 transition">
                <td className="p-5 whitespace-nowrap">
                  <div className="font-black text-white">{entry.pair}</div>
                  <div className="text-[#b2b2b2]">{entry.date}</div>
                </td>
                <td className="p-5 whitespace-nowrap">
                  <ResultBadge isProfit={isProfit} />
                </td>
                <td className={`p-5 whitespace-nowrap text-right font-bold ${isProfit ? 'text-white' : 'text-[#bdbdbd]'}`}>
                  {formatCurrency(pl, entry.pair)}
                </td>
                <td className="p-5 text-[#bbbbbb] max-w-sm">{entry.trendAnalysis}</td>
                <td className="p-5 text-[#bbbbbb] max-w-sm">{entry.tradingEvaluation}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  </div>
);

const SummaryStats: React.FC<{ entries: TradingEntry[] }> = ({ entries }) => {
  const summary = calculateTradingSummary(entries);
  return (
    <div className="mb-8 grid grid-cols-1 sm:grid-cols-3 gap-5">
      <div className="bg-[#1b1b1b] rounded-xl px-6 py-5 border border-[#242424] shadow-inner">
        <h3 className="text-xs font-bold text-[#d5d5d5] uppercase tracking-wider mb-2">Total P/L</h3>
        <p className={`text-2xl font-black tracking-tight ${summary.totalPL >= 0 ? 'text-white' : 'text-[#cccccc]'}`}>
          {formatCurrency(summary.totalPL, 'IDR')}
        </p>
      </div>
      <div className="bg-[#1b1b1b] rounded-xl px-6 py-5 border border-[#242424] shadow-inner">
        <h3 className="text-xs font-bold text-[#d5d5d5] uppercase tracking-wider mb-2">Win Rate</h3>
        <p className="text-2xl font-black tracking-tight text-white">{summary.winRate}%</p>
      </div>
      <div className="bg-[#1b1b1b] rounded-xl px-6 py-5 border border-[#242424] shadow-inner">
        <h3 className="text-xs font-bold text-[#d5d5d5] uppercase tracking-wider mb-2">Total Trades</h3>
        <p className="text-2xl font-black tracking-tight text-white">{summary.totalTrades}</p>
      </div>
    </div>
  );
};

// Main Page Component
const ModernJournalPage: React.FC = () => {
  const tradingEntries: TradingEntry[] = [
    {
      id: 1,
      date: '2024-06-10',
      pair: 'BBCA',
      position: 'Long',
      entryPrice: 9250,
      exitPrice: 9550,
      lotSize: 10,
      trendAnalysis: 'Breakout dari resistance 9200 dengan volume tinggi, mengkonfirmasi tren bullish jangka menengah.',
      tradingEvaluation: 'Eksekusi baik berdasarkan sinyal breakout valid. TP tercapai sesuai rencana sebelum pullback.',
    },
    {
      id: 2,
      date: '2024-06-12',
      pair: 'GOTO',
      position: 'Long',
      entryPrice: 54,
      exitPrice: 51,
      lotSize: 100,
      trendAnalysis: 'Mencoba menangkap bottom reversal pada kondisi oversold tanpa konfirmasi yang kuat.',
      tradingEvaluation: 'Keputusan spekulatif. Stop-loss dijalankan dengan disiplin. Pelajaran: jangan melawan tren tanpa sinyal jelas.',
    },
    {
      id: 3,
      date: '2024-06-15',
      pair: 'BTC/USDT',
      position: 'Long',
      entryPrice: 66100,
      exitPrice: 66450,
      lotSize: 0.1,
      trendAnalysis: 'Scalping jangka pendek di time frame 15m berdasarkan bullish divergence pada RSI di area support.',
      tradingEvaluation: 'Trading scalp yang berhasil. Setup jelas dan eksekusi cepat. Risiko terkendali dengan baik.',
    },
    {
      id: 4,
      date: '2024-06-18',
      pair: 'TLKM',
      position: 'Long',
      entryPrice: 2800,
      exitPrice: 2790,
      lotSize: 20,
      trendAnalysis: 'Membuka posisi di area support dalam fase konsolidasi (sideways).',
      tradingEvaluation: 'Setup valid, namun pasar kurang momentum. Cut-loss lebih awal saat harga gagal memantul adalah keputusan bijak.',
    },
  ];

  return (
    <div className="min-h-screen bg-[#181818] text-[#f7f7f7] font-sans p-4 sm:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <header className="mb-12 flex items-center justify-between">
          <div className="flex items-center gap-5">
            <div className="w-14 h-14 bg-[#262626] border border-[#5a5a5a] rounded-xl grid place-items-center shadow-inner">
              <TrendingUp className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">Jurnal Trading</h1>
              <p className="text-base text-[#d5d5d5] font-mono mt-1">Analisis untuk keputusan yang lebih baik.</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              title="Pindai Analisis"
              className="h-12 w-12 grid place-items-center rounded-xl bg-transparent border border-[#393939] text-[#d0d0d0] hover:border-white hover:text-white transition duration-200"
            >
              <ScanLine size={23} />
            </button>
            <button className="hidden sm:flex items-center gap-2 h-12 px-6 rounded-xl bg-white text-black font-extrabold shadow hover:bg-[#ececec] transition">
              <PlusCircle size={24} />
              <span>Entri Baru</span>
            </button>
          </div>
        </header>

        {/* Summary Dashboard */}
        <SummaryStats entries={tradingEntries} />

        {/* Mobile Cards */}
        <div className="md:hidden space-y-5">
          {tradingEntries.map(entry => (
            <TradingCard key={entry.id} entry={entry} />
          ))}
        </div>

        {/* Desktop Table */}
        <TradingTable entries={tradingEntries} />

        {/* Mobile Add Button */}
        <div className="mt-8 flex justify-center sm:hidden">
          <button className="flex w-full justify-center items-center gap-2 px-6 py-4 bg-white text-black font-extrabold rounded-xl hover:bg-[#ececec] transition shadow-xl">
            <PlusCircle size={22} />
            <span>Entri Baru</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ModernJournalPage;
