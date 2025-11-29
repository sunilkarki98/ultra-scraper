export interface User {
  id: string;
  email: string;
  name: string;
  plan: string;
  status: string;
}

export interface ApiKey {
  id: string;
  key: string;
  name: string;
  createdAt: string;
  lastUsedAt?: string;
}

export interface Job {
  id: string;
  url: string;
  status: "pending" | "processing" | "completed" | "failed";
  createdAt: string;
  error?: string;
}

export interface UserData {
  user: User;
  limits: {
    pagesPerMonth: number;
    aiExtractionsPerMonth: number;
  };
  usage: {
    pagesScraped: number;
    aiExtractions: number;
    apiCalls: number;
  };
  percentage: {
    pages: string;
    ai: string;
  };
}

export interface Toast {
  id: string;
  message: string;
  type: "success" | "error" | "info";
}

export interface ScrapeOptions {
  mode?: 'simple' | 'advanced';
  workflow?: 'scraper-only' | 'scraper-llm' | 'llm-only';
  aiPrompt?: string;
  outputFormat?: 'text' | 'json' | 'markdown' | 'xml';

  llmConfig?: {
    provider: string;
    model: string;
    apiKey?: string;
    endpoint?: string;
    temperature?: number;
    maxTokens?: number;
    systemPrompt?: string;
  };
}