// File: components/SplashScreen.tsx
'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';

interface SplashScreenProps {
  onFinished: () => void;
}

const SplashScreen: React.FC<SplashScreenProps> = ({ onFinished }) => {
  const [isVisible, setIsVisible] = useState(true);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(progressInterval);
          return 100;
        }
        return prev + 2;
      });
    }, 40);

    const hideTimer = setTimeout(() => {
      setIsVisible(false);
    }, 2000);

    const finishTimer = setTimeout(() => {
      onFinished();
    }, 2500);

    return () => {
      clearInterval(progressInterval);
      clearTimeout(hideTimer);
      clearTimeout(finishTimer);
    };
  }, [onFinished]);

  return (
    <div
      className={`fixed inset-0 z-[100] flex flex-col items-center justify-center bg-black transition-all duration-700 ease-out ${
        isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
      }`}
    >
      {/* Dark background pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.1),transparent)] animate-pulse" />
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center space-y-8">
        {/* Logo Container */}
        <div className="relative p-6 bg-zinc-900/50 rounded-3xl shadow-2xl border border-zinc-700/50 backdrop-blur-sm animate-in slide-in-from-top-4 fade-in">
          <Image
            src="/image/logo.png"
            alt="App Logo"
            width={80}
            height={80}
            className="object-contain filter brightness-0 invert hover:brightness-100 hover:invert-0 transition-all duration-500"
            priority
          />
          <div className="absolute inset-0 bg-white/10 rounded-lg blur-xl animate-pulse" />
        </div>

        {/* Title */}
        <div className="text-center space-y-2 animate-in slide-in-from-bottom-4 fade-in delay-300">
          <h1 className="text-2xl font-bold text-white tracking-tight">
            Trading Learning
          </h1>
          <p className="text-sm text-zinc-300 font-medium tracking-wide uppercase">
            Loading Experience
          </p>
        </div>

        {/* Progress Bar */}
        <div className="w-64 space-y-3 animate-in slide-in-from-bottom-4 fade-in delay-500">
          <div className="w-full h-1 bg-zinc-700 rounded-full overflow-hidden shadow-inner">
            <div
              className="h-full bg-gradient-to-r from-white via-zinc-200 to-white rounded-full transition-all duration-100 ease-out shadow-sm"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="flex justify-between items-center text-xs text-zinc-400 font-mono">
            <span>Loading...</span>
            <span>{progress}%</span>
          </div>
        </div>

        {/* Floating Elements */}
        <div className="absolute top-20 left-1/2 transform -translate-x-1/2">
          <div className="w-1 h-1 bg-zinc-400 rounded-full animate-ping" />
        </div>
        <div className="absolute bottom-20 left-1/3">
          <div className="w-2 h-2 bg-zinc-500 rounded-full animate-bounce delay-1000" />
        </div>
        <div className="absolute bottom-32 right-1/3">
          <div className="w-1.5 h-1.5 bg-zinc-300 rounded-full animate-pulse delay-500" />
        </div>
      </div>

      {/* Footer */}
      <div className="absolute bottom-8 text-center animate-in fade-in delay-700">
        <p className="text-xs text-zinc-500 font-light tracking-widest">
          2025 • TRADING LEARNING
        </p>
      </div>

      {/* Global Styles for Animations */}
      <style jsx global>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .fade-in {
          animation: fade-in 0.8s ease-out forwards;
        }
        @keyframes slide-in-from-top {
          from {
            opacity: 0;
            transform: translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .slide-in-from-top-4 {
          animation: slide-in-from-top 0.8s ease-out forwards;
        }
        @keyframes slide-in-from-bottom {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .slide-in-from-bottom-4 {
          animation: slide-in-from-bottom 0.8s ease-out forwards;
        }
        @keyframes pulse {
          0% {
            opacity: 0.6;
            transform: scale(0.95);
          }
          50% {
            opacity: 1;
            transform: scale(1);
          }
          100% {
            opacity: 0.6;
            transform: scale(0.95);
          }
        }
        .animate-pulse {
          animation: pulse 2s infinite ease-in-out;
        }
        @keyframes ping {
          0% {
            transform: scale(1);
            opacity: 1;
          }
          75%, 100% {
            transform: scale(2);
            opacity: 0;
          }
        }
        .animate-ping {
          animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;
        }
        @keyframes bounce {
          0%, 100% {
            transform: translateY(-25%);
            animation-timing-function: cubic-bezier(0.8, 0, 1, 1);
          }
          50% {
            transform: translateY(0);
            animation-timing-function: cubic-bezier(0, 0, 0.2, 1);
          }
        }
        .animate-bounce {
          animation: bounce 1s infinite;
        }
      `}</style>
    </div>
  );
};

export default SplashScreen;
