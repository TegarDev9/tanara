'use client';

import { themeParams, useSignal } from '@telegram-apps/sdk-react';
import { List } from '@telegram-apps/telegram-ui';

import { DisplayData } from '@/components/DisplayData/DisplayData';


export default function ThemeParamsPage() {
  const tp = useSignal(themeParams.state);

  return (
    <div>
      <List>
        <DisplayData
          rows={Object.entries(tp).map(([title, value]) => ({
            title: title
              .replace(/[A-Z]/g, (m) => `_${m.toLowerCase()}`)
              .replace(/background/, 'bg'),
            value,
          }))}
        />
      </List>
    </div>
  );
}