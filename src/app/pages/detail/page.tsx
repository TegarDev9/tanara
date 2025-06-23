import React from 'react';
import { PlusCircle, TrendingUp, ArrowRight } from 'lucide-react';

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
      trendAnalysis: 'Harga berhasil breakout dari resistance kuat di 9200 dengan volume tinggi. Tren jangka menengah sedang bullish, dikonfirmasi oleh MA50 yang berada di atas MA200.',
      tradingEvaluation: 'Eksekusi yang baik berdasarkan sinyal breakout yang valid. Target profit tercapai sesuai rencana. Keputusan untuk take profit di 9550 tepat sebelum harga mengalami sedikit pullback.'
    },
    {
      id: 2,
      date: '2024-06-12',
      pair: 'GOTO',
      position: 'Long',
      entryPrice: 54,
      exitPrice: 51,
      lotSize: 100,
      trendAnalysis: 'Mencoba menangkap potensi bottom reversal setelah harga turun tajam selama beberapa hari. Indikator RSI menunjukkan kondisi oversold.',
      tradingEvaluation: 'Keputusan yang terlalu spekulatif dan tidak sabar. Masuk pasar tanpa konfirmasi pembalikan arah yang jelas. Stop-loss dijalankan dengan disiplin, membatasi kerugian. Pelajaran: jangan melawan tren utama tanpa sinyal yang kuat.'
    },
    {
      id: 3,
      date: '2024-06-15',
      pair: 'BTC/USDT',
      position: 'Long',
      entryPrice: 66100,
      exitPrice: 66450,
      lotSize: 0.1, // dalam unit BTC
      trendAnalysis: 'Scalping jangka pendek di time frame 15 menit. Harga menunjukkan bullish divergence pada indikator RSI saat mendekati level support minor.',
      tradingEvaluation: 'Trading scalp yang berhasil. Setup jelas dan eksekusi cepat. Profit diambil sesuai target scalping. Risiko terkendali dengan baik.'
    },
    {
      id: 4,
      date: '2024-06-18',
      pair: 'TLKM',
      position: 'Long',
      entryPrice: 2800,
      exitPrice: 2790,
      lotSize: 20,
      trendAnalysis: 'Harga bergerak dalam fase konsolidasi (sideways). Posisi dibuka dekat area support dengan harapan harga akan memantul kembali ke resistance.',
      tradingEvaluation: 'Setup trading di area range yang valid, namun pasar tidak memiliki cukup momentum. Memutuskan untuk cut-loss lebih awal saat harga gagal menunjukkan kekuatan untuk memantul. Keputusan yang bijak untuk meminimalkan kerugian.'
    },
  ];

  // Helper untuk memformat angka ke format mata uang Rupiah
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
        <header className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
                <TrendingUp className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
                <div>
                  <h1 className="text-2xl sm:text-4xl font-bold text-white">Jurnal Trading Saya</h1>
                  <p className="text-sm sm:text-md text-gray-500 mt-1">Menganalisis setiap langkah untuk keputusan yang lebih baik.</p>
                </div>
            </div>
            <button className="hidden sm:flex items-center gap-2 px-4 py-2 bg-white text-black font-semibold rounded-lg hover:bg-gray-200 transition-colors shadow-lg">
              <PlusCircle size={20} />
              <span>Entri Baru</span>
            </button>
          </div>
        </header>

        {/* Card Layout for Mobile */}
        <div className="md:hidden space-y-4">
          {tradingEntries.map((entry) => {
            const multiplier = entry.pair.toUpperCase().includes('USDT') ? 1 : 100;
            const profitLoss = (entry.exitPrice - entry.entryPrice) * entry.lotSize * multiplier;
            const isProfit = profitLoss >= 0;

            return (
              <div key={entry.id} className="bg-gray-900 rounded-xl p-4 border border-gray-800 shadow-lg">
                <div className="flex justify-between items-center mb-4">
                  <span className="font-bold text-lg text-white">{entry.pair}</span>
                  <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
                    isProfit ? 'bg-white text-black' : 'border border-gray-600 text-gray-400'
                  }`}>{isProfit ? 'Win' : 'Loss'}</span>
                </div>
                <div className="text-sm space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Tanggal:</span>
                    <span className="font-medium text-gray-200">{entry.date}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500">Harga:</span>
                    <div className="flex items-center gap-2 font-medium">
                      <span>{entry.entryPrice}</span>
                      <ArrowRight size={16} className="text-gray-600"/>
                      <span>{entry.exitPrice}</span>
                    </div>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Profit/Loss:</span>
                    <span className={`font-bold ${isProfit ? 'text-white' : 'text-gray-500'}`}>{formatCurrency(profitLoss, entry.pair)}</span>
                  </div>
                </div>
                <div className="mt-4 pt-3 border-t border-gray-800">
                    <h4 className="font-semibold text-white mb-1">Analisis Tren</h4>
                    <p className="text-xs text-gray-500">{entry.trendAnalysis}</p>
                </div>
                <div className="mt-3">
                    <h4 className="font-semibold text-white mb-1">Evaluasi Trading</h4>
                    <p className="text-xs text-gray-500">{entry.tradingEvaluation}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Table Layout for Desktop */}
        <div className="hidden md:block bg-gray-900 shadow-2xl rounded-xl overflow-hidden border border-gray-800">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-black/50 text-left">
                <tr>
                  <th className="p-4 font-semibold text-gray-500 uppercase tracking-wider">Tanggal</th>
                  <th className="p-4 font-semibold text-gray-500 uppercase tracking-wider">Pair/Saham</th>
                  <th className="p-4 font-semibold text-gray-500 uppercase tracking-wider">Posisi</th>
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
                    <tr key={entry.id} className="hover:bg-gray-800/60 transition-colors">
                      <td className="p-4 whitespace-nowrap text-gray-400">{entry.date}</td>
                      <td className="p-4 whitespace-nowrap font-bold text-white">{entry.pair}</td>
                      <td className="p-4 whitespace-nowrap">
                        <span className="px-3 py-1 text-xs font-semibold rounded-full bg-gray-700 text-gray-300">
                          {entry.position}
                        </span>
                      </td>
                      <td className="p-4 whitespace-nowrap">
                         <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
                          isProfit ? 'bg-white text-black' : 'border border-gray-600 text-gray-400'
                        }`}>
                          {isProfit ? 'Win' : 'Loss'}
                        </span>
                      </td>
                      <td className={`p-4 whitespace-nowrap text-right font-semibold ${isProfit ? 'text-white' : 'text-gray-500'}`}>
                        {formatCurrency(profitLoss, entry.pair)}
                      </td>
                      <td className="p-4 text-gray-500 max-w-xs">{entry.trendAnalysis}</td>
                      <td className="p-4 text-gray-500 max-w-xs">{entry.tradingEvaluation}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

         <div className="mt-8 flex justify-center sm:hidden">
            <button className="flex w-full justify-center items-center gap-2 px-4 py-3 bg-white text-black font-semibold rounded-lg hover:bg-gray-200 transition-colors shadow-lg">
              <PlusCircle size={20} />
              <span>Tambah Entri Baru</span>
            </button>
          </div>
      </div>
    </div>
  );
};

export default ModernJournalPage;
