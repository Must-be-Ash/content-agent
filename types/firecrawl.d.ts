// Firecrawl API TypeScript Type Definitions

export interface FirecrawlSearchOptions {
  query: string;
  limit?: number;
  sources?: string[];
  scrapeOptions?: {
    onlyMainContent?: boolean;
  };
}

export interface FirecrawlSearchResult {
  title: string;
  url: string;
  markdown?: string;
  content?: string;
}

export interface FirecrawlSearchResponse {
  success: boolean;
  data: {
    web: FirecrawlSearchResult[];
  };
}

export interface FirecrawlPaymentAccepts {
  network: string;
  asset: string;
  maxAmountRequired: string;
}

export interface FirecrawlErrorResponse {
  error: string;
  accepts?: FirecrawlPaymentAccepts[];
}

export interface FirecrawlPaymentResponse {
  transaction: string;
  network: string;
  amount: string;
}
