// src/app/pages/detail/page.tsx
'use client';

import React, { useState } from 'react';

// Define a more specific type for analysis results
interface AnalysisResult {
  sentiment: string; // e.g., 'bullish', 'neutral', 'bearish'
  score: number;
  confidence: number; // Added confidence property
  impact?: string;
  trading_signal?: string;
  risk_level?: string;
  key_factors?: string[];
}

export default function DetailPage() {
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const onAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // Clear previous errors and results
    // _setError(null); // Not directly used in JSX, so can be prefixed
    setAnalysisResult(null);

    try {
      const response = await fetch('/api/analyze-text', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text }),
      });

      if (!response.ok) {
        let errorMessage = `HTTP error! status: ${response.status} ${response.statusText || ''}`;
        try {
          const errorBody = await response.text(); // Try to get raw text first
          if (errorBody) {
            try {
              const errorData = JSON.parse(errorBody);
              if (errorData && errorData.error) {
                errorMessage = errorData.error;
              } else if (errorData && errorData.message) {
                errorMessage = errorData.message;
              } else if (typeof errorData === 'string') {
                errorMessage = errorData;
              } else {
                // If JSON parsed but no specific error field, use the raw body if it's short
                errorMessage = errorBody.length < 100 ? errorBody : `HTTP error! status: ${response.status}`;
              }
            } catch (jsonParseError) {
              // If JSON parsing fails, use the raw body if it's short
              errorMessage = errorBody.length < 100 ? errorBody : `HTTP error! status: ${response.status}`;
              console.error('Failed to parse error response as JSON:', jsonParseError);
            }
          }
        } catch (textError) {
          // If response.text() itself fails
          console.error('Failed to get error response text:', textError);
          // Keep the default errorMessage
        }
        // Ensure a fallback if errorMessage is still empty or just the status
        if (!errorMessage || errorMessage.trim() === '' || errorMessage.startsWith('HTTP error!')) {
            // If the error message is still generic, provide a more specific one.
            // If the original error was just a status code, append it.
            if (errorMessage.startsWith('HTTP error!')) {
                errorMessage = `Analysis failed. ${errorMessage}`;
            } else {
                errorMessage = `Analysis failed. ${errorMessage}`;
            }
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();
      setAnalysisResult(data);
      } catch (err: unknown) { // Use 'unknown' and narrow down
        console.error('Error analyzing text:', err);
      } finally {
      setLoading(false);
    }
  };

  const sentimentMeta = {
    bullish: { emoji: '😊', label: 'Bullish', ring: 'ring-green-500/40', badge: 'bg-green-500 text-black' },
    neutral: { emoji: '😐', label: 'Neutral', ring: 'ring-zinc-500/40', badge: 'bg-zinc-500 text-black' },
    bearish: { emoji: '😞', label: 'Bearish', ring: 'ring-red-500/40', badge: 'bg-red-500 text-black' },
  } as const;

  // Helper to map API sentiment to UI sentiment type
  const getUIMapping = (apiSentiment: string | undefined) => {
    if (apiSentiment === 'bullish') return 'bullish';
    if (apiSentiment === 'bearish') return 'bearish';
    return 'neutral';
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <header className="sticky top-0 z-10 bg-black/80 backdrop-blur border-b border-zinc-900">
        <div className="mx-auto max-w-sm px-4 py-3 flex items-center gap-3">
          <button
            aria-label="Back"
            className="rounded-full border border-zinc-800 p-2 hover:bg-white hover:text-black transition"
          >
            <span className="inline-block rotate-180 select-none">›</span>
          </button>
          <h1 className="text-lg font-semibold tracking-tight">Sentiment Analysis</h1>
        </div>
      </header>

      <main className="mx-auto max-w-sm px-4 py-4 space-y-6">
        <form onSubmit={onAnalyze} className="space-y-3">
          <label htmlFor="text" className="sr-only">
            Text
          </label>
          <textarea
            id="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Paste or type text to analyze..."
            className="w-full h-32 resize-none rounded-xl bg-zinc-950 text-white placeholder-zinc-500 border border-zinc-900 p-4 focus:outline-none focus:ring-2 focus:ring-white/20"
          />
          <div className="flex items-center justify-between">
            <span className="text-xs text-zinc-500">{text.trim().length} chars</span>
            <button
              disabled={!text.trim() || loading}
              className="inline-flex items-center gap-2 rounded-full px-4 py-2 bg-white text-black font-medium disabled:opacity-40 disabled:cursor-not-allowed hover:bg-zinc-200 transition"
              type="submit"
            >
              {loading ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-black border-t-transparent" />
                  Analyzing…
                </>
              ) : (
                <>Analyze</>
              )}
            </button>
          </div>
        </form>

        <section className="rounded-2xl border border-zinc-900 p-4 bg-zinc-950">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className={`h-12 w-12 rounded-xl grid place-items-center bg-black ring-4 ${
                  analysisResult ? sentimentMeta[getUIMapping(analysisResult.sentiment)].ring : 'ring-zinc-800'
                }`}
              >
                <span className="text-2xl">{analysisResult ? sentimentMeta[getUIMapping(analysisResult.sentiment)].emoji : '🤖'}</span>
              </div>
              <div>
                <p className="text-sm text-zinc-400">Overall sentiment</p>
                <p className="text-base font-semibold">
                  {analysisResult ? sentimentMeta[getUIMapping(analysisResult.sentiment)].label : 'Awaiting input'}
                </p>
              </div>
            </div>
            {analysisResult && (
              <span className={`text-xs px-2 py-1 rounded-full ${sentimentMeta[getUIMapping(analysisResult.sentiment)].badge}`}>
                {Math.round((analysisResult.score ?? 0.5) * 100)}%
              </span>
            )}
          </div>

          <div className="mt-4">
            {!analysisResult && <p className="text-sm text-zinc-500">Enter text and tap Analyze to see the result.</p>}
            {analysisResult && (
              <ul className="mt-2 space-y-2">
                <li className="flex items-center justify-between text-sm">
                  <span className="text-zinc-400">Confidence</span>
                  <span className="font-medium">{Math.round((analysisResult.confidence ?? 0.5) * 100)}%</span>
                </li>
                <li className="flex items-center justify-between text-sm">
                  <span className="text-zinc-400">Impact</span>
                  <span className="font-medium">{analysisResult.impact?.toUpperCase() || 'N/A'}</span>
                </li>
                <li className="flex items-center justify-between text-sm">
                  <span className="text-zinc-400">Trading Signal</span>
                  <span className="font-medium">{analysisResult.trading_signal?.toUpperCase() || 'N/A'}</span>
                </li>
                <li className="flex items-center justify-between text-sm">
                  <span className="text-zinc-400">Risk Level</span>
                  <span className="font-medium">{analysisResult.risk_level?.toUpperCase() || 'N/A'}</span>
                </li>
                {analysisResult.key_factors && analysisResult.key_factors.length > 0 && (
                  <>
                    <li className="flex flex-col justify-between text-sm">
                      <span className="text-zinc-400">Key Factors</span>
                      <ul className="mt-1 space-y-1 list-disc list-inside">
                        {analysisResult.key_factors.map((factor: string, idx: number) => (
                          <li key={idx} className="font-medium">{factor}</li>
                        ))}
                      </ul>
                    </li>
                  </>
                )}
                <li className="flex items-center justify-between text-sm">
                  <span className="text-zinc-400">Length</span>
                  <span className="font-medium">
                    {text.trim().split(/\s+/).filter(Boolean).length} words
                  </span>
                </li>
              </ul>
            )}
          </div>
        </section>

        <section className="rounded-2xl border border-zinc-900 p-4 bg-zinc-950">
          <h2 className="text-sm font-semibold tracking-tight mb-2">Samples</h2>
          <div className="grid grid-cols-1 gap-2">
            {[
              'I love this product, it works great!',
              'This is the worst experience ever.',
              'It’s okay, nothing special.',
            ].map((sample) => (
              <button
                key={sample}
                onClick={() => setText(sample)}
                className="text-left w-full rounded-xl border border-zinc-900 px-3 py-3 bg-black hover:bg-white hover:text-black transition"
              >
                <span className="text-sm">{sample}</span>
              </button>
            ))}
          </div>
        </section>

      </main>
    </div>
  );
}
