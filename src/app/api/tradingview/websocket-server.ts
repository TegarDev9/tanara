import { WebSocketServer, WebSocket } from 'ws';
import { Time } from 'lightweight-charts';

// Define interfaces for better type safety
interface TVBar {
  time: Time;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

// Interface for incoming WebSocket messages
interface WebSocketMessage {
  type: 'subscribe' | 'unsubscribe' | 'snapshot' | 'update'; // Add other types as needed
  symbol?: string;
  timeframe?: string;
  bar?: TVBar;
}

// Mock data generation and management
const lastBars = new Map<string, TVBar>(); // key(symbol|tf) -> last bar
const activeSubscriptions = new Map<WebSocket, { symbol: string; timeframe: string }>();

const PORT = Number(process.env.WS_SERVER_PORT || 3001);
const wss = new WebSocketServer({ port: PORT });

function key(symbol: string, timeframe: string): string {
  return `${symbol}|${timeframe}`;
}


function nextMockBar(prev: TVBar): TVBar {
  const drift = (Math.random() - 0.5) * 2; // Random drift between -1 and 1
  const close = Math.max(1, prev.close + drift);
  const high = Math.max(close, prev.high, prev.close + Math.random() * 2); // Random increase for high
  const low = Math.min(close, prev.low, prev.close - Math.random() * 2); // Random decrease for low
  const volume = Math.round(prev.volume * (0.8 + Math.random() * 0.4)); // Random volume change
  return { ...prev, time: Math.floor(Date.now() / 1000) as Time, close, high, low, volume };
}

function seedMockData(symbol: string, timeframe: string) {
  const k = key(symbol, timeframe);
  const t = Math.floor(Date.now() / 1000) as Time;
  const initialPrice = 100 + Math.random() * 100;
  lastBars.set(k, { time: t, open: initialPrice, high: initialPrice, low: initialPrice, close: initialPrice, volume: 500 });
}

// WebSocket server logic
wss.on('connection', (ws) => {
  console.log('Client connected');

  ws.on('message', async (buf) => {
    let msg: WebSocketMessage; // Use the defined interface
    try {
      msg = JSON.parse(buf.toString());
    } catch (e) {
      console.error('Failed to parse message:', e);
      return;
    }

    if (msg.type === 'subscribe') {
      const { symbol, timeframe } = msg;
      const k = key(symbol!, timeframe!); // Use non-null assertion as these are expected

      // Store subscription for this client
      activeSubscriptions.set(ws, { symbol: symbol!, timeframe: timeframe! });
      console.log(`Client subscribed to ${symbol} (${timeframe})`);

      // Seed mock data if not already present
      if (!lastBars.has(k)) {
        seedMockData(symbol!, timeframe!);
      }

      // Send initial snapshot
      const initialBar = lastBars.get(k);
      if (initialBar && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'snapshot', symbol, timeframe, bar: initialBar }));
      }
    } else if (msg.type === 'unsubscribe') {
      const { symbol, timeframe } = msg;
      activeSubscriptions.delete(ws);
      // Optionally, you might want to stop sending data for this symbol if no clients are subscribed
      console.log(`Client unsubscribed from ${symbol} (${timeframe})`);
    }
  });

  ws.on('close', () => {
    activeSubscriptions.delete(ws);
    console.log('Client disconnected');
  });

  ws.on('error', (err: Error) => {
    console.error('WebSocket error:', err);
    activeSubscriptions.delete(ws);
  });
});

// Mock data update interval
setInterval(() => {
  activeSubscriptions.forEach((sub, ws) => {
    const k = key(sub.symbol, sub.timeframe);
    const prev = lastBars.get(k);
    if (prev) {
      const curr = nextMockBar(prev);
      lastBars.set(k, curr);

      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'update', symbol: sub.symbol, timeframe: sub.timeframe, bar: curr }));
      }
    }
  });
}, 2000); // Update every 2 seconds

// Startup message
console.log(`Starting TradingView WS bridge on ws://localhost:${PORT}`);
console.log(`Listening on ws://localhost:${PORT}`);

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('Shutting down...');
  wss.close(() => {
    console.log('WebSocket server closed.');
    process.exit(0);
  });
});
