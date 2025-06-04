'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';

// Replace with your actual logo component or an img tag
const YourLogo = () => (
  <svg className="w-24 h-24 text-primary animate-pulse" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    {/* Example Logo Path (replace with your actual logo SVG path) */}
    <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
  </svg>
);

interface SplashScreenProps {
  onFinished: () => void;
}

const SplashScreen: React.FC<SplashScreenProps> = ({ onFinished }) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
    }, 2000); // Splash screen visible for 2 seconds

    const fadeOutTimer = setTimeout(() => {
        onFinished();
    }, 2500); // Start fade out slightly before onFinished to allow animation

    return () => {
        clearTimeout(timer);
        clearTimeout(fadeOutTimer);
    }
  }, [onFinished]);

  return (
    <div
      className={`fixed inset-0 z-[100] flex flex-col items-center justify-center bg-background transition-opacity duration-500 ease-in-out ${isVisible ? 'opacity-100' : 'opacity-0'}`}
    >
      <YourLogo />
      <p className="mt-4 text-lg font-semibold text-foreground animate-fadeIn">Loading...</p>
      
      {/* Optional: Add a subtle loading bar or spinner */}
      <div className="absolute bottom-16 w-3/4 max-w-xs h-2 bg-muted rounded-full overflow-hidden">
        <div className="h-full bg-primary animate-loadingBar"></div>
      </div>

      <style jsx global>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.8s ease-out forwards;
        }
        @keyframes loadingBar {
          0% { width: 0%; }
          100% { width: 100%; }
        }
        .animate-loadingBar {
          animation: loadingBar 2s ease-in-out forwards; /* Match splash screen duration */
        }
      `}</style>
    </div>
  );
};

export default SplashScreen;

// Contoh jika Anda menggunakan next/image:
// Ganti src gambar yang lama dengan path ke logo baru Anda
// Jika logo.png sudah ada di public/image/logo.png:
<Image src="/image/logo.png" alt="Loading" width={100} height={100} />

// Atau jika Anda masih ingin menyimpannya di src/image dan mengimpornya:
// import appLogo from '@/image/logo.png'; // Pastikan path ini benar
// <Image src={appLogo} alt="Loading..." width={100} height={100} />