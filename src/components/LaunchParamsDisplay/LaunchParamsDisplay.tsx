'use client';

import { useEffect, useState } from 'react';

export default function LaunchParamsDisplay() {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return null;
  }

  return (
    <div>
      <p>Launch parameters are not available in this environment.</p>
    </div>
  );
}

LaunchParamsDisplay.displayName = 'LaunchParamsDisplay';
