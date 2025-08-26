"use client";

import React, { useEffect, useRef, useState } from 'react';

// Define types for better type safety
interface StudySettings {
  MA?: { length?: number };
  MACD?: { fast?: number; slow?: number; signal?: number };
  RSI?: { length?: number };
  BB?: { length?: number; stddev?: number };
  [key: string]: unknown;
}

interface Preset {
  id: number | string;
  name: string;
  payload?: {
    indicators: string[];
    settings: StudySettings;
  };
  indicators?: string[];
  settings?: StudySettings;
}

// This is a placeholder for the TradingView widget object.
// The actual type is available globally after the script loads.
interface TradingViewChart {
  createStudy(name: string, forceOverlay: boolean, lockScale: boolean, inputs: unknown[], overrides?: unknown, options?: unknown): void;
}

interface TradingViewWidget {
  onChartReady(callback: () => void): void;
  chart(): TradingViewChart;
  // Add other widget methods and properties as needed
}


function isHexColorDark(hex?: string) {
  if (!hex) return false;
  const h = hex.replace('#', '');
  if (h.length !== 6) return false;
  const r = parseInt(h.substring(0,2),16);
  const g = parseInt(h.substring(2,4),16);
  const b = parseInt(h.substring(4,6),16);
  // relative luminance
  const luminance = (0.299*r + 0.587*g + 0.114*b) / 255;
  return luminance < 0.5;
}

export default function ChartPage(){
  const containerRef = useRef<HTMLDivElement | null>(null);
  const widgetRef = useRef<TradingViewWidget | null>(null);
  const [symbol, setSymbol] = useState<string>(() => typeof window !== 'undefined' ? localStorage.getItem('tv_symbol') || 'NASDAQ:AAPL' : 'NASDAQ:AAPL');
  const [interval, setInterval] = useState<string>(() => typeof window !== 'undefined' ? localStorage.getItem('tv_interval') || 'D' : 'D');
  const [indicators, setIndicators] = useState<string[]>(() => {
    try { return typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('tv_indicators') || '[]') : []; } catch { return []; }
  });

  const [settings, setSettings] = useState<StudySettings>(() => {
    try { return typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('tv_settings') || '{}') : {}; } catch { return {}; }
  });
  const scriptRef = useRef<HTMLScriptElement | null>(null);
  const [presets, setPresets] = useState<Preset[]>(() => {
    try { return typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('tv_presets') || '[]') : []; } catch { return []; }
  });
  const [presetName, setPresetName] = useState<string>('My Preset');

  const detectTheme = () => {
    // Prefer Telegram WebApp colorScheme, fallback to themeParams.bg_color
    try {
      const tg = window.Telegram?.WebApp;
      if (tg && tg.colorScheme) return tg.colorScheme === 'dark' ? 'Dark' : 'Light';
      // try tma shim
      const tmaTheme = window.tma?.getTheme && window.tma.getTheme();
      if (tmaTheme && tmaTheme.colorScheme) return tmaTheme.colorScheme === 'dark' ? 'Dark' : 'Light';
      // fallback to themeParams
      const params = window.Telegram?.WebApp?.themeParams || window.tma?.themeParams;
      if (params && params.bg_color) return isHexColorDark(params.bg_color) ? 'Dark' : 'Light';
    } catch {
      // ignore
    }
    return 'Light';
  };

  const applyIndicators = (widget: TradingViewWidget, list: string[]) => {
    try {
      if (!widget || !widget.chart) return;
      widget.onChartReady(() => {
        const chart = widget.chart();
        list.forEach((ind) => {
          try {
            // common study names: provide study parameters where possible
            const cfg = settings || {};
            if (ind === 'MA') {
              const len = (cfg.MA && cfg.MA.length) || 14;
              chart.createStudy('Moving Average', false, false, [], null, { length: len });
            }
            else if (ind === 'MACD') {
              const fast = (cfg.MACD && cfg.MACD.fast) || 12;
              const slow = (cfg.MACD && cfg.MACD.slow) || 26;
              const signal = (cfg.MACD && cfg.MACD.signal) || 9;
              chart.createStudy('MACD', false, false, [], null, { fastPeriod: fast, slowPeriod: slow, signalPeriod: signal });
            }
            else if (ind === 'RSI') {
              const len = (cfg.RSI && cfg.RSI.length) || 14;
              chart.createStudy('RSI', false, false, [], null, { length: len });
            }
            else if (ind === 'BB') {
              const len = (cfg.BB && cfg.BB.length) || 20;
              const sd = (cfg.BB && cfg.BB.stddev) || 2;
              chart.createStudy('Bollinger Bands', false, false, [], null, { length: len, stddev: sd });
            }
          } catch (err) {
            // ignore per-study errors
            console.warn('applyIndicators failed for', ind, err);
          }
        });
      });
    } catch (err) {
      console.warn('applyIndicators error', err);
    }
  };

  // Initialize or re-create the TradingView widget
  const initWidget = () => {
    try {
      const tv = window.TradingView;
      if (!tv) return;
      // clear previous widget
      if (containerRef.current) containerRef.current.innerHTML = '';

      const theme = detectTheme();
      const widget = new tv.widget({
        width: '100%',
        height: 600,
        symbol: symbol,
        interval: interval,
        timezone: 'Etc/UTC',
        theme: theme,
        style: '1',
        locale: 'en',
        toolbar_bg: '#f1f3f6',
        enable_publishing: false,
        allow_symbol_change: true,
        container_id: 'tradingview_chart_container'
      });
      widgetRef.current = widget;
      applyIndicators(widget, indicators);
    } catch (err) {
      console.error('TradingView initWidget error', err);
    }
  };

  useEffect(() => {
    // load script once
    if (!window.TradingView && !scriptRef.current) {
      const script = document.createElement('script');
      script.src = 'https://s3.tradingview.com/tv.js';
      script.async = true;
      script.onload = () => {
        scriptRef.current = script;
        initWidget();
      };
      document.head.appendChild(script);
    } else {
      // already available
      initWidget();
    }

    const container = containerRef.current;
    return () => {
      // clear container only
      if (container) container.innerHTML = '';
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // reload widget when user clicks Load
  const savePreferencesToServer = async (telegramId?: string) => {
    const payload = {
      telegramId: telegramId || undefined,
      symbol,
      interval,
      indicators,
      settings,
    };
    try {
      const res = await fetch('/api/prefs', { method: 'POST', body: JSON.stringify(payload), headers: { 'content-type': 'application/json' } });
      if (!res.ok) throw new Error('save failed');
      return await res.json();
    } catch {
      // fallback to localStorage
      try {
        localStorage.setItem('tv_symbol', symbol);
        localStorage.setItem('tv_interval', interval);
        localStorage.setItem('tv_indicators', JSON.stringify(indicators));
        localStorage.setItem('tv_settings', JSON.stringify(settings));
      } catch {}
      return null;
    }
  };

  const listPresets = async (telegramId?: string) : Promise<Preset[]> => {
    try {
      if (!telegramId) return presets;
      const res = await fetch(`/api/presets?telegramId=${encodeURIComponent(telegramId)}`);
      if (!res.ok) return presets;
      const data = await res.json();
      setPresets(data || []);
      try { localStorage.setItem('tv_presets', JSON.stringify(data || [])); } catch {}
      return data;
    } catch {
      return presets;
    }
  };

  const createPreset = async (name: string, telegramId?: string) : Promise<Preset> => {
    const payload = { telegramId: telegramId || undefined, name, payload: { indicators, settings } };
    try {
      const res = await fetch('/api/presets', { method: 'POST', body: JSON.stringify(payload), headers: { 'content-type': 'application/json' } });
      if (!res.ok) throw new Error('create preset failed');
      const p = await res.json();
      const next = (presets || []).concat(p);
      setPresets(next);
      try { localStorage.setItem('tv_presets', JSON.stringify(next)); } catch {}
      return p;
    } catch {
      // fallback: store locally
      const local = { id: Date.now(), name, indicators, settings };
      const next = (presets || []).concat(local);
      setPresets(next);
      try { localStorage.setItem('tv_presets', JSON.stringify(next)); } catch {}
      return local;
    }
  };

  const deletePreset = async (presetId: number | string, telegramId?: string) => {
    try {
      if (!telegramId) {
        const next = (presets || []).filter((p: Preset) => String(p.id) !== String(presetId));
        setPresets(next);
        try { localStorage.setItem('tv_presets', JSON.stringify(next)); } catch {}
        return { success: true };
      }
      const res = await fetch('/api/presets', { method: 'DELETE', body: JSON.stringify({ telegramId, presetId }), headers: { 'content-type': 'application/json' } });
      if (!res.ok) throw new Error('delete failed');
      const next = (presets || []).filter((p: Preset) => String(p.id) !== String(presetId));
      setPresets(next);
      try { localStorage.setItem('tv_presets', JSON.stringify(next)); } catch {}
      return await res.json();
    } catch (err) {
      return { error: String(err) };
    }
  };

  const getTelegramId = (): string | undefined => {
    try {
      const tma = window.tma;
      if (tma && tma.getUser) {
        const u = tma.getUser();
        if (u && u.id) return String(u.id);
      }
    } catch {
      // ignore
    }
    return undefined;
  };

  const applyPreset = (p: Preset) => {
    try {
      const data = p.payload || p;
      const newIndicators = data.indicators || p.indicators || [];
      const newSettings = data.settings || p.settings || {};
      setIndicators(newIndicators);
      setSettings(newSettings);
      try {
        localStorage.setItem('tv_indicators', JSON.stringify(newIndicators));
        localStorage.setItem('tv_settings', JSON.stringify(newSettings));
      } catch {}
      // re-init widget to apply
      setTimeout(() => initWidget(), 50);
    } catch (err) {
      console.warn('applyPreset failed', err);
    }
  };

  const onLoadClick = async () => {
    // try to get telegramId from tma/getUser if available
    let telegramId: string | undefined;
    try {
      const tma = window.tma;
      if (tma && tma.getUser) {
        // tma.getUser may return { id, username }
        const u = tma.getUser();
        if (u && u.id) telegramId = String(u.id);
      }
    } catch {
      // ignore
    }

    await savePreferencesToServer(telegramId);
  // refresh presets for user
  await listPresets(telegramId);
  initWidget();
  };

  const toggleIndicator = (id: string) => {
    setIndicators((prev: string[]) => {
      const next = prev.includes(id) ? prev.filter((x: string) => x!==id) : prev.concat(id);
      try { localStorage.setItem('tv_indicators', JSON.stringify(next)); } catch {}
      return next;
    });
  };

  const updateSetting = (key: string, value: Record<string, unknown>) => {
    setSettings((prev: StudySettings) => {
      const next = { ...(prev || {}), [key]: { ...(prev?.[key] || {}), ...value } };
      try { localStorage.setItem('tv_settings', JSON.stringify(next)); } catch {}
      return next;
    });
  };

  return (
    <div style={{padding:16}}>
      <h1>Trading Chart</h1>

      <div style={{display:'flex', gap:8, alignItems:'center', marginBottom:12}}>
        <label style={{display:'flex', gap:6, alignItems:'center'}}>
          Symbol:
          <input value={symbol} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSymbol(e.target.value)} style={{padding:6, borderRadius:6, border:'1px solid #ddd'}} />
        </label>

        <label style={{display:'flex', gap:6, alignItems:'center'}}>
          Interval:
          <select value={interval} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setInterval(e.target.value)} style={{padding:6, borderRadius:6, border:'1px solid #ddd'}}>
            <option value="1">1</option>
            <option value="5">5</option>
            <option value="15">15</option>
            <option value="60">60</option>
            <option value="D">D</option>
            <option value="W">W</option>
          </select>
        </label>

        <button onClick={onLoadClick} style={{padding:'8px 12px', borderRadius:8, background:'#2a9df4', color:'#fff', border:'none'}}>Load</button>
      </div>

      <div style={{display:'flex', gap:12, alignItems:'flex-start', marginBottom:12}}>
        <div>
          <label style={{display:'flex', gap:6, alignItems:'center'}}><input type="checkbox" checked={indicators.includes('MA')} onChange={() => toggleIndicator('MA')} /> MA</label>
          {indicators.includes('MA') && (
            <div style={{marginTop:6}}>
              <label style={{display:'flex', gap:6, alignItems:'center'}}>Length: <input type="number" value={(settings?.MA?.length)||14} onChange={(e: React.ChangeEvent<HTMLInputElement>)=> updateSetting('MA', { length: Number(e.target.value) })} style={{width:80}}/></label>
            </div>
          )}
        </div>
        <div>
          <label style={{display:'flex', gap:6, alignItems:'center'}}><input type="checkbox" checked={indicators.includes('MACD')} onChange={() => toggleIndicator('MACD')} /> MACD</label>
          {indicators.includes('MACD') && (
            <div style={{marginTop:6}}>
              <label style={{display:'flex', gap:6, alignItems:'center'}}>Fast: <input type="number" value={(settings?.MACD?.fast)||12} onChange={(e: React.ChangeEvent<HTMLInputElement>)=> updateSetting('MACD', { fast: Number(e.target.value) })} style={{width:60}}/></label>
              <label style={{display:'flex', gap:6, alignItems:'center'}}>Slow: <input type="number" value={(settings?.MACD?.slow)||26} onChange={(e: React.ChangeEvent<HTMLInputElement>)=> updateSetting('MACD', { slow: Number(e.target.value) })} style={{width:60}}/></label>
              <label style={{display:'flex', gap:6, alignItems:'center'}}>Signal: <input type="number" value={(settings?.MACD?.signal)||9} onChange={(e: React.ChangeEvent<HTMLInputElement>)=> updateSetting('MACD', { signal: Number(e.target.value) })} style={{width:60}}/></label>
            </div>
          )}
        </div>
        <div>
          <label style={{display:'flex', gap:6, alignItems:'center'}}><input type="checkbox" checked={indicators.includes('RSI')} onChange={() => toggleIndicator('RSI')} /> RSI</label>
          {indicators.includes('RSI') && (
            <div style={{marginTop:6}}>
              <label style={{display:'flex', gap:6, alignItems:'center'}}>Length: <input type="number" value={(settings?.RSI?.length)||14} onChange={(e: React.ChangeEvent<HTMLInputElement>)=> updateSetting('RSI', { length: Number(e.target.value) })} style={{width:80}}/></label>
            </div>
          )}
        </div>
        <div>
          <label style={{display:'flex', gap:6, alignItems:'center'}}><input type="checkbox" checked={indicators.includes('BB')} onChange={() => toggleIndicator('BB')} /> Bollinger Bands</label>
          {indicators.includes('BB') && (
            <div style={{marginTop:6}}>
              <label style={{display:'flex', gap:6, alignItems:'center'}}>Length: <input type="number" value={(settings?.BB?.length)||20} onChange={(e: React.ChangeEvent<HTMLInputElement>)=> updateSetting('BB', { length: Number(e.target.value) })} style={{width:80}}/></label>
              <label style={{display:'flex', gap:6, alignItems:'center'}}>StdDev: <input type="number" value={(settings?.BB?.stddev)||2} onChange={(e: React.ChangeEvent<HTMLInputElement>)=> updateSetting('BB', { stddev: Number(e.target.value) })} style={{width:80}}/></label>
            </div>
          )}
        </div>
      </div>
      <div style={{marginBottom:12, borderTop:'1px solid #eee', paddingTop:12}}>
        <h3>Presets</h3>
        <div style={{display:'flex', gap:8, alignItems:'center', marginBottom:8}}>
          <input value={presetName} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPresetName(e.target.value)} style={{padding:6, borderRadius:6, border:'1px solid #ddd'}} />
          <button onClick={async () => { const id = getTelegramId(); await createPreset(presetName, id); }} style={{padding:'6px 10px', borderRadius:6}}>Save preset</button>
          <button onClick={async () => { const id = getTelegramId(); await listPresets(id); }} style={{padding:'6px 10px', borderRadius:6}}>Refresh</button>
        </div>
        <div style={{display:'flex', gap:8, flexWrap:'wrap'}}>
          {(presets || []).map((p: Preset) => (
            <div key={String(p.id)} style={{border:'1px solid #ddd', padding:8, borderRadius:8, minWidth:160}}>
              <div style={{fontWeight:600}}>{p.name || `Preset ${p.id}`}</div>
              <div style={{marginTop:6, display:'flex', gap:6}}>
                <button onClick={() => applyPreset(p)} style={{padding:'6px 8px', borderRadius:6}}>Apply</button>
                <button onClick={async () => { const id = getTelegramId(); await deletePreset(p.id, id); }} style={{padding:'6px 8px', borderRadius:6}}>Delete</button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div id="tradingview_chart_container" ref={containerRef}></div>
    </div>
  );
}
