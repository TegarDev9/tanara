// components/Chart.tsx
'use client';

import React, {
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  createContext,
} from 'react';
import {
  ColorType,
  IChartApi,
  ISeriesApi,
  ChartOptions,
  CandlestickData,
  LineData,
  Time,
  UTCTimestamp,
  BusinessDay,
  DeepPartial,
  createChart,
  CandlestickSeries,
  LineSeries,
} from 'lightweight-charts';
import dynamic from 'next/dynamic';
import { usePineIndicator } from '../hook/usePineIndicator';
import type { OnMount } from '@monaco-editor/react';

const MonacoEditor = dynamic(
  () => import('@monaco-editor/react').then((mod) => ({ default: mod.Editor })),
  {
    ssr: false,
    loading: () => (
      <div className="h-full bg-neutral-900 flex items-center justify-center text-white/70">
        Loading editor...
      </div>
    ),
  }
);

const ChartContext = createContext<IChartApi | null>(null);

type TradingChartProps = {
  colors?: {
    backgroundColor?: string;
    textColor?: string;
    upColor?: string;
    downColor?: string;
  };
  symbol?: string;
  timeframe?: string;
};

type PineScript = {
  id: string;
  name: string;
  code: string;
  createdAt: Date;
  updatedAt: Date;
};

type PineIndicatorData = Record<string, number[]>;

type IndicatorHookResult = {
  data: PineIndicatorData | null;
  error: string | null;
  loading: boolean;
};

type IMonarchLanguage = {
  tokenizer: {
    root: Array<[RegExp, string] | [RegExp, string, string]>;
    string?: Array<[RegExp, string] | [RegExp, string, string]>;
  };
};

const createTimeValue = (date: Date, timeframe: string): Time => {
  if (timeframe.includes('m') || timeframe.includes('H')) {
    return (date.getTime() / 1000) as UTCTimestamp;
  }
  return {
    year: date.getFullYear(),
    month: date.getMonth() + 1,
    day: date.getDate(),
  } as BusinessDay;
};

async function fetchCandlestickData(
  symbol: string,
  timeframe: string
): Promise<CandlestickData[]> {
  const mock: CandlestickData[] = [];
  const start = new Date();
  start.setDate(start.getDate() - 100);
  let lastClose = 100 + Math.random() * 20;
  for (let i = 0; i < 100; i += 1) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    const open = lastClose + (Math.random() - 0.5) * 4;
    const change = (Math.random() - 0.5) * 10;
    const high = Math.max(open, open + change) + Math.random() * 3;
    const low = Math.min(open, open + change) - Math.random() * 3;
    const close = open + change;
    mock.push({
      time: createTimeValue(d, timeframe),
      open: Number(open.toFixed(2)),
      high: Number(high.toFixed(2)),
      low: Number(low.toFixed(2)),
      close: Number(close.toFixed(2)),
    });
    lastClose = close;
  }
  return mock;
}

const DEFAULT_PINE_SCRIPTS: Record<string, string> = {
  macd: `//@version=6
indicator("MACD #2")
fastInput = input(12, "Fast length")
slowInput = input(26, "Slow length")
[macdLine, signalLine, histLine] = ta.macd(close, fastInput, slowInput, 9)
plot(macdLine, color = color.blue, title="MACD")
plot(signalLine, color = color.orange, title="Signal")`,
  rsi: `//@version=6
indicator("RSI")
length = input.int(14, minval=1, title="Length")
src = input(close, "Source")
up = ta.rma(math.max(ta.change(src), 0), length)
down = ta.rma(-math.min(ta.change(src), 0), length)
rsi = down == 0 ? 100 : up == 0 ? 0 : 100 - (100 / (1 + up / down))
plot(rsi, color=color.purple, title="RSI")`,
  ema: `//@version=6
indicator("EMA Cross")
fastEMA = input.int(9, "Fast EMA")
slowEMA = input.int(21, "Slow EMA")
emaFast = ta.ema(close, fastEMA)
emaSlow = ta.ema(close, slowEMA)
plot(emaFast, color=color.blue, title="Fast EMA")
plot(emaSlow, color=color.red, title="Slow EMA")`,
};

function SimpleCodeEditor({
  value,
  onChange,
  language,
}: {
  value: string;
  onChange: (v: string) => void;
  language: string;
}): JSX.Element {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full h-full bg-neutral-900 text-white p-4 font-mono text-sm resize-none outline-none"
      style={{ fontFamily: 'Monaco, Consolas, monospace' }}
      spellCheck={false}
      placeholder={`// Enter your ${language} code here...`}
    />
  );
}

function PineScriptEditor({
  onExecute,
  onSave,
  savedScripts,
  onLoadScript,
}: {
  onExecute: (code: string) => void;
  onSave: (script: PineScript) => void;
  savedScripts: PineScript[];
  onLoadScript: (script: PineScript) => void;
}): JSX.Element {
  const [code, setCode] = useState<string>(DEFAULT_PINE_SCRIPTS.macd);
  const [isVisible, setIsVisible] = useState<boolean>(false);
  const [scriptName, setScriptName] = useState<string>('My Indicator');
  const [selectedTemplate, setSelectedTemplate] = useState<string>('macd');
  const [useSimpleEditor, setUseSimpleEditor] = useState<boolean>(false);

  const handleExecute = (): void => onExecute(code);
  const handleSave = (): void => {
    onSave({
      id: String(Date.now()),
      name: scriptName,
      code,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  };
  const handleTemplateChange = (t: string): void => {
    setSelectedTemplate(t);
    setCode(DEFAULT_PINE_SCRIPTS[t]);
  };
  const handleLoadScript = (script: PineScript): void => {
    setCode(script.code);
    setScriptName(script.name);
    onLoadScript(script);
  };
  const handleEditorDidMount: OnMount = (editor, monaco) => {
    try {
      monaco.languages.register({ id: 'pinescript' });
      const lang: IMonarchLanguage = {
        tokenizer: {
          root: [
            [/\/\/.*$/, 'comment'],
            [/@version=\d+/, 'keyword'],
            [/\b(indicator|strategy|input|plot|ta|close|open|high|low|volume|math|color)\b/, 'keyword'],
            [/\b(int|float|bool|string|if|else|for|while|true|false)\b/, 'keyword'],
            [/\b\d+(\.\d+)?\b/, 'number'],
            [/"([^"\\]|\\.)*$/, 'string.invalid'],
            [/"/, 'string', '@string'],
            [/[{}()\[\]]/, '@brackets'],
            [/[<>!~?:&|+\-*/^%]+/, 'operators'],
          ],
          string: [
            [/[^\\"]+/, 'string'],
            [/"/, 'string', '@pop'],
          ],
        },
      };
      monaco.languages.setMonarchTokensProvider('pinescript', lang);
      monaco.editor.defineTheme('pine-dark', {
        base: 'vs-dark',
        inherit: true,
        rules: [
          { token: 'comment', foreground: '6A9955' },
          { token: 'keyword', foreground: '569CD6' },
          { token: 'number', foreground: 'B5CEA8' },
          { token: 'string', foreground: 'CE9178' },
          { token: 'operators', foreground: 'D4D4D4' },
        ],
        colors: { 'editor.background': '#1E1E1E' },
      });
      monaco.editor.setTheme('pine-dark');
      editor.focus();
    } catch {
      setUseSimpleEditor(true);
    }
  };

  if (!isVisible) {
    return (
      <button
        type="button"
        onClick={() => setIsVisible(true)}
        className="bg-white/10 hover:bg-white/20 text-white font-medium py-2 px-3 rounded-md text-xs border border-white/10"
      >
        Open Pine Editor
      </button>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
      <div className="bg-neutral-950 rounded-xl w-[min(100%,1100px)] h-[min(100%,720px)] flex flex-col border border-white/10 shadow-2xl">
        <div className="flex justify-between items-center p-4 border-b border-white/10">
          <h2 className="text-white text-lg font-semibold">Pine Script Editor</h2>
          <button
            type="button"
            onClick={() => setIsVisible(false)}
            className="text-white/80 hover:text-white text-xl leading-none"
            aria-label="Close editor"
          >
            ✕
          </button>
        </div>
        <div className="flex flex-wrap gap-2 p-4 border-b border-white/10">
          <input
            type="text"
            value={scriptName}
            onChange={(e) => setScriptName(e.target.value)}
            className="bg-black/40 text-white px-3 py-2 rounded border border-white/10 text-sm outline-none"
            placeholder="Script name"
          />
          <select
            value={selectedTemplate}
            onChange={(e) => handleTemplateChange(e.target.value)}
            className="bg-black/40 text-white px-3 py-2 rounded border border-white/10 text-sm outline-none"
          >
            <option value="macd">MACD Template</option>
            <option value="rsi">RSI Template</option>
            <option value="ema">EMA Cross Template</option>
          </select>
          <div className="flex-1" />
          <button
            type="button"
            onClick={() => setUseSimpleEditor((v) => !v)}
            className="bg-white/10 hover:bg-white/20 text-white px-3 py-2 rounded text-xs border border-white/10"
          >
            {useSimpleEditor ? 'Use Monaco' : 'Use Simple'}
          </button>
          <button
            type="button"
            onClick={handleExecute}
            className="bg-green-500/90 hover:bg-green-500 text-white px-3 py-2 rounded text-xs"
          >
            Execute
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="bg-blue-500/90 hover:bg-blue-500 text-white px-3 py-2 rounded text-xs"
          >
            Save
          </button>
        </div>
        <div className="flex-1 flex min-h-0">
          <div className="flex-1 min-w-0">
            {useSimpleEditor ? (
              <SimpleCodeEditor value={code} onChange={setCode} language="pinescript" />
            ) : (
              <MonacoEditor
                height="100%"
                language="pinescript"
                value={code}
                onChange={(v) => setCode(v ?? '')}
                onMount={handleEditorDidMount}
                theme="pine-dark"
                options={{
                  fontSize: 14,
                  minimap: { enabled: false },
                  scrollBeyondLastLine: false,
                  wordWrap: 'on',
                  lineNumbers: 'on',
                  folding: true,
                }}
              />
            )}
          </div>
          <aside className="w-64 bg-black/40 border-l border-white/10 p-4 overflow-auto">
            <h3 className="text-white font-semibold mb-3 text-sm">Saved Scripts</h3>
            <div className="space-y-2">
              {savedScripts.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => handleLoadScript(s)}
                  className="w-full text-left bg-white/5 hover:bg-white/10 p-2 rounded"
                >
                  <div className="text-white text-sm font-medium">{s.name}</div>
                  <div className="text-white/50 text-xs">
                    {s.updatedAt.toLocaleDateString()}
                  </div>
                </button>
              ))}
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

function ChartContainer({
  container,
  layout,
  children,
}: {
  container: HTMLElement;
  layout: DeepPartial<ChartOptions>;
  children: React.ReactNode;
}): JSX.Element | null {
  const [chart, setChart] = useState<IChartApi | null>(null);

  useLayoutEffect(() => {
    if (!container) return undefined;
    const chartInstance = createChart(container, {
      ...layout,
      width: container.clientWidth,
      height: container.clientHeight,
    });
    setChart(chartInstance);
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        chartInstance.applyOptions({
          width: entry.contentRect.width,
          height: entry.contentRect.height,
        });
      }
    });
    ro.observe(container);
    return () => {
      ro.disconnect();
      chartInstance.remove();
      setChart(null);
    };
  }, [container, layout]);

  useEffect(() => {
    if (chart) chart.applyOptions(layout);
  }, [chart, layout]);

  return <ChartContext.Provider value={chart}>{chart ? children : null}</ChartContext.Provider>;
}

function Candles({
  data,
  upColor = '#ffffff',
  downColor = '#000000',
}: {
  data: CandlestickData[];
  upColor?: string;
  downColor?: string;
}): null {
  const chart = useContext(ChartContext);
  const seriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);

  useEffect(() => {
    if (!chart) return undefined;
    const s = chart.addSeries(CandlestickSeries, {
      upColor,
      downColor,
      borderUpColor: '#ffffff',
      borderDownColor: '#ffffff',
      wickUpColor: '#ffffff',
      wickDownColor: '#ffffff',
    });
    seriesRef.current = s;
    s.setData(data);
    chart.timeScale().fitContent();
    return () => {
      if (seriesRef.current) {
        try {
          chart.removeSeries(seriesRef.current);
        } catch {}
        seriesRef.current = null;
      }
    };
  }, [chart, upColor, downColor, data]);

  return null;
}

export function TradingChart({
  colors,
  symbol = 'BINANCE:BTCUSDT',
  timeframe = '1D',
}: TradingChartProps): JSX.Element {
  const {
    backgroundColor = '#000000',
    textColor = '#ffffff',
    upColor = '#ffffff',
    downColor = '#000000',
  } = colors ?? {};

  const chartContainerRef = useRef<HTMLDivElement>(null);
  const [layout, setLayout] = useState<DeepPartial<ChartOptions>>({});
  const [candles, setCandles] = useState<CandlestickData[]>([]);
  const [savedScripts, setSavedScripts] = useState<PineScript[]>([]);
  const [showIndicators, setShowIndicators] = useState<boolean>(true);

  const hook = usePineIndicator(symbol, timeframe) as IndicatorHookResult | null;
  const { data: indicatorData, error: indicatorError, loading } =
    hook ?? { data: null, error: null, loading: false };

  const indicatorSeriesRef = useRef<Record<string, ISeriesApi<'Line'>>>({});

  useEffect(() => {
    try {
      const saved = localStorage.getItem('pine-scripts');
      if (saved) {
        const parsed: PineScript[] = JSON.parse(saved).map((s: PineScript) => ({
          ...s,
          createdAt: new Date(s.createdAt),
          updatedAt: new Date(s.updatedAt),
        }));
        setSavedScripts(parsed);
      }
    } catch {}
  }, []);

  const handleSaveScript = useCallback((script: PineScript) => {
    setSavedScripts((prev) => {
      const next = [...prev, script];
      localStorage.setItem('pine-scripts', JSON.stringify(next));
      return next;
    });
  }, []);

  const handleExecuteScript = useCallback((code: string) => {
    console.log('Pine script to execute:', code);
  }, []);

  const handleLoadScript = useCallback((s: PineScript) => {
    console.log('Loading script:', s.name);
  }, []);

  const colorForName = useCallback((name: string) => {
    let hash = 0;
    for (let i = 0; i < name.length; i += 1) hash = (hash << 5) - hash + name.charCodeAt(i);
    return `hsl(${Math.abs(hash) % 360} 80% 60%)`;
  }, []);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const d = await fetchCandlestickData(symbol, timeframe);
      if (mounted) setCandles(d);
    })();
    return () => {
      mounted = false;
    };
  }, [symbol, timeframe]);

  useEffect(() => {
    const isIntraday = timeframe.includes('m') || timeframe.includes('H');
    setLayout({
      layout: {
        background: { type: ColorType.Solid, color: backgroundColor },
        textColor,
      },
      grid: {
        vertLines: { color: 'rgba(255,255,255,0.06)' },
        horzLines: { color: 'rgba(255,255,255,0.06)' },
      },
      rightPriceScale: { borderColor: 'rgba(255,255,255,0.10)' },
      timeScale: {
        borderColor: 'rgba(255,255,255,0.10)',
        timeVisible: isIntraday,
        secondsVisible: false,
      },
      crosshair: { mode: 1 },
    });
  }, [backgroundColor, textColor, timeframe]);

  const chart = useContext(ChartContext);
  useEffect(() => {
    if (!chart) return;
    const map = indicatorSeriesRef.current;
    if (!indicatorData || Object.keys(indicatorData).length === 0) {
      Object.values(map).forEach((s) => {
        try {
          chart.removeSeries(s);
        } catch {}
      });
      indicatorSeriesRef.current = {};
      return;
    }
    const existing = new Set(Object.keys(map));
    const incoming = new Set(Object.keys(indicatorData));
    existing.forEach((n) => {
      if (!incoming.has(n)) {
        try {
          chart.removeSeries(map[n]);
        } catch {}
        delete map[n];
      }
    });
    Object.entries(indicatorData).forEach(([name, values]) => {
      const formatted = values
        .map((v, i) => {
          const t = candles[i]?.time;
          return t !== undefined ? ({ time: t, value: v } as LineData) : null;
        })
        .filter((x): x is LineData => x !== null);
      if (!map[name]) {
        map[name] = chart.addSeries(LineSeries, {
          color: colorForName(name),
          title: name,
          lineWidth: 1,
          visible: showIndicators,
        });
      } else {
        map[name].applyOptions({ visible: showIndicators });
      }
      map[name].setData(formatted);
    });
  }, [chart, indicatorData, candles, showIndicators, colorForName]);

  const latest = useMemo(() => candles[candles.length - 1], [candles]);

  return (
    <div className="relative h-full w-full">
      <div className="absolute top-2 right-2 z-10 flex items-center gap-2">
        <PineScriptEditor
          onExecute={handleExecuteScript}
          onSave={handleSaveScript}
          savedScripts={savedScripts}
          onLoadScript={handleLoadScript}
        />
        <button
          type="button"
          onClick={() => setShowIndicators((v) => !v)}
          className="bg-white/10 hover:bg-white/20 text-white font-medium py-2 px-3 rounded-md text-xs border border-white/10"
        >
          {showIndicators ? 'Hide Indicators' : 'Show Indicators'}
        </button>
        {loading && (
          <div className="bg-yellow-500/90 text-black px-3 py-2 rounded text-xs font-medium">
            Loading...
          </div>
        )}
        {indicatorError && (
          <div className="bg-red-500/90 text-white px-3 py-2 rounded text-xs max-w-[200px] truncate">
            Error: {indicatorError}
          </div>
        )}
      </div>
      <div ref={chartContainerRef} className="h-full w-full">
        {chartContainerRef.current && (
          <ChartContainer container={chartContainerRef.current} layout={layout}>
            <Candles data={candles} upColor={upColor} downColor={downColor} />
          </ChartContainer>
        )}
      </div>
      <span className="sr-only">
        Latest O:{latest?.open} H:{latest?.high} L:{latest?.low} C:{latest?.close}
      </span>
    </div>
  );
}
