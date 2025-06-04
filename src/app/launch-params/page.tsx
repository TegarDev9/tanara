'use client';

import dynamic from 'next/dynamic';

// Impor komponen LaunchParamsDisplay secara dinamis dengan SSR dinonaktifkan
const LaunchParamsDisplay = dynamic(
  () => import('@/components/LaunchParamsDisplay/LaunchParamsDisplay'),
  { ssr: false },
);

export default function LaunchParamsPage() {
  return (
    <div>
      <LaunchParamsDisplay />
    </div>
  );
}

LaunchParamsPage.displayName = 'LaunchParamsPage';