'use client';

import React, { SVGProps, useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';

// --- Modern Icon Components ---
const BellIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>
);
const InfoIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a10 10 0 0 0-6.32 17.9A10 10 0 0 0 12 22a10 10 0 0 0 6.32-2.1A10 10 0 0 0 12 2Z"/></svg>
);
const LeafIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22c4 0 8-3.58 8-8 0-4.42-3.58-8-8-8s-8 3.58-8 8c0 4.42 3.58 8 8 8z"/><path d="M12 15V6"/><path d="M12 9c-1.5 0-3 1.5-3 3s1.5 3 3 3 3-1.5 3-3-1.5-3-3-3z"/></svg>
);
const OriginalGiftIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"><path d="M21 11.25v8.25a1.5 1.5 0 0 1-1.5 1.5H5.25a1.5 1.5 0 0 1-1.5-1.5v-8.25M12 4.875A3.375 3.375 0 0 0 8.625 8.25H15.375A3.375 3.375 0 0 0 12 4.875Z"/><path d="M12 4.875v16.5M8.25 12h7.5"/></svg>
);
const SearchIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" /></svg>
);
const UserCircle2Icon = (props: SVGProps<SVGSVGElement>) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="10" r="3"/><path d="M12 2a10 10 0 0 0-6.32 17.9A10 10 0 0 0 12 22a10 10 0 0 0 6.32-2.1A10 10 0 0 0 12 2Z"/></svg>
);
const IconEducation = (props: SVGProps<SVGSVGElement>) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M12 14l9-5-9-5-9 5 9 5z" /><path d="M12 14l6.16-3.422A12.083 12.083 0 0118 20.5c0 .827-.67 1.5-1.5 1.5h-9A1.5 1.5 0 016 20.5c0-4.72-.64-8.108-.16-9.922L12 14z" /></svg>
);

// Currency formatter (IDR)
const currencyFormatter = new Intl.NumberFormat('id-ID', {
  style: 'currency',
  currency: 'IDR',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

// Bar Chart
interface SimpleBarChartProps {
  data: { label: string; value: number; color?: string }[];
  height?: string;
}
const SimpleBarChart = ({ data, height = "h-40" }: SimpleBarChartProps) => {
  const maxValue = Math.max(...data.map(d => d.value), 0);
  return (
    <div className={`flex items-end justify-around gap-3 w-full ${height}`}>
      {data.map((item, idx) => {
        const barHeight = maxValue > 0 ? (item.value / maxValue) * 90 : 0;
        const barColor = item.color || "bg-white";
        return (
          <div key={idx} className="flex-1 flex flex-col items-center justify-end h-full group relative">
            {/* Tooltip */}
            <div className="absolute -top-7 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition bg-black text-white text-xs px-2 py-1 rounded shadow-lg z-10">
              {item.label}: {item.value}
            </div>
            {/* Bar */}
            <div className={`w-3/4 rounded-t transition group-hover:opacity-80 ${barColor}`}
              style={{ height: `${barHeight}%` }}
            />
            <div className="mt-2 text-xs text-center truncate w-full text-gray-500">
              {item.label}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default function ModernBWApp() {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [userData, _setUserData] = useState({
    name: 'Tegar',
    profileType: 'Trading Pemula',
    avatarUrl: 'https://placehold.co/100x100/000/fff?text=BW',
    totalInvestment: 147000000,
    investmentChange: 7000000,
    investmentChangePercent: 5,
    notificationsCount: 2
  });

  const newMenuItems = [
    { name: 'education', icon: IconEducation, href: '/pages/education' },
    { name: 'sentiment', icon: LeafIcon, href: '/pages/detail' },
    { name: 'backtesting', icon: OriginalGiftIcon, href: '/pages/hedgefund' },
  ];
  const [marketTrendData, setMarketTrendData] = useState([
    { label: 'Jan', value: 65, color: "bg-white" },
    { label: 'Feb', value: 59, color: "bg-gray-300" },
    { label: 'Mar', value: 80, color: "bg-white" },
    { label: 'Apr', value: 81, color: "bg-gray-100" },
    { label: 'Mei', value: 56, color: "bg-gray-400" },
    { label: 'Jun', value: 70, color: "bg-white" },
    { label: 'Jul', value: 40, color: "bg-gray-500" },
  ]);
  useEffect(() => {
    const interval = setInterval(() => {
      setMarketTrendData(prev =>
        prev.map(item => ({
          ...item,
          value: Math.max(10, Math.min(100, item.value + Math.floor(Math.random() * 21) - 10)),
        }))
      );
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-black text-white font-sans">
      {/* Header */}
      <header className="relative pt-6 pb-20 px-4 border-b border-gray-800 bg-black">
        <div className="max-w-xl mx-auto relative z-10">
          <div className="flex justify-between items-center mb-8">
            <div className="flex items-center gap-3">
              {userData.avatarUrl ? (
                <Image
                  src={userData.avatarUrl}
                  alt={userData.name}
                  width={48} height={48}
                  className="w-12 h-12 rounded-full border-2 border-white"
                />
              ) : <UserCircle2Icon className="text-white/80" />}
              <div>
                <h1 className="text-lg font-semibold leading-tight text-white">Hi, {userData.name}</h1>
                <p className="text-xs text-gray-400">{userData.profileType}</p>
              </div>
            </div>
            <div>
              <button className="relative p-2 rounded-full hover:bg-white/10 transition text-white">
                <BellIcon />
                {userData.notificationsCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 text-[10px] rounded-full bg-white text-black font-bold flex items-center justify-center">{userData.notificationsCount}</span>
                )}
              </button>
            </div>
          </div>
          <div className="mt-6">
            <div className="flex items-center gap-2 mb-1">
              <p className="text-sm text-gray-400">Total Trading</p>
              <div className="relative group">
                <InfoIcon className="text-gray-400" />
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded shadow-lg opacity-0 group-hover:opacity-100 transition">
                  Informasi Total Trading Jurnal anda
                </div>
              </div>
            </div>
            <p className="text-3xl font-bold text-white">{currencyFormatter.format(userData.totalInvestment)}</p>
            <p className={`text-sm font-medium ${userData.investmentChange >= 0 ? "text-green-400" : "text-red-400"}`}>
              {userData.investmentChange >= 0 ? "+" : ""}
              {currencyFormatter.format(userData.investmentChange)}
              {" "}
              ({userData.investmentChange >= 0 ? "+" : ""}{userData.investmentChangePercent}%)
            </p>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="flex-grow -mt-12 pb-8 px-3 relative z-20">
        <div className="max-w-xl mx-auto p-4 rounded-2xl shadow-xl flex flex-col gap-8 bg-black/95 border border-gray-900">
          {/* Search Bar */}
          <div className="relative mb-2">
            <input
              type="search"
              placeholder="Cari inspirasi investasi... (mis: IHSG, Saham BBCA)"
              className="w-full p-4 pl-12 bg-black text-white border border-gray-800 rounded-lg placeholder-gray-500 focus:ring-2 focus:ring-white outline-none transition"
            />
            <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
          </div>
          {/* Menu */}
          <section>
            <div className="grid grid-cols-3 gap-3 text-center">
              {newMenuItems.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className="flex flex-col items-center justify-center p-3 bg-black rounded-lg border border-white/10 hover:bg-white/10 transition group"
                >
                  <item.icon className="mb-2 text-white group-hover:scale-110 transition-transform" />
                  <span className="text-xs font-medium text-gray-400 group-hover:text-white capitalize">{item.name}</span>
                </Link>
              ))}
            </div>
          </section>

          {/* Trend Chart */}
          <section className="p-4 bg-black border border-gray-800 rounded-lg">
            <div className="flex justify-between items-center mb-3">
              <h2 className="text-lg font-semibold text-white">Tren Pasar Minggu Ini</h2>
              <button className="text-sm text-white/80 hover:underline">Lihat Detail</button>
            </div>
            <SimpleBarChart data={marketTrendData} height="h-32" />
          </section>

          {/* News — Black & White Card */}
          <section>
            <div className="flex justify-between items-center mb-3">
              <h2 className="text-lg font-semibold text-white">Berita Terbaru</h2>
              <button className="text-sm text-white/80 hover:underline">Lihat Semua</button>
            </div>
            <div className="flex flex-col gap-4">
              {[1, 2, 3].map(item => (
                <div key={item} className="bg-white/5 p-4 rounded-lg shadow hover:shadow-lg flex items-start gap-4">
                  <div className="w-20 h-16 bg-gray-900 rounded"></div>
                  <div className="flex-grow">
                    <h3 className="text-md font-semibold text-white mb-1 line-clamp-2">
                      Judul Berita Panjang yang Mungkin Membutuhkan Dua Baris atau Lebih
                    </h3>
                    <p className="text-sm text-gray-400 line-clamp-2 mb-1">
                      Ini adalah deskripsi singkat dari berita. Konten ini akan menjelaskan poin utama secara ringkas.
                    </p>
                    <div className="text-xs text-gray-500">
                      <span>Sumber Berita</span> | <span>2 jam yang lalu</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
