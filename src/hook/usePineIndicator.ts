// src/hook/usePineIndicator.ts
import { useEffect, useState } from 'react';

export type PinePlots = Record<string, number[]>;

interface Result {
  data: PinePlots | null;
  error: string | null;
  loading: boolean;
}

interface ApiResponse {
  plots?: PinePlots;
  error?: string;
}

export const usePineIndicator = (symbol: string, timeframe: string): Result => {
  const [state, setState] = useState<Result>({
    data: null,
    error: null,
    loading: false,
  });

  useEffect(() => {
    const ac = new AbortController();

    const run = async (): Promise<void> => {
      setState((s) => ({ ...s, loading: true, error: null }));
      try {
        const res = await fetch('/api/pine', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ symbol, timeframe, limit: 100 }),
          signal: ac.signal,
        });

        const json: ApiResponse = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(json?.error || `HTTP ${res.status}`);

        setState({ 
          data: json?.plots ?? null, 
          error: null, 
          loading: false 
        });
      } catch (e: unknown) {
        if (ac.signal.aborted) return;
        const errorMessage = e instanceof Error ? e.message : 'Failed to fetch plots';
        setState({ 
          data: null, 
          error: errorMessage, 
          loading: false 
        });
      }
    };

    run();
    return (): void => ac.abort();
  }, [symbol, timeframe]);

  return state;
};
