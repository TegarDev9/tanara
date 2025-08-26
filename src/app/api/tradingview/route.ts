import { NextResponse } from 'next/server';
// Reverting import to default as suggested by TS error and example repo


// Define interfaces for better type safety
interface TVBar {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}



// Function to create a mock bar (used if TradingView client fails or for initial seeding)
function createMockBar(prev: TVBar | undefined, price: number, volume?: number): TVBar {
  const now = Math.floor(Date.now() / 1000);
  if (!prev) return { time: now, open: price, high: price, low: price, close: price, volume: volume ?? 0 };
  return {
    time: now,
    open: prev.open,
    high: Math.max(prev.high, price),
    low: Math.min(prev.low, price),
    close: price,
    volume: (prev.volume ?? 0) + (volume ?? 0),
  };
}

// Function to fetch historical data from TradingView
async function fetchHistoricalData(symbol: string, timeframe: string): Promise<TVBar[] | null> {
  console.log(`Mocking initial data for ${symbol} (${timeframe})`);
  // Mocking data as @mathieuc/tradingview might not have a direct historical fetch API.
  // The Chart.tsx component expects a single bar for initial render.
  const mockPrice = 100 + Math.random() * 100;
  const mockBar: TVBar = createMockBar(undefined, mockPrice, 1000);
  return [mockBar]; // Return a single mock bar as a snapshot
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const symbol = searchParams.get('symbol');
  const timeframe = searchParams.get('timeframe');

  if (!symbol || !timeframe) {
    return NextResponse.json({ error: 'Symbol and timeframe are required' }, { status: 400 });
  }

  const historicalData = await fetchHistoricalData(symbol, timeframe);

  if (historicalData && historicalData.length > 0) {
    // The Chart.tsx component expects a single bar for initial render.
    // We'll return the first bar from our fetched/mocked data.
    const firstBar = historicalData[0];
    return NextResponse.json({
      timestamp: firstBar.time,
      open: firstBar.open,
      high: firstBar.high,
      low: firstBar.low,
      close: firstBar.close,
      volume: firstBar.volume,
    });
  } else {
    return NextResponse.json({ error: 'Could not fetch initial chart data' }, { status: 500 });
  }
}
