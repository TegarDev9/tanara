'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation'; // Hook untuk mendapatkan path URL saat ini
import { SVGProps } from 'react';

// Colors are now primarily from Tailwind theme. This object can be removed or simplified.
// const colors = {
//   navBackground: '#000000', // Will use theme's `bg-neutral-900` or similar
//   iconActive: '#FFFFFF',    // Will use theme's `text-primary`
//   iconInactive: '#A0A0A0', // Will use theme's `text-muted-foreground`
// };

// --- New Simplified SVG Icons ---

const IconSimpleHome = ({ className, ...props }: SVGProps<SVGSVGElement>) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    fill="none" 
    viewBox="0 0 24 24" 
    stroke="currentColor" 
    strokeWidth={2} 
    className={className} 
    {...props}
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0h6" />
  </svg>
);

const IconSimpleSettings = ({ className, ...props }: SVGProps<SVGSVGElement>) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    fill="none" 
    viewBox="0 0 24 24" 
    stroke="currentColor" 
    strokeWidth={2} 
    className={className} 
    {...props}
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);
const IconChatBubble = ({ className, ...props }: SVGProps<SVGSVGElement>) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    fill="none" 
    viewBox="0 0 24 24" 
    stroke="currentColor" 
    strokeWidth={2} 
    className={className} 
    {...props}
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-3.862 8.25-8.625 8.25S3.75 16.556 3.75 12 7.612 3.75 12.375 3.75 21 7.444 21 12z" />
  </svg>
);

// --- New Scanner Icon ---
const IconScanner = ({ className, ...props }: SVGProps<SVGSVGElement>) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    fill="none" 
    viewBox="0 0 24 24" 
    stroke="currentColor" 
    strokeWidth={2} 
    className={className} 
    {...props}
  >
    {/* Simple viewfinder/scan target icon */}
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /> {/* Crosshair style for simplicity */}
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 3h6M9 21h6M3 9v6M21 9v6" /> {/* Corner brackets */}
  </svg>
);

// Updated nav items
const navItems = [
  { href: "/pages/home", label: "Home", icon: IconSimpleHome },
  { href: "/pages/scanner", label: "Scanner", icon: IconScanner },
  { href: "/pages/chat", label: "Chat", icon: IconChatBubble },
  { href: "/pages/profile", label: "Settings", icon: IconSimpleSettings },
];

export default function BottomNav() {
  const pathname = usePathname();
  return (
    <nav 
        className="fixed bottom-5 left-1/2 transform -translate-x-1/2 
                   w-auto max-w-[340px] sm:max-w-[400px]  
                   px-4 py-2 sm:px-5 sm:py-2.5 
                   bg-neutral-900 rounded-full shadow-xl shadow-neutral-800/60 z-50"
                   // Using bg-neutral-900 for a very dark gray, slightly off-black for depth
    >
      <div className="flex justify-around items-center space-x-3 sm:space-x-4">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.label}
              href={item.href}
              aria-label={item.label}
              className={`flex items-center justify-center p-2 sm:p-2.5 rounded-full transition-colors duration-200 ease-in-out group
                          hover:bg-neutral-700/60 
                          focus:outline-none focus:ring-2 focus:ring-primary/70 focus:ring-offset-2 focus:ring-offset-neutral-900`}
            >
              <item.icon 
                className={`w-6 h-6 sm:w-7 sm:h-7 transition-colors duration-200 
                            ${isActive ? `text-primary` : `text-muted-foreground group-hover:text-foreground`}`
                }
              />
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
