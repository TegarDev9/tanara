'use client';

import React, { useEffect, useMemo, useRef, useState, SVGProps } from 'react';
import {
  Send, Bitcoin, TrendingUp, Clock, BarChart3, Target, Shield,
  AlertTriangle, Zap, Sparkles, BatteryFull, BatteryMedium, BatteryLow, BatteryWarning, Scan
} from 'lucide-react';

import ScannerAiMobile from '../../../components/ScannerPopup' // Assuming ScannerAiMobile is exported from ScannerPopup

// Tipe Data
type Sender = 'user' | 'bot';

interface Message {
  id: string;
  sender: Sender;
  text: string;
  timestamp: number;
  analysis?: TradingAnalysis;
}

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
    rr: '1:2' | '1:1' | '1:3';
  };
}

// Data Awal
const initialGreeting: Message = {
  id: 'greet-1',
  sender: 'bot',
  text: 'Halo! 👋 Selamat datang di Trading Chat. Ketuk BTC 🚀 untuk mendapatkan analisis cepat, atau ketik pertanyaan apa pun.',
  timestamp: Date.now(),
};

// Komponen Ikon SVG
const SettingsIcon = (props: SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.646.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.24-.438.613-.43.992a6.759 6.759 0 0 1 0 1.257c-.008.379.137.75.43.99l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.333.184-.582.496-.646.87l-.212 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.646-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.759 6.759 0 0 1 0-1.257c.008-.379-.137-.75-.43-.99l-1.004-.828a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.49l1.217.456c.354.133.75.072 1.075-.124.072-.044.146-.087.22-.128.332-.184.582-.496.646-.87l.212-1.281Z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
    </svg>
);

const CloseIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
  </svg>
);

const BatteryIcon = ({ usageCount }: { usageCount: number }) => {
    const percentage = (usageCount / 5) * 100;
    if (percentage > 75) return <BatteryFull className="w-5 h-5 text-neutral-400" />;
    if (percentage > 50) return <BatteryMedium className="w-5 h-5 text-neutral-400" />;
    if (percentage > 25) return <BatteryLow className="w-5 h-5 text-neutral-400" />;
    return <BatteryWarning className="w-5 h-5 text-red-500" />;
};

// Komponen Ikon Scan
const ScanButton = ({ onClick }: { onClick: () => void }) => (
  <button
    onClick={onClick}
    className="p-3 rounded-full bg-white text-black hover:opacity-90 active:opacity-80 transition disabled:opacity-50 ml-auto"
    aria-label="Scan"
  >
    <Scan className="w-5 h-5" />
  </button>
);


// Komponen Pembantu (UI)
function Chip({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <button className="shrink-0 inline-flex items-center gap-2 text-xs px-3 py-2 rounded-full bg-neutral-900 border border-neutral-800 hover:border-white transition">
      {icon}
      <span>{label}</span>
    </button>
  );
}

// Define props for InfoTile (model selection props removed)
interface InfoTileProps {
  icon: React.ReactNode;
  title: string;
  value: string;
  accent?: string;
}

function InfoTile({
  icon,
  title,
  value,
  accent,
}: InfoTileProps) {
  return (
    <div className="rounded-xl bg-neutral-950 border border-neutral-800 px-3 py-2">
      <div className="flex items-center gap-2 mb-0.5">
        {icon}
        <span className="text-[11px] text-neutral-400">{title}</span>
      </div>
      {/* Model Selection UI removed from here */}
      <div className={['text-sm font-semibold', accent ?? 'text-white'].join(' ')}>{value}</div>
    </div>
  );
}

function KeyRow({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div className="rounded-lg bg-neutral-950 border border-neutral-800 px-3 py-2">
      <span className="text-[11px] text-neutral-400">{label}:</span>{' '}
      <span className={['text-sm font-semibold', color ?? 'text-white'].join(' ')}>{value}</span>
    </div>
  );
}


interface TradingCardProps {
  data: TradingAnalysis;
}

function TradingCard({ data }: TradingCardProps) {
  return (
    <div className="mt-3 rounded-2xl border border-neutral-800 bg-black">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-emerald-400" />
          <span className="text-sm font-semibold">{data.symbol}</span>
        </div>
        <span className="text-[11px] px-2 py-1 rounded-full bg-white text-black font-bold">{data.tradeRecommendation.rr}</span>
      </div>

      {/* Grid highlights */}
      <div className="px-3 pb-3">
        <div className="grid grid-cols-2 gap-2">
          {/* Model selection props are no longer passed to InfoTile */}
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
            title="Killzone"
            value={data.killzone}
          />
        </div>

        <div className="mt-2 space-y-1.5">
          <KeyRow label="Current Zone" value={data.currentZone} color="text-sky-400" />
          <KeyRow label="Pattern" value={data.candlestickPattern} color="text-emerald-400" />
          <KeyRow label="CHoCH" value={data.choch} />
          <KeyRow label="BOS" value={data.bos} />
          <KeyRow label="Liquidity" value={data.liquidity} color="text-violet-400" />
        </div>

        {/* Trade block */}
        <div className="mt-3 rounded-xl border border-neutral-800 bg-neutral-950 p-3">
          <div className="flex items-center gap-2 mb-1.5">
            <Shield className="w-4 h-4 text-emerald-400" />
            <span className="text-sm font-semibold">Trade Rekomendasi</span>
          </div>
          <div className="text-xs font-mono leading-relaxed">
            <div>Gaya: {data.tradeRecommendation.style}</div>
            <div>Entry: {data.tradeRecommendation.entry}</div>
            <div>SL: {data.tradeRecommendation.stopLoss}</div>
            <div>TP: {data.tradeRecommendation.takeProfit}</div>
            <div className="mt-1 inline-flex items-center gap-1">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
              <span>Risiko: {data.risk}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


// Komponen Utama
export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([initialGreeting]);
  const [usageCount, setUsageCount] = useState(5);
  const [input, setInput] = useState('');
  const listRef = useRef<HTMLDivElement>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false); // State to control scanner visibility
  
  // State and handler for model selection
  const availableModels = useMemo(() => ['GPT-4o', 'Claude 3 Opus', 'Gemini Pro', 'Mistral Large'], []);
  const [selectedModel, setSelectedModel] = useState(availableModels[0]);
  const handleModelChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedModel(event.target.value);
  };

  const toggleSettingsPopup = () => setIsSettingsOpen(!isSettingsOpen);
  const toggleScanner = () => setIsScannerOpen(!isScannerOpen); // Function to toggle scanner

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages.length]);

  const formatTime = (t: number) =>
    new Date(t).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', hour12: false });

  const pushUser = (text: string) => {
    setMessages(prev => [...prev, { id: `u-${Date.now()}`, sender: 'user', text, timestamp: Date.now() }]);
  };

  const pushBot = (text: string, analysis?: TradingAnalysis) => {
    setMessages(prev => [...prev, { id: `b-${Date.now()}`, sender: 'bot', text, timestamp: Date.now(), analysis }]);
  };

  const handleSend = async () => { // Make it async to use fetch
    if (!input.trim() || usageCount <= 0) return;
    const q = input.trim();
    setInput('');
    pushUser(q);
    setUsageCount(prev => prev - 1);

    try {
      const response = await fetch('/api/llm/openrouter/generate_conten_chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: q,
          model: selectedModel, // Use the selected model from state
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('API Error:', errorData);
        pushBot(`Maaf, terjadi kesalahan saat memproses permintaan Anda: ${errorData.error || response.statusText}`, undefined);
        return;
      }

      const data = await response.json();
      if (data.text) {
        pushBot(data.text, undefined); // Display the bot's response
      } else {
        pushBot('Maaf, saya tidak dapat menghasilkan respons yang valid.', undefined);
      }

    } catch (error) {
      console.error('Error sending message to API:', error);
      pushBot('Maaf, terjadi kesalahan jaringan atau server.', undefined);
    }
  };

  const btcAnalysis: TradingAnalysis = useMemo(
    () => ({
      symbol: 'BTC/USDT',
      timeframe: '4H',
      marketStructure: 'Bullish structure dengan HL → HH beruntun',
      bias: 'Long (pro-trend)',
      killzone: 'London Session (08:00–11:00 UTC) & New York Open (13:30–15:30 UTC)',
      currentZone: 'Premium zone mendekati resistance intraday',
      candlestickPattern: 'Bullish Engulfing + minor pullback (continuation)',
      choch: 'CHoCH naik terkonfirmasi di sekitar 67,800',
      bos: 'BOS ke atas di kisaran 68,200 memvalidasi HH',
      liquidity: 'Liquidity grab di 66,500 (equal lows tersapu, re-accumulation)',
      risk: 'Medium',
      tradeRecommendation: {
        style: 'Day Trading',
        entry: '67,900',
        stopLoss: '66,800',
        takeProfit: '70,100',
        rr: '1:2',
      },
    }),
    []
  );

  const onClickBTC = () => {
    if (usageCount <= 0) return;
    pushUser('BTC 📊');
    setUsageCount(prev => prev - 1);
    pushBot('Berikut analisis cepat BTC! 🚀', btcAnalysis);
  };

  return (
    <div className="min-h-screen max-w-md mx-auto bg-black text-white flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-black/80 backdrop-blur border-b border-neutral-800">
        <div className="px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-neutral-400">
            <BatteryIcon usageCount={usageCount} />
            <span>{usageCount} / 5</span>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={onClickBTC}
              disabled={usageCount <= 0}
              className="inline-flex items-center gap-2 rounded-full bg-white text-black px-3 py-1.5 text-sm font-semibold hover:opacity-90 active:opacity-80 transition disabled:opacity-50"
            >
              <Bitcoin className="w-4 h-4" />
              BTC
            </button>
          </div>

          <div className="flex items-center">
            <button
              onClick={toggleSettingsPopup}
              className="p-2 rounded-full hover:bg-neutral-800 transition"
              aria-label="Settings"
            >
              <SettingsIcon className="w-5 h-5 text-white" />
            </button>
          </div>
        </div>
      </header>

      {/* Settings Popup */}
      {isSettingsOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-30 p-4">
          <div className="bg-neutral-900 border border-neutral-800 text-white rounded-xl shadow-2xl p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-semibold text-white">Pengaturan</h2>
              <button onClick={toggleSettingsPopup} className="p-2 rounded-full text-neutral-400 hover:bg-neutral-700/60 hover:text-white transition-colors" aria-label="Close settings">
                <CloseIcon className="w-6 h-6"/>
              </button>
            </div>

            {/* Quick chips */}
            <div className="flex items-center gap-2 mt-3 overflow-x-auto no-scrollbar">
              <Chip icon={<TrendingUp className="w-4 h-4" />} label="Market Analysis 📊" />
              <Chip icon={<Sparkles className="w-4 h-4" />} label="Pattern Scanner ✨" />
              <Chip icon={<Zap className="w-4 h-4" />} label="Signals ⚡" />
              <Chip icon={<Shield className="w-4 h-4" />} label="Risk Calc 🛡️" />
            </div>
            {/* Model Selection UI moved to Settings */}
            <div className="mt-6">
              <label htmlFor="model-select-settings" className="block text-sm font-medium text-neutral-300 mb-2">
                Pilih Model AI Chat
              </label>
              <select
                id="model-select-settings"
                value={selectedModel}
                onChange={handleModelChange}
                className="w-full px-3 py-2 rounded-lg bg-neutral-900 border border-neutral-800 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {availableModels.map((model) => (
                  <option key={model} value={model}>
                    {model}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Messages */}
      <div ref={listRef} className="flex-1 overflow-y-auto px-3 py-4 space-y-3">
        {messages.map((m) => (
          <div key={m.id} className={`flex ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={[
                'max-w-[85%] px-4 py-3 rounded-2xl shadow-sm',
                m.sender === 'user'
                  ? 'bg-white text-black rounded-br-md'
                  : 'bg-neutral-900 text-white rounded-bl-md border border-neutral-800',
              ].join(' ')}
            >
              <p className="text-sm leading-relaxed whitespace-pre-wrap">{m.text}</p>
              <div className="mt-1 text-[10px] opacity-60">{formatTime(m.timestamp)}</div>

              {m.analysis && (
                <TradingCard
                  data={m.analysis}
                  // Model selection props are no longer passed here
                />
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Composer */}
      <footer className="sticky bottom-0 z-20 border-t border-neutral-800 bg-black/80 backdrop-blur">
        <div className="px-3 py-3">
          <div className="flex items-center gap-2">
            {/* Input field */}
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder={usageCount <= 0 ? "Batas penggunaan tercapai" : "Tulis pesan… ✍️"}
              disabled={usageCount <= 0}
              className="flex-1 bg-neutral-900 text-white placeholder:text-neutral-400 rounded-full px-4 py-3 text-sm outline-none border border-neutral-800 focus:border-white transition disabled:opacity-50"
            />
            {/* Send button */}
            <button
              onClick={handleSend}
              disabled={!input.trim() || usageCount <= 0}
              className="p-3 rounded-full bg-white text-black hover:opacity-90 active:opacity-80 transition disabled:opacity-50"
              aria-label="Kirim"
            >
              <Send className="w-5 h-5" />
            </button>
            {/* Scan button moved to the right */}
            <ScanButton onClick={toggleScanner} /> {/* ml-auto is already on ScanButton */}
          </div>
        </div>
      </footer>

      {/* Scanner Popup */}
      {isScannerOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-30 p-4">
<ScannerAiMobile /> {/* Pass toggleScanner as onClose prop */}
        </div>
      )}
    </div>
  );
}
