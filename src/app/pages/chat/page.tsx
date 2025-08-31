'use client';

import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
  SVGProps,
} from 'react';
import {
  Send,
  TrendingUp,
  Clock,
  BarChart3,
  Target,
  Shield,
  AlertTriangle,
  Zap,
  BatteryFull,
  BatteryMedium,
  BatteryLow,
  BatteryWarning,
  Scan,
} from 'lucide-react';
import ScannerAiMobile from '../../../components/ScannerPopup';

type Sender = 'user' | 'bot';

interface TradingAnalysis {
  symbol: string;
  timeframe: string;
  marketStructure: string;
  bias: string;
  killzone: string;
  currentZone: string;
  candlestickPattern: string;
  choch: string;
  bos: string;
  liquidity: string;
  risk: 'Low' | 'Medium' | 'High';
  tradeRecommendation: {
    style: 'Scalping' | 'Day Trading' | 'Swing Trading' | 'Position Trading';
    entry: string;
    stopLoss: string;
    takeProfit: string;
    rr: '1:1' | '1:2' | '1:3';
  };
  confidence: number;
  marketCondition: string;
  volume: string;
  momentum: string;
}

interface Message {
  id: string;
  sender: Sender;
  text: string;
  timestamp: number;
  analysis?: TradingAnalysis;
}

interface TradingCardProps {
  data: TradingAnalysis;
}

const initialGreeting: Message = {
  id: 'greet-1',
  sender: 'bot',
  text: 'Halo! 👋 Selamat datang di Trading Chat. Ketuk BTC 🚀 untuk mendapatkan analisis cepat, atau ketik pertanyaan apa pun.',
  timestamp: Date.now(),
};

const SettingsIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
    {...props}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.646.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.24-.438.613-.43.992a6.759 6.759 0 0 1 0 1.257c-.008.379.137.75.43.99l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.333.184-.582.496-.646.87l-.212 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.646-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.759 6.759 0 0 1 0-1.257c.008-.379-.137-.75-.43-.99l-1.004-.828a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.49l1.217.456c.354.133.75.072 1.075-.124.072-.044.146-.087.22-.128.332-.184.582-.496.646-.87l.212-1.281Z"
    />
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
    />
  </svg>
);

const CloseIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
    {...props}
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
  </svg>
);

const BatteryIcon = ({ usageCount }: { usageCount: number }) => {
  const pct = (usageCount / 5) * 100;
  if (pct > 75) return <BatteryFull className="w-5 h-5 text-neutral-400" />;
  if (pct > 50) return <BatteryMedium className="w-5 h-5 text-neutral-400" />;
  if (pct > 25) return <BatteryLow className="w-5 h-5 text-neutral-400" />;
  return <BatteryWarning className="w-5 h-5 text-red-500" />;
};

const InfoTile = ({
  icon,
  title,
  value,
  accent,
}: {
  icon: React.ReactNode;
  title: string;
  value: string;
  accent?: string;
}) => (
  <div className="rounded-xl bg-white/5 backdrop-blur-sm border border-white/10 p-3">
    <div className="flex items-center gap-2 mb-1">
      {icon}
      <span className="text-[11px] text-white/60">{title}</span>
    </div>
    <div className={['text-sm font-semibold', accent ?? 'text-white'].join(' ')}>
      {value}
    </div>
  </div>
);

const KeyRow = ({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color?: string;
}) => (
  <div className="flex justify-between items-center bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-2 text-xs">
    <span className="text-white/60">{label}</span>
    <span className={['font-mono font-semibold', color ?? 'text-white'].join(' ')}>
      {value}
    </span>
  </div>
);

function TradingCard({ data }: TradingCardProps) {
  return (
    <div className="mt-4 rounded-2xl overflow-hidden shadow-2xl border border-white/10 bg-white/5 backdrop-blur-xl">
      <div className="flex justify-between items-center px-4 py-3 bg-gradient-to-r from-white/5 to-transparent border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-emerald-500/20 border border-emerald-500/30">
            <TrendingUp className="w-4 h-4 text-emerald-400" />
          </div>
          <div>
            <div className="text-sm font-bold text-white">{data.symbol}</div>
            <div className="text-xs text-white/60">
              {data.timeframe} • {data.marketCondition}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs px-2 py-1 rounded-full bg-emerald-500/20 text-emerald-400 font-bold border border-emerald-500/30">
            {data.tradeRecommendation.rr}
          </span>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
            <span className="text-xs text-white/60">{data.confidence}%</span>
          </div>
        </div>
      </div>
      <div className="p-4 space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <InfoTile
            icon={<Clock className="w-4 h-4 text-sky-400" />}
            title="Time Frame"
            value={data.timeframe}
          />
          <InfoTile
            icon={<BarChart3 className="w-4 h-4 text-violet-400" />}
            title="Structure"
            value={data.marketStructure}
          />
          <InfoTile
            icon={<Target className="w-4 h-4 text-yellow-400" />}
            title="Bias"
            value={data.bias}
            accent="text-emerald-400"
          />
          <InfoTile
            icon={<Zap className="w-4 h-4 text-orange-400" />}
            title="Volume"
            value={data.volume}
          />
        </div>
        <div className="space-y-2">
          <KeyRow label="Current Zone" value={data.currentZone} color="text-sky-400" />
          <KeyRow label="Pattern" value={data.candlestickPattern} color="text-emerald-400" />
          <KeyRow label="Momentum" value={data.momentum} color="text-yellow-400" />
          <KeyRow label="CHoCH" value={data.choch} />
          <KeyRow label="BOS" value={data.bos} />
          <KeyRow label="Liquidity" value={data.liquidity} color="text-violet-400" />
        </div>
        <div className="mt-4 p-4 bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl space-y-3">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-emerald-400" />
            <span className="text-sm font-bold text-white">Trade Setup</span>
          </div>
          <div className="grid grid-cols-2 gap-3 text-xs font-mono">
            <div className="space-y-2">
              <div className="flex justify-between items-center p-2 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
                <span className="text-white/60">Entry</span>
                <span className="text-emerald-400 font-bold">${data.tradeRecommendation.entry}</span>
              </div>
              <div className="flex justify-between items-center p-2 bg-red-500/10 border border-red-500/20 rounded-lg">
                <span className="text-white/60">SL</span>
                <span className="text-red-400 font-bold">${data.tradeRecommendation.stopLoss}</span>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between items-center p-2 bg-green-500/10 border border-green-500/20 rounded-lg">
                <span className="text-white/60">TP</span>
                <span className="text-green-400 font-bold">${data.tradeRecommendation.takeProfit}</span>
              </div>
              <div className="flex justify-between items-center p-2 bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg">
                <span className="text-white/60">Style</span>
                <span className="text-white font-semibold">{data.tradeRecommendation.style}</span>
              </div>
            </div>
          </div>
          <div className="flex justify-between items-center p-2 bg-amber-500/10 border border-amber-500/20 rounded-lg">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              <span className="text-xs text-white/80">Risk:</span>
            </div>
            <span className="text-xs font-bold text-amber-400">{data.risk}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

const symbols = [
  'btc',
  'eth',
  'bnb',
  'sol',
  'ada',
  'dot',
  'avax',
  'matic',
  'link',
  'uni',
];

const tradingKeywords = [
  'analisis',
  'analysis',
  'trading',
  'chart',
  'technical',
  'price',
  'trend',
  'support',
  'resistance',
  'entry',
  'exit',
  'target',
  'forecast',
  'prediction',
  'bullish',
  'bearish',
  'pattern',
  'signal',
  'breakout',
  'breakdown',
];

const isTradingQuery = (q: string) => {
  const lower = q.toLowerCase();
  const foundSym = symbols.find((s) => lower.includes(s));
  const hasKey = tradingKeywords.some((k) => lower.includes(k));
  return { isTrading: Boolean(foundSym) || hasKey, symbol: foundSym || 'btc' };
};

const createAdvancedTradingPrompt = (q: string, sym: string) => {
  return `
SYSTEM: Anda adalah AI Trading Analyst Expert.

TASK: Buat analisis trading comprehensive dalam JSON:
{
  "symbol": "${sym.toUpperCase()}/USDT",
  "timeframe": "1H|4H|1D|1W",
  "marketStructure": "",
  "bias": "",
  "killzone": "",
  "currentZone": "",
  "candlestickPattern": "",
  "choch": "",
  "bos": "",
  "liquidity": "",
  "risk": "Low|Medium|High",
  "tradeRecommendation": {
    "style": "",
    "entry": "",
    "stopLoss": "",
    "takeProfit": "",
    "rr": "1:1|1:2|1:3"
  },
  "confidence": 0,
  "marketCondition": "",
  "volume": "",
  "momentum": ""
}
GUIDELINES:
- JSON valid only.
- Gunakan price realistis.
- Berikan reasoning singkat dalam setiap field.
Query: "${q}"
`;
};

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([initialGreeting]);
  const [usageCount, setUsageCount] = useState(5);
  const [input, setInput] = useState('');
  const listRef = useRef<HTMLDivElement>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const availableModels = useMemo(
    () => [
      'agentica-org/deepcoder-14b-preview',
      'deepseek/deepseek-r1-0528-qwen3-8b',
      'deepseek/deepseek-r1',
      'google/gemini-2.5-pro-exp-03-25',
      'google/gemma-3-12b-it',
      'google/gemma-3-27b-it',
      'google/gemma-3-4b-it',
      'google/gemma-3n-2b-it',
      'google/gemma-3n-4b-it',
      'google/gemma-3n-e2b-it',
      'google/gemma-3n-e4b-it',
      'huggingfaceh4/zephyr-7b-beta',
      'meta-llama/llama-3.1-405b-instruct',
      'meta-llama/llama-3.2-3b-instruct',
      'meta-llama/llama-3.3-70b-instruct',
      'meta-llama/llama-3.3-8b-instruct',
      'meta-llama/llama-4-maverick',
      'meta-llama/llama-4-scout',
      'microsoft/mai-ds-r1',
      'mistralai/devstral-small-2505',
      'mistralai/mistral-7b-instruct',
      'mistralai/mistral-small-3.2-24b',
      'moonshotai/kimi-dev-72b',
      'moonshotai/kimi-vl-a3b-thinking',
      'nousresearch/deephermes-3-llama-3-8b-preview',
      'openrouter/cypher-alpha',
      'sarvamai/sarvam-m',
      'tencent/hunyuan-a13b-instruct',
      'tngtech/deepseek-r1t-chimera',
      'tngtech/deepseek-r1t2-chimera',
      'venice/uncensored',
      'z-ai/glm-4.5-air',
    ],
    []
  );
  const [selectedModel, setSelectedModel] = useState(availableModels[0]);

  useEffect(() => {
    listRef.current?.scrollTo({
      top: listRef.current.scrollHeight,
      behavior: 'smooth',
    });
  }, [messages.length]);

  const formatTime = (t: number) =>
    new Date(t).toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });

  const pushUser = (text: string) => {
    setMessages((p) => [
      ...p,
      { id: `u-${Date.now()}`, sender: 'user', text, timestamp: Date.now() },
    ]);
  };
  const pushBot = (text: string, analysis?: TradingAnalysis) => {
    setMessages((p) => [
      ...p,
      { id: `b-${Date.now()}`, sender: 'bot', text, timestamp: Date.now(), analysis },
    ]);
  };

  const toggleSettingsPopup = () => setIsSettingsOpen((v) => !v);
  const toggleScanner = () => setIsScannerOpen((v) => !v);

  const handleSend = async () => {
    if (!input.trim() || usageCount <= 0) return;
    const q = input.trim();
    setInput('');
    pushUser(q);
    setUsageCount((v) => v - 1);

    const { isTrading, symbol } = isTradingQuery(q);
    if (isTrading) {
      pushBot('🔄 Menganalisis data market...', undefined);
      try {
        const prompt = createAdvancedTradingPrompt(q, symbol);
        const res = await fetch('/api/llm/openrouter/generate_conten_chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            prompt,
            model: selectedModel,
            temperature: 0.2,
            max_tokens: 2000,
          }),
        });
        const data = await res.json();
        try {
          let jsonString = data.text || '';
          if (jsonString.includes('```json')) {
            jsonString = jsonString.split('```json')[1].split('```')[0];
          }
          const analysisData: TradingAnalysis = JSON.parse(jsonString);
          pushBot(`🚀 Analisis ${analysisData.symbol} selesai!`, analysisData);
        } catch (e) {
          console.error("Parsing error:", e);
          console.error("Original text:", data.text);
          pushBot('⚠️ Parsing gagal, menampilkan fallback analysis', undefined);
        }
      } catch (error) {
        console.error('API error:', error);
        pushBot('⚠️ API error, menampilkan fallback analysis', undefined);
      }
    } else {
      try {
        const res = await fetch('/api/llm/openrouter/generate_conten_chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt: q, model: selectedModel }),
        });
        const data = await res.json();
        pushBot(data.text || 'Maaf, respons tidak valid');
      } catch (error) {
        console.error('Network error:', error);
        pushBot('⚠️ Jaringan error');
      }
    }
  };

  return (
    <div className="min-h-screen max-w-md mx-auto bg-black text-white flex flex-col">
      <header className="sticky top-0 z-20 bg-black/80 backdrop-blur border-b border-white/10">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2 text-sm text-white/60">
            <BatteryIcon usageCount={usageCount} />
            <span>{usageCount} / 5</span>
          </div>
          <button
            onClick={toggleSettingsPopup}
            className="p-2 rounded-full hover:bg-white/10 transition"
          >
            <SettingsIcon className="w-5 h-5 text-white" />
          </button>
        </div>
      </header>

      {isSettingsOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-30">
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl p-8 w-full max-w-lg">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-white">Pengaturan</h2>
              <button
                onClick={toggleSettingsPopup}
                className="p-3 rounded-xl bg-white/5 border border-white/10 text-white/70 hover:bg-white/10 transition"
              >
                <CloseIcon className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <label className="block text-sm font-semibold text-white/80 uppercase tracking-wide">
                Model AI Chat
              </label>
              <select
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value)}
                className="w-full bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/50 focus:outline-none"
              >
                {availableModels.map((m) => (
                  <option key={m} value={m} className="bg-neutral-900 text-white">
                    {m}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}

      <div
        ref={listRef}
        className="flex-1 overflow-y-auto px-4 py-4 space-y-3 scrollbar-thin scrollbar-thumb-white/20"
      >
        {messages.map((m) => (
          <div
            key={m.id}
            className={`flex ${
              m.sender === 'user' ? 'justify-end' : 'justify-start'
            }`}
          >
            <div
              className={[
                'max-w-[85%] p-4 rounded-2xl shadow-sm',
                m.sender === 'user'
                  ? 'bg-white text-black rounded-br-md'
                  : 'bg-white/5 text-white rounded-bl-md border border-white/10',
              ].join(' ')}
            >
              <div className="whitespace-pre-wrap">{m.text}</div>
              <div className="mt-1 text-[10px] text-white/50">
                {formatTime(m.timestamp)}
              </div>
              {m.analysis && <TradingCard data={m.analysis} />}
            </div>
          </div>
        ))}
      </div>

      <footer className="sticky bottom-0 z-20 bg-black/80 backdrop-blur border-t border-white/10">
        <div className="flex items-center gap-3 px-4 py-3">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder={usageCount <= 0 ? 'Batas penggunaan tercapai' : 'Tulis pesan… ✍️'}
            disabled={usageCount <= 0}
            className="flex-1 bg-white/5 backdrop-blur-sm text-white placeholder-white/40 rounded-2xl px-4 py-3 border border-white/10 focus:outline-none"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || usageCount <= 0}
            className="p-3 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 text-white hover:bg-white/20 active:scale-95 transition"
          >
            <Send className="w-5 h-5" />
          </button>
          <button
            onClick={toggleScanner}
            className="p-3 rounded-xl bg-white/5 border border-white/15 text-white/80 hover:bg-white/10 transition"
          >
            <Scan className="w-5 h-5" />
          </button>
        </div>
      </footer>

      {isScannerOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-30">
          <ScannerAiMobile onClose={toggleScanner} />
        </div>
      )}
    </div>
  );
}
