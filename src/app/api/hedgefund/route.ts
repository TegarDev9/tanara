import { NextRequest, NextResponse } from 'next/server';
import type { Agent, AgentRecs, AvPrice } from '@/app/api/hedgefund/types';

// --- Helper: Sanitization ---
// Fungsi sanitasi yang lebih kuat untuk membersihkan semua string non-ASCII.
const sanitizeText = (text: string | null | undefined): string => {
  if (!text) return '';
  return text
    .replace(/[\u2010-\u2015]/g, '-')    // Mengganti berbagai jenis tanda hubung/strip
    .replace(/[\u2018\u2019]/g, "'")     // Mengganti kutipan tunggal "pintar"
    .replace(/[\u201C\u201D]/g, '"')     // Mengganti kutipan ganda "pintar"
    .replace(/\u2026/g, '...')       // Mengganti elipsis
    .replace(/\s+/g, ' ')            // Menormalkan spasi putih
    .replace(/[^\x00-\x7F]/g, '');   // Menghapus semua karakter non-ASCII yang tersisa
};

// Fungsi rekursif untuk membersihkan semua nilai string dalam sebuah objek.
function sanitizeObject<T>(obj: T): T {
  if (obj === null || obj === undefined) {
    return obj;
  }
  if (typeof obj === 'string') {
    return sanitizeText(obj) as unknown as T;
  }
  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeObject(item)) as unknown as T;
  }
  if (typeof obj === 'object') {
    const newObj = {} as T;
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        newObj[key] = sanitizeObject(obj[key]);
      }
    }
    return newObj;
  }
  return obj;
}


// FIXED: Karakter em-dash (—) diganti dengan tanda hubung standar (-)
const AGENTS: Agent[] = [
    { key: 'aswath', name: 'Aswath Damodaran Agent', tagline: 'The Dean of Valuation - story, numbers, disciplined valuation', tone: 'valuation-first, balanced' },
    { key: 'ben', name: 'Ben Graham Agent', tagline: 'Godfather of value investing - hidden gems with margin of safety', tone: 'deep value, conservative' },
    { key: 'ackman', name: 'Bill Ackman Agent', tagline: 'Activist investor - bold positions, pushes for change', tone: 'activist, catalyst-driven' },
    { key: 'cathie', name: 'Cathie Wood Agent', tagline: 'Queen of growth - innovation and disruption', tone: 'exponential growth, tech-forward' },
    { key: 'munger', name: 'Charlie Munger Agent', tagline: 'Buys wonderful businesses at fair prices', tone: 'quality focus, mental models' },
    { key: 'burry', name: 'Michael Burry Agent', tagline: 'Contrarian deep value - The Big Short', tone: 'contrarian, tail-risk aware' },
    { key: 'pabrai', name: 'Mohnish Pabrai Agent', tagline: 'Dhandho investor - look for doubles at low risk', tone: 'low-risk high-uncertainty' },
    { key: 'lynch', name: 'Peter Lynch Agent', tagline: 'Seek "ten-baggers" in everyday businesses', tone: 'scuttlebutt, pragmatic growth' },
    { key: 'fisher', name: 'Phil Fisher Agent', tagline: 'Meticulous growth - "scuttlebutt" research', tone: 'quality growth, depth research' },
    { key: 'rakesh', name: 'Rakesh Jhunjhunwala Agent', tagline: 'The Big Bull of India', tone: 'high-conviction, India macro' },
    { key: 'druck', name: 'Stanley Druckenmiller Agent', tagline: 'Macro legend - asymmetric growth bets', tone: 'macro, liquidity-led' },
    { key: 'buffett', name: 'Warren Buffett Agent', tagline: 'Wonderful companies at a fair price', tone: 'moat, ROIC, long-term' },
    { key: 'valuation', name: 'Valuation Agent', tagline: 'Intrinsic value + trading signals', tone: 'DCF/comps rules' },
    { key: 'sentiment', name: 'Sentiment Agent', tagline: 'Market sentiment + signals', tone: 'news/flow/sentiment' },
    { key: 'fundamentals', name: 'Fundamentals Agent', tagline: 'Fundamental data + signals', tone: 'earnings/unit-economics' },
    { key: 'technicals', name: 'Technicals Agent', tagline: 'Technical indicators + signals', tone: 'trend/momentum/RSI' },
    { key: 'risk', name: 'Risk Manager', tagline: 'Risk metrics + limits', tone: 'VaR/drawdown/sizing' },
    { key: 'pm', name: 'Portfolio Manager', tagline: 'Final decisions + orders', tone: 'multi-signal optimizer' },
];

const OPENROUTER_ENDPOINT = 'https://openrouter.ai/api/v1/chat/completions';

async function fetchAlphaVantagePrice(symbol: string): Promise<AvPrice> {
  if (!process.env.ALPHA_VANTAGE_KEY) {
    throw new Error('Alpha Vantage API key not configured');
  }
  const symbolMapping: Record<string, { from: string; to: string }> = {
    'btc': { from: 'BTC', to: 'USD' },
    'eth': { from: 'ETH', to: 'USD' },
  };
  const mapping = symbolMapping[symbol.toLowerCase()];
  if (!mapping) throw new Error(`Unsupported symbol: ${symbol}`);

  const url = `https://www.alphavantage.co/query?function=CURRENCY_EXCHANGE_RATE&from_currency=${mapping.from}&to_currency=${mapping.to}&apikey=${process.env.ALPHA_VANTAGE_KEY}`;
  const response = await fetch(url);
  const data = await response.json();

  const node = data?.['Realtime Currency Exchange Rate'];
  const price = node?.['5. Exchange Rate'] ? parseFloat(node['5. Exchange Rate']) : null;
  return { price, from: mapping.from, to: mapping.to, lastRefreshed: node?.['6. Last Refreshed'] };
}

async function fetchAgentRecommendations(symbol: string): Promise<AgentRecs> {
  if (!process.env.OPENROUTER_API_KEY) {
    throw new Error('OpenRouter API key not configured');
  }

  // Dynamically create the agent mapping to keep the prompt concise
  const agentMapping = AGENTS.reduce((acc, agent) => {
    acc[agent.key as string] = agent.name;
    return acc;
  }, {} as Record<string, string>);

  const systemMessage = `You are a team-of-agents portfolio brain for a hedge fund. Return JSON only under key "agents", with keys as short agent ids and each value containing: stance (bullish|bearish|neutral), thesis (1-2 concise sentences), risk (main risks), timeframe (short|medium|long). Short, non-promissory, investment-research tone; do not include disclaimers. Agent ids mapping: ${JSON.stringify(agentMapping)}`;
  const userMessage = `Task: For ${symbol.toUpperCase()} today, produce per-agent stance, thesis, risk, timeframe.`;

  const response = await fetch(OPENROUTER_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
      'X-Title': 'AI Hedge Fund - Agent Recommendations',
    },
    body: JSON.stringify({
      model: 'openrouter/auto',
      temperature: 0.2,
      max_tokens: 2048, // Limit response tokens to prevent credit issues
      messages: [
        { role: 'system', content: systemMessage },
        { role: 'user', content: userMessage },
      ],
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`OpenRouter error: ${response.status} - ${errorBody}`);
  }

  const json = await response.json();
  let content: string = json?.choices?.[0]?.message?.content || '';
  content = content.replace(/```json/g, '').replace(/```/g, '').trim();
  const parsed = JSON.parse(content);

  if (!parsed.agents) {
    throw new Error('Invalid AI JSON shape: "agents" key is missing');
  }
  // Sanitize the entire object returned by the AI before sending it to the client
  return sanitizeObject(parsed.agents) as AgentRecs;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const symbol = searchParams.get('symbol');
    if (!symbol) {
      return NextResponse.json({ error: 'Symbol parameter is required' }, { status: 400 });
    }

    const [priceRes, aiRes] = await Promise.allSettled([
      fetchAlphaVantagePrice(symbol),
      fetchAgentRecommendations(symbol),
    ]);

    const price = priceRes.status === 'fulfilled' ? priceRes.value : null;
    const agents = aiRes.status === 'fulfilled' ? aiRes.value : null;

    // Ensure all error messages are sanitized
    const priceError = priceRes.status === 'rejected' ? sanitizeText(priceRes.reason.message) : null;
    const aiError = aiRes.status === 'rejected' ? sanitizeText(aiRes.reason.message) : null;

    return NextResponse.json({
      symbol: symbol.toUpperCase(),
      price: { data: price, error: priceError },
      agents: { data: agents, error: aiError },
      meta: { timestamp: new Date().toISOString(), agents: AGENTS },
    });
  } catch (err) {
    console.error('API Error:', err);
    const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
    return NextResponse.json(
      { error: 'Internal server error', details: sanitizeText(errorMessage) },
      { status: 500 }
    );
  }
}
