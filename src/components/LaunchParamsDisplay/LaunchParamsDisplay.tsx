'use client';

import { useLaunchParams } from '@telegram-apps/sdk-react';
import { List } from '@telegram-apps/telegram-ui';
import { useEffect, useState } from 'react';

import { DisplayData } from '@/components/DisplayData/DisplayData';

export default function LaunchParamsDisplay() {
  const [isClient, setIsClient] = useState(false);
  const launchParams = useLaunchParams();

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return null; // Atau tampilkan placeholder/loader
  }

  // lp sekarang akan merujuk ke launchParams yang sudah pasti ada di client
  const lp = launchParams;

  return (
    <List>
      <DisplayData
        rows={[
          { title: 'tgWebAppPlatform', value: lp.tgWebAppPlatform },
          { title: 'tgWebAppShowSettings', value: lp.tgWebAppShowSettings },
          { title: 'tgWebAppVersion', value: lp.tgWebAppVersion },
          { title: 'tgWebAppBotInline', value: lp.tgWebAppBotInline },
          { title: 'tgWebAppStartParam', value: lp.tgWebAppStartParam },
          { title: 'tgWebAppData', type: 'link', value: '/init-data' },
          {
            title: 'tgWebAppThemeParams',
            type: 'link',
            value: '/theme-params',
          },
        ]}
      />
    </List>
  );
}

LaunchParamsDisplay.displayName = 'LaunchParamsDisplay';