'use client';

import React, { SVGProps, useState, useEffect } from 'react';
import Image from 'next/image';

// --- Definisi Warna Baru (REMOVED - using Tailwind theme) ---
// const newColors = { ... };

// --- Komponen Ikon (warna akan disesuaikan dengan Tailwind classes atau props) ---
const BellIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>
);

// ShoppingCartIcon REMOVED
// SlidersHorizontalIcon REMOVED

const InfoIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M12 2a10 10 0 0 0-6.32 17.9A10 10 0 0 0 12 22a10 10 0 0 0 6.32-2.1A10 10 0 0 0 12 2Z"/></svg>
);

const BotIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M12 8V4H8V2h8v2h-4v4"/><rect width="16" height="12" x="4" y="10" rx="2"/><path d="M9 18h6"/><path d="M12 14v4"/></svg>
);

const LeafIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M12 22c4 0 8-3.58 8-8 0-4.42-3.58-8-8-8s-8 3.58-8 8c0 4.42 3.58 8 8 8z"/><path d="M12 15V6"/><path d="M12 9c-1.5 0-3 1.5-3 3s1.5 3 3 3 3-1.5 3-3-1.5-3-3-3z"/></svg>
);

const OriginalGiftIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M21 11.25v8.25a1.5 1.5 0 0 1-1.5 1.5H5.25a1.5 1.5 0 0 1-1.5-1.5v-8.25M12 4.875A3.375 3.375 0 0 0 8.625 8.25H15.375A3.375 3.375 0 0 0 12 4.875Z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.875v16.5M8.25 12h7.5" />
  </svg>
);

const SearchIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
  </svg>
);

const UserCircle2Icon = (props: SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><circle cx="12" cy="10" r="3"/><path d="M12 2a10 10 0 0 0-6.32 17.9A10 10 0 0 0 12 22a10 10 0 0 0 6.32-2.1A10 10 0 0 0 12 2Z"/></svg>
);

// ChatBubbleOvalLeftEllipsisIcon REMOVED
// ShareIcon REMOVED
// LightBulbIcon REMOVED

// Currency Formatter
const currencyFormatter = new Intl.NumberFormat('id-ID', {
  style: 'currency',
  currency: 'IDR',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

// Simplified Bar Chart Component
interface SimpleBarChartProps {
  data: { label: string; value: number; color?: string }[];
  barColor?: string; // Default bar color (Tailwind class)
  height?: string;
}

const SimpleBarChart = ({ data, barColor = "bg-primary", height = "h-[200px]" }: SimpleBarChartProps) => {
  const maxValue = Math.max(...data.map(d => d.value), 0);

  return (
    <div className={`w-full ${height} p-3 flex items-end justify-around space-x-2`}>
      {data.map((item, index) => {
        const barHeightPercentage = maxValue > 0 ? (item.value / maxValue) * 90 : 0; 
        // If item.color is a Tailwind class, use it directly. Otherwise, use default barColor.
        const itemBarClass = item.color && item.color.startsWith('bg-') ? item.color : barColor;
        return (
          <div key={index} className="flex-1 flex flex-col items-center h-full justify-end group relative">
            <div
              className="absolute -top-7 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-300
                         bg-neutral-700 text-white text-xs px-2 py-1 rounded-md shadow-lg whitespace-nowrap z-10">
              {item.label}: {item.value}
            </div>
            <div
              className={`w-3/4 sm:w-2/3 rounded-t-md transition-all duration-300 ease-out group-hover:opacity-80 ${itemBarClass}`}
              style={{ height: `${barHeightPercentage}%` }}
            />
            <div
              className="mt-1.5 text-[10px] sm:text-xs text-center truncate w-full px-0.5 text-muted-foreground"
            >
              {item.label}
            </div>
          </div>
        );
      })}
    </div>
  );
};


export default function ModernGreenApp() {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [userData, _setUserData] = useState({
    name: "Tegar",
    profileType: "Trading Pemula",
    avatarUrl: "https://placehold.co/100x100/1E1E1E/E0E0E0?text=BV", // Updated placeholder for dark theme
    totalInvestment: 147000000,
    investmentChange: 7000000,
    investmentChangePercent: 5,
    notificationsCount: 2,
    cartItemsCount: 1, 
  });

  const newMenuItems = [
    { name: "education", icon: BotIcon, action: () => console.log("Education") },
    { name: "jurnal", icon: LeafIcon, action: () => console.log("jurnal") },
    { name: "Airdrop", icon: OriginalGiftIcon, action: () => console.log("Airdrop") },
  ];

  const [marketTrendData, setMarketTrendData] = useState([
    { label: "Jan", value: 65, color: "bg-primary/70" }, { label: "Feb", value: 59, color: "bg-primary/60" },
    { label: "Mar", value: 80, color: "bg-primary" }, { label: "Apr", value: 81, color: "bg-primary/90" },
    { label: "Mei", value: 56, color: "bg-primary/50" }, { label: "Jun", value: 70, color: "bg-primary/80" },
    { label: "Jul", value: 40, color: "bg-primary/40" },
  ]);

  useEffect(() => {
    const interval = setInterval(() => {
      setMarketTrendData(prevData =>
        prevData.map(item => ({
          ...item,
          value: Math.max(10, Math.min(100, item.value + Math.floor(Math.random() * 21) - 10))
        }))
      );
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  // --- analysisFeatures Array (REMOVED) ---
  // const analysisFeatures = [
  //   {
  //     title: "Analisis Sentimen Pasar",
  //     description: "Dapatkan wawasan dari berita dan sumber finansial untuk memahami sentimen pasar secara *real-time*.",
  //     icon: ChatBubbleOvalLeftEllipsisIcon,
  //     buttonText: "Lihat Analisis",
  //     action: () => console.log("Lihat Analisis Sentimen Pasar"),
  //   },
  //   {
  //     title: "Sentimen Media Sosial",
  //     description: "Pantau tren dan diskusi di media sosial untuk mengukur sentimen publik terhadap aset tertentu.",
  //     icon: ShareIcon,
  //     buttonText: "Jelajahi Sentimen",
  //     action: () => console.log("Jelajahi Sentimen Media Sosial"),
  //   },
  //   {
  //     title: "Notifikasi Cerdas",
  //     description: "Atur notifikasi khusus untuk pergerakan harga signifikan atau berita penting aset pilihan Anda.",
  //     icon: LightBulbIcon,
  //     buttonText: "Atur Notifikasi",
  //     action: () => console.log("Atur Notifikasi Cerdas"),
  //     buttonStyle: "secondary", 
  //   },
  // ];


  return (
    // Use Tailwind classes for background and font. Font is already global via layout.tsx
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      {/* Header Section - Using a dark card-like color for the header background for contrast */}
      <header 
        className="relative text-primary-foreground pt-6 pb-24 sm:pb-28 px-4 sm:px-6 bg-card border-b border-border"
      >
        {/* Optional: Subtle decorative elements if needed, using theme colors */}
        {/* <div
          className="absolute inset-0 opacity-5"
          style={{
            backgroundImage: `
              radial-gradient(circle at 15% 25%, var(--color-border) 0%, transparent 50%),
              radial-gradient(circle at 85% 35%, var(--color-border) 0%, transparent 60%)
            `,
          }}
        /> */}
        <div className="container mx-auto relative z-10 max-w-4xl">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center space-x-3">
              {userData.avatarUrl ? (
                <Image src={userData.avatarUrl} alt={userData.name} width={48} height={48} className="w-10 h-10 sm:w-12 sm:h-12 rounded-full border-2 border-primary" />
              ) : (
                <UserCircle2Icon className="w-10 h-10 sm:w-12 sm:h-12 text-primary/80" />
              )}
              <div>
                <h1 className="text-lg sm:text-xl font-semibold leading-tight text-foreground">Hi, {userData.name}</h1>
                <p className="text-xs sm:text-sm text-muted-foreground">{userData.profileType}</p>
              </div>
            </div>
            <div className="flex items-center space-x-3 sm:space-x-4">
              <button className="relative p-1.5 rounded-full hover:bg-neutral-700/60 transition-colors text-foreground">
                <BellIcon className="w-5 h-5 sm:w-6 sm:h-6"/>
                {userData.notificationsCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 text-[10px] flex items-center justify-center rounded-full bg-red-500 text-white font-bold">
                    {userData.notificationsCount}
                  </span>
                )}
              </button>
            </div>
          </div>
          <div className="mt-6 sm:mt-8">
            <div className="flex items-center space-x-1.5 mb-1">
              <p className="text-sm sm:text-base text-muted-foreground">Total Trading</p>
              <div className="relative group">
                <InfoIcon className="w-4 h-4 cursor-pointer text-muted-foreground" />
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-neutral-800 text-foreground text-xs rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                  Informasi Total Trading Jurnal anda
                </div>
              </div>
            </div>
            <p className="text-3xl sm:text-4xl font-bold mb-0.5 text-foreground">
              {currencyFormatter.format(userData.totalInvestment)}
            </p>
            <p className={`text-sm sm:text-base font-medium ${userData.investmentChange >= 0 ? 'text-green-400' : 'text-red-400' }`}>
              {userData.investmentChange >= 0 ? '+' : ''}
              {currencyFormatter.format(userData.investmentChange)} ({userData.investmentChange >= 0 ? '+' : ''}{userData.investmentChangePercent}%)
            </p>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-grow -mt-16 sm:-mt-20 pb-8 px-3 sm:px-4 relative z-20">
        <div
          className="container mx-auto p-4 sm:p-6 rounded-xl sm:rounded-2xl shadow-xl flex flex-col space-y-6 sm:space-y-8 max-w-4xl bg-card"
        >
          {/* Search Bar */}
          <div className="relative">
            <input 
              type="search" 
              placeholder="Cari inspirasi investasi... (mis: IHSG, Saham BBCA)"
              className="w-full p-3 sm:p-4 pl-10 sm:pl-12 text-sm sm:text-base bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-primary/50 outline-none transition-colors placeholder-muted-foreground text-foreground"
            />
            <SearchIcon className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          </div>
          
          {/* Quick Actions Menu */}
          <section>
            <div className="grid grid-cols-3 gap-2 sm:gap-3 text-center">
              {newMenuItems.map((item) => (
                <button 
                  key={item.name}
                  onClick={item.action}
                  className="flex flex-col items-center justify-center p-2 sm:p-3 bg-background hover:bg-neutral-800/70 border border-border rounded-lg transition-all duration-200 group"
                >
                  <item.icon className="w-6 h-6 sm:w-7 sm:h-7 mb-1.5 text-primary group-hover:scale-110 transition-transform" />
                  <span className="text-[11px] sm:text-xs font-medium text-muted-foreground group-hover:text-foreground capitalize">{item.name}</span>
                </button>
              ))}
            </div>
          </section>

     
          <section className="p-4 sm:p-5 bg-background border border-border rounded-lg">
            <div className="flex justify-between items-center mb-3">
              <h2 className="text-base sm:text-lg font-semibold text-foreground">Tren Pasar Minggu Ini</h2>
              <button className="text-xs sm:text-sm text-primary hover:underline">Lihat Detail</button>
            </div>
            <SimpleBarChart data={marketTrendData} height="h-[180px] sm:h-[220px]" />
          </section>

          {/* News Section - Black and White Modern Theme */}
          <section>
            <div className="flex justify-between items-center mb-3">
              <h2 className="text-base sm:text-lg font-semibold text-white">Berita Terbaru</h2>
              <button className="text-xs sm:text-sm text-gray-300 hover:underline">Lihat Semua</button>
            </div>
            <div className="space-y-4">
              {[1, 2, 3].map((item) => (
                <div key={item} className="bg-black p-4 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200 flex items-start space-x-4">
                  <div className="w-24 h-20 bg-gray-800 rounded flex-shrink-0">
                    {/* Placeholder for news image - Anda bisa menggantinya dengan <Image /> dari Next.js */}
                  </div>
                  <div className="flex-grow">
                    <h3 className="text-sm sm:text-md font-semibold text-white mb-1 line-clamp-2">
                      Judul Berita Panjang yang Mungkin Membutuhkan Dua Baris atau Lebih
                    </h3>
                    <p className="text-xs sm:text-sm text-gray-400 line-clamp-2 mb-1">
                      Ini adalah deskripsi singkat dari berita. Konten ini akan menjelaskan poin utama dari artikel berita tersebut secara ringkas.
                    </p>
                    <div className="text-xs text-gray-500">
                      <span>Sumber Berita</span> | <span>2 jam yang lalu</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
          {/* End of News Section */}

        </div>
      </main>
    </div>
  );
}
