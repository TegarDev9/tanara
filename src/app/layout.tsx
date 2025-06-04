// app/layout.tsx
'use client'; // Sesuai permintaan pengguna

import "./globals.css"; // Pastikan file CSS global Anda mengimpor Tailwind
import BottomNav from "@/components/navigation"; // Asumsi path ini benar
import { useState, useEffect } from 'react'; // useEffect sekarang digunakan
import SplashScreen from '@/components/SplashScreen'; // Asumsi path ini benar
import { useRouter } from 'next/navigation';
import { TonConnectUIProvider } from '@tonconnect/ui-react'; // Ditambahkan
import Head from 'next/head'; // Pastikan Head diimpor dari next/head
import { AppRoot } from '@telegram-apps/telegram-ui'; // Import AppRoot
interface TelegramWebApp {
  initData?: string; version?: string;
  onEvent?: (event: string) => void;
  ready?: () => void;
  onToggleButton?: () => void;
  onBackButtonClick?: () => void;
  MainButton?: {
    isVisible?: boolean;
    color?: string;
    textColor?: string;
    isActive?: boolean;
    isProgressVisible?: boolean;
  };
  BackButton?: {
    isVisible?: boolean;

  }
  
}

interface WindowWithTelegram {
  Telegram?: {
    WebApp?: TelegramWebApp;
  };
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const [showSplash, setShowSplash] = useState(true);
  const router = useRouter();

  // Ambil manifestUrl dari environment variable.
  // Memberikan string kosong sebagai fallback jika variabel tidak terdefinisi
  // untuk mencegah error pada TonConnectUIProvider jika ia mengharapkan string.
  const manifestUrl = process.env.NEXT_PUBLIC_MANIFEST_URL || "";

  useEffect(() => {
    // Efek ini akan berjalan setelah komponen di-mount dan setiap kali nilai `showSplash` berubah.
    // Tujuannya adalah untuk memeriksa apakah aplikasi berjalan di dalam lingkungan Telegram.
    if (showSplash && typeof window !== "undefined") {
      // Pemeriksaan dilakukan secara berkala menggunakan setInterval.
      const intervalId = setInterval(() => {
        // Menggunakan tipe WindowWithTelegram yang sudah didefinisikan.
        const w = window as WindowWithTelegram;
        if (w.Telegram?.WebApp) {
          // Jika Telegram WebApp terdeteksi, sembunyikan splash screen.
          setShowSplash(false);
          // Penting: Hentikan interval setelah kondisi terpenuhi untuk mencegah pemanggilan berulang.
          clearInterval(intervalId);
        }
      }, 1000); // Interval pemeriksaan setiap 1 detik.

      return () => {
        clearInterval(intervalId);
      };
    }
  }, [showSplash]); // Array dependensi: efek ini akan dijalankan ulang jika `showSplash` berubah.

  const handleSplashFinished = () => {
    setShowSplash(false);
  
    router.push("/pages/home");
  };

  return (
    <html lang="en" suppressHydrationWarning={true}>
      <Head>
        {/* Menambahkan judul default dan deskripsi untuk praktik terbaik SEO */}
        <title>Tanara</title>
        <meta name="description" content="Aplikasi Mini Telegram dengan Next.js" />
        <link rel="icon" href="/image/logo.png" type="image/png" />
      </Head>
      <body>
        <TonConnectUIProvider manifestUrl={manifestUrl}>
          <AppRoot>
            {/* Render SplashScreen secara kondisional */}
            {showSplash && <SplashScreen onFinished={handleSplashFinished} />}

            {/* Konten utama aplikasi */}
            {/* Kelas 'flex' diterapkan saat showSplash false (membuatnya terlihat) */}
            {/* Kelas 'hidden' diterapkan saat showSplash true */}
            <div className={`container mx-auto max-w-md min-h-screen flex-col ${showSplash ? 'hidden' : 'flex'}`}>
              <main className="flex-grow pt-5 pb-20">
                {children}
              </main>
              {/* BottomNav hanya akan ditampilkan jika splash screen tidak aktif */}
              {!showSplash && <BottomNav />}
            </div>
          </AppRoot>
        </TonConnectUIProvider>
      </body>
    </html>
  );
}
