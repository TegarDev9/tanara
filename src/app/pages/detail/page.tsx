import React from 'react';

const JournalDetailPage = () => {
  const journalEntries = [
    { 
      id: 1, 
      date: '2024-01-01', 
      description: 'Pembelian ATK', 
      amount: 150000, 
      type: 'Pengeluaran',
      trendAnalysis: 'Harga ATK stabil, keputusan pembelian rutin.',
      tradingEvaluation: 'Pembelian operasional, tidak ada evaluasi trading spesifik.'
    },
    { 
      id: 2, 
      date: '2024-01-05', 
      description: 'Penjualan Produk A', 
      amount: 500000, 
      type: 'Pemasukan',
      trendAnalysis: 'Permintaan Produk A meningkat setelah promosi awal tahun.',
      tradingEvaluation: 'Strategi promosi berhasil meningkatkan penjualan. Pertahankan momentum.'
    },
    { 
      id: 3, 
      date: '2024-01-10', 
      description: 'Gaji Karyawan', 
      amount: 2000000, 
      type: 'Pengeluaran',
      trendAnalysis: 'Pengeluaran gaji rutin, sesuai anggaran.',
      tradingEvaluation: 'Pengeluaran tetap, tidak relevan untuk evaluasi trading.'
    },
    { 
      id: 4, 
      date: '2024-01-15', 
      description: 'Pendapatan Jasa', 
      amount: 750000, 
      type: 'Pemasukan',
      trendAnalysis: 'Peningkatan permintaan jasa konsultasi di pertengahan bulan.',
      tradingEvaluation: 'Keputusan untuk fokus pada layanan konsultasi berbayar membuahkan hasil positif.'
    },
  ];

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <h1 className="text-3xl font-bold text-gray-800 mb-6 text-center">Detail Jurnal</h1>
      <div className="overflow-x-auto bg-white shadow-md rounded-lg">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                ID
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Tanggal
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Deskripsi
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Jumlah
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Tipe
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Analisis Tren
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Evaluasi Trading
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {journalEntries.map((entry) => (
              <tr key={entry.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {entry.id}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {entry.date}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {entry.description}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  Rp {entry.amount.toLocaleString('id-ID')}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    entry.type === 'Pemasukan' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {entry.type}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">
                  {entry.trendAnalysis}
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">
                  {entry.tradingEvaluation}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default JournalDetailPage;
