// app/api/pine/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { PineTS, Provider } from 'pinets';

const ALLOWED = new Set([
  '1m','3m','5m','15m','30m',
  '1h','2h','4h','6h','8h','12h',
  '1d','3d','1w','1M'
]);

// Define PineTS context interface based on expected structure
interface PineContext {
  data: {
    close: number[];
    open: number[];
    high: number[];
    low: number[];
    volume: number[];
  };
  ta: {
    rsi: (data: number[], period: number) => number[];
    ema: (data: number[], period: number) => number[];
    sma: (data: number[], period: number) => number[];
    // Add other TA functions as needed
  };
}

type PlotFunction = (data: number | number[], label: string) => void;

// Define the structure of request body
interface PineRequestBody {
  symbol?: string;
  timeframe?: string;
  limit?: number;
}

function sanitizeSymbol(s: string): string {
  return s.includes(':') ? s.split(':').pop() as string : s;
}

function mapTimeframe(tfRaw: string): string {
  const tf = tfRaw.trim();
  // Common aliases
  const alias: Record<string, string> = {
    D: '1d', '1D': '1d',
    W: '1w', '1W': '1w',
    M: '1M'
  };
  if (alias[tf]) return alias[tf];
  // Normalize forms like "15m", "1h", "1d" - Fixed regex escaping
  const t = tf
    .replace(/mins?$/i, 'm')
    .replace(/^(\d+)\s*[mM]$/, '$1m')
    .replace(/^(\d+)\s*[hH]$/, '$1h')
    .replace(/^(\d+)\s*[dD]$/, '$1d')
    .toLowerCase();
  return ALLOWED.has(t) ? t : '1d';
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const body: PineRequestBody = await req.json();
    const { symbol, timeframe, limit = 100 } = body;
    const sym = sanitizeSymbol(String(symbol || 'BTCUSDT'));
    const tf = mapTimeframe(String(timeframe || '1d'));

    // Run on the server to avoid browser CORS problems
    const pine = new PineTS(Provider.Binance, sym, tf, Number(limit) || 100);

    const { plots } = await pine.run((context: PineContext, plot: PlotFunction) => {
      const { close } = context.data;
      const ta = context.ta;

      const rsi = ta.rsi(close, 14);
      const ema = ta.ema(close, 21);

      plot(rsi, 'RSI');
      plot(ema, 'EMA');
    });

    return NextResponse.json({ plots }, { status: 200 });
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Failed to run indicator';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
