'use client';

import { DisplayData } from '@/components/DisplayData/DisplayData';

export default function ThemeParamsPage() {
  const tp = {
    accent_text_color: '#6ab2f2',
    bg_color: '#17212b',
    button_color: '#5288c1',
    button_text_color: '#ffffff',
    destructive_text_color: '#ec3942',
    header_bg_color: '#17212b',
    hint_color: '#708499',
    link_color: '#6ab3f3',
    secondary_bg_color: '#232e3c',
    section_bg_color: '#17212b',
    section_header_text_color: '#6ab3f3',
    subtitle_text_color: '#708499',
    text_color: '#f5f5f5',
  };

  return (
    <div>
      <DisplayData
        rows={Object.entries(tp).map(([title, value]) => ({
          title: title
            .replace(/[A-Z]/g, (m) => `_${m.toLowerCase()}`)
            .replace(/background/, 'bg'),
          value,
        }))}
      />
    </div>
  );
}
