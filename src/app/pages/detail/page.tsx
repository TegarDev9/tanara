import React from 'react';
import { PlusCircle, TrendingUp, ArrowRight, ScanLine } from 'lucide-react';

// Komponen untuk badge Win/Loss agar lebih rapi
const ResultBadge = ({ isProfit }: { isProfit: boolean }) => (
  <span className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-full ${
    isProfit 
      ? 'bg-white text-black' 
      : 'bg-transparent border border-gray-700 text-gray-400'
  }`}>
    {isProfit ? 'Win' : 'Loss'}
  </span>
);

const ModernJournalPage = () => {
  // Data histori trading yang lebih relevan dengan saham/kripto
  const tradingEntries = [
    {
      id: 1,
      date: '2024-06-10',
      pair: 'BBCA',
      position: 'Long',
      entryPrice: 9250,
      exitPrice: 9550,
      lotSize: 10, // dalam lot (1 lot = 100 lembar)
      trendAnalysis: 'Breakout dari resistance 9200 dengan volume tinggi, mengkonfirmasi tren bullish jangka menengah.',
      tradingEvaluation: 'Eksekusi baik berdasarkan sinyal breakout valid. TP tercapai sesuai rencana sebelum pullback.'
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
      tradingEvaluation: 'Keputusan spekulatif. Stop-loss dijalankan dengan disiplin. Pelajaran: jangan melawan tren tanpa sinyal jelas.'
    },
    {
      id: 3,
      date: '2024-06-15',
      pair: 'BTC/USDT',
      position: 'Long',
      entryPrice: 66100,
      exitPrice: 66450,
      lotSize: 0.1, // dalam unit BTC
      trendAnalysis: 'Scalping jangka pendek di time frame 15m berdasarkan bullish divergence pada RSI di area support.',
      tradingEvaluation: 'Trading scalp yang berhasil. Setup jelas dan eksekusi cepat. Risiko terkendali dengan baik.'
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
      tradingEvaluation: 'Setup valid, namun pasar kurang momentum. Cut-loss lebih awal saat harga gagal memantul adalah keputusan bijak.'
    },
  ];

  // Helper untuk memformat angka ke format mata uang
  const formatCurrency = (amount: number, pair: string) => {
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

  return (
    <div className="min-h-screen bg-black text-gray-300 font-sans p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <header className="mb-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gray-800 border border-gray-700 rounded-lg flex items-center justify-center">
                    <TrendingUp className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">Jurnal Trading</h1>
                  <p className="text-sm text-gray-500 mt-1">Analisis untuk keputusan yang lebih baik.</p>
                </div>
            </div>
            <div className="flex items-center gap-2">
                 <button title="Pindai Analisis" className="h-10 w-10 flex items-center justify-center bg-gray-800 text-gray-400 rounded-lg hover:bg-gray-700 hover:text-white transition-colors border border-gray-700">
                    <ScanLine size={20} />
                </button>
                <button className="hidden sm:flex items-center gap-2 h-10 px-4 bg-white text-black font-semibold rounded-lg hover:bg-gray-200 transition-colors">
                    <PlusCircle size={20} />
                    <span>Entri Baru</span>
                </button>
            </div>
          </div>
        </header>

        {/* Card Layout for Mobile */}
        <div className="md:hidden space-y-4">
          {tradingEntries.map((entry) => {
            const multiplier = entry.pair.toUpperCase().includes('USDT') ? 1 : 100;
            const profitLoss = (entry.exitPrice - entry.entryPrice) * entry.lotSize * multiplier;
            const isProfit = profitLoss >= 0;

            return (
              <div key={entry.id} className="bg-gray-900 rounded-xl p-5 border border-gray-800 shadow-xl">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <span className="font-bold text-lg text-white">{entry.pair}</span>
                    <p className="text-xs text-gray-500">{entry.date}</p>
                  </div>
                  <ResultBadge isProfit={isProfit} />
                </div>
                
                <div className="text-sm font-mono flex items-center justify-center text-center my-4 p-4 bg-black rounded-lg">
                  <span>{entry.entryPrice}</span>
                  <ArrowRight size={16} className="mx-4 text-gray-600"/>
                  <span>{entry.exitPrice}</span>
                </div>

                <div className="text-center mb-5">
                    <p className="text-xs text-gray-500 uppercase tracking-widest">Profit/Loss</p>
                    <p className={`text-2xl font-bold ${isProfit ? 'text-white' : 'text-gray-600'}`}>{formatCurrency(profitLoss, entry.pair)}</p>
                </div>

                <div className="text-xs text-gray-500 space-y-3">
                    <div>
                        <h4 className="font-semibold text-gray-300 mb-1">Analisis Tren</h4>
                        <p>{entry.trendAnalysis}</p>
                    </div>
                    <div>
                        <h4 className="font-semibold text-gray-300 mb-1">Evaluasi Trading</h4>
                        <p>{entry.tradingEvaluation}</p>
                    </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Table Layout for Desktop */}
        <div className="hidden md:block bg-gray-900 shadow-2xl rounded-xl overflow-hidden border border-gray-800">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-black/20 text-left">
                <tr>
                  <th className="p-4 font-semibold text-gray-500 uppercase tracking-wider">Pair/Saham</th>
                  <th className="p-4 font-semibold text-gray-500 uppercase tracking-wider">Hasil</th>
                  <th className="p-4 font-semibold text-gray-500 uppercase tracking-wider text-right">Profit/Loss</th>
                  <th className="p-4 font-semibold text-gray-500 uppercase tracking-wider">Analisis Tren & Setup</th>
                  <th className="p-4 font-semibold text-gray-500 uppercase tracking-wider">Evaluasi Trading</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {tradingEntries.map((entry) => {
                  const multiplier = entry.pair.toUpperCase().includes('USDT') ? 1 : 100;
                  const profitLoss = (entry.exitPrice - entry.entryPrice) * entry.lotSize * multiplier;
                  const isProfit = profitLoss >= 0;

                  return (
                    <tr key={entry.id} className="hover:bg-gray-800/50 transition-colors">
                      <td className="p-4 whitespace-nowrap">
                        <div className="font-bold text-white">{entry.pair}</div>
                        <div className="text-gray-500">{entry.date}</div>
                      </td>
                      <td className="p-4 whitespace-nowrap"><ResultBadge isProfit={isProfit} /></td>
                      <td className={`p-4 whitespace-nowrap text-right font-semibold ${isProfit ? 'text-white' : 'text-gray-500'}`}>
                        {formatCurrency(profitLoss, entry.pair)}
                      </td>
                      <td className="p-4 text-gray-500 max-w-sm">{entry.trendAnalysis}</td>
                      <td className="p-4 text-gray-500 max-w-sm">{entry.tradingEvaluation}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

         <div className="mt-6 flex justify-center sm:hidden">
            <button className="flex w-full justify-center items-center gap-2 px-4 py-3 bg-white text-black font-semibold rounded-lg hover:bg-gray-200 transition-colors shadow-lg">
              <PlusCircle size={20} />
              <span>Entri Baru</span>
            </button>
          </div>
      </div>
    </div>
  );
};

export default ModernJournalPage;
