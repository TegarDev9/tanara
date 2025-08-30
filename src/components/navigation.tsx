'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

// Type definitions
interface IconProps {
  className?: string;
  [key: string]: unknown;
}

// Modern minimalist SVG icons
const HomeIcon = ({ className, ...props }: IconProps) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={2}
    className={className}
    {...props}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25"
    />
  </svg>
);

const ChartIcon = ({ className, ...props }: IconProps) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={2}
    className={className}
    {...props}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941"
    />
  </svg>
);

const ChatIcon = ({ className, ...props }: IconProps) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={2}
    className={className}
    {...props}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 01-.825-.242m9.345-8.334a2.126 2.126 0 00-.476-.095 48.64 48.64 0 00-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0011.25 3c-2.115 0-4.198.137-6.24.402-1.608.209-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.74.194V21l4.155-4.155"
    />
  </svg>
);

const GiftIcon = ({ className, ...props }: IconProps) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={2}
    className={className}
    {...props}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M21 11.25v8.25a1.5 1.5 0 01-1.5 1.5H5.25a1.5 1.5 0 01-1.5-1.5v-8.25M12 4.875A3.375 3.375 0 008.625 8.25H15.375A3.375 3.375 0 0012 4.875zM12 4.875v16.5M8.25 12h7.5"
    />
  </svg>
);

const SettingsIcon = ({ className, ...props }: IconProps) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={2}
    className={className}
    {...props}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z"
    />
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
    />
  </svg>
);

// Navigation items configuration
interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<IconProps>;
}

const navItems: NavItem[] = [
  { href: '/pages/home', label: 'Home', icon: HomeIcon },
  { href: '/pages/chart', label: 'Chart', icon: ChartIcon },
  { href: '/pages/chat', label: 'Chat', icon: ChatIcon },
  { href: '/pages/airdrop', label: 'Airdrop', icon: GiftIcon },
  { href: '/pages/profile', label: 'Settings', icon: SettingsIcon },
];

export default function BottomNav(): JSX.Element {
  const pathname = usePathname();

  return (
    <nav
      className="
        fixed bottom-6 left-1/2 -translate-x-1/2 z-50
        w-auto max-w-sm mx-4
        bg-black border border-white/10
        backdrop-blur-xl shadow-2xl shadow-black/20
        rounded-2xl px-6 py-4
      "
      role="navigation"
      aria-label="Bottom navigation"
    >
      <div className="flex items-center justify-between gap-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link
              key={item.label}
              href={item.href}
              aria-label={item.label}
              className={`
                relative flex items-center justify-center
                w-12 h-12 rounded-xl
                transition-all duration-300 ease-out
                group hover:scale-110 active:scale-95
                ${isActive
                  ? 'bg-white text-black shadow-lg shadow-white/20'
                  : 'text-white/70 hover:text-white hover:bg-white/5'
                }
                focus:outline-none focus:ring-2 focus:ring-white/20 focus:ring-offset-2 focus:ring-offset-black
              `}
            >
              <Icon className="w-6 h-6 transition-transform duration-300 group-hover:scale-110" />

              {/* Active indicator dot */}
              {isActive && (
                <div className="absolute -bottom-1 w-1 h-1 bg-black rounded-full" />
              )}

              {/* Tooltip */}
              <div
                className="
                  absolute -top-12 left-1/2 -translate-x-1/2
                  px-2 py-1 bg-white text-black text-xs font-medium rounded-md
                  opacity-0 pointer-events-none transition-all duration-200
                  group-hover:opacity-100 group-hover:-translate-y-1
                  whitespace-nowrap
                "
              >
                {item.label}
                <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-white" />
              </div>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
