export type Stance = 'bullish' | 'bearish' | 'neutral';

export type AgentKey = 'soros' | 'dalio' | 'simons' | string;

export interface Agent {
  key: AgentKey;
  name: string;
  tagline: string;
  tone: string;
}

export interface AgentRec {
  stance: Stance;
  thesis: string;
  risk: string;
  timeframe: string;
}

export type AgentRecs = Record<AgentKey, AgentRec>;

export interface AvPrice {
  price: number | null;
  from: string;
  to: string;
  lastRefreshed?: string;
}

interface MetaData {
  agents: Agent[];
}

export interface ApiResponse {
  symbol: string;
  price: {
    data?: AvPrice;
    error?: string;
  };
  agents: {
    data?: AgentRecs;
    error?: string;
  };
  meta: MetaData;
}
