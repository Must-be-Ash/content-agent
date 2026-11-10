// CDP Configuration
export const CDP_CONFIG = {
  projectId: process.env.NEXT_PUBLIC_CDP_PROJECT_ID ?? '',
  apiKeyId: process.env.CDP_API_KEY_ID ?? '',
  apiKeySecret: process.env.CDP_API_KEY_SECRET ?? '',
};

// Firecrawl search via StableEnrich (x402, no API key)
export const FIRECRAWL_CONFIG = {
  apiBaseUrl: process.env.X402_SEARCH_URL ?? 'https://stableenrich.dev/api/firecrawl/search',
};

// Genbase Sora 2 Configuration
export const GENBASE_CONFIG = {
  apiUrl: process.env.GENBASE_API_URL ?? 'https://www.genbase.fun',
};

// x402 Network Configuration
export const X402_CONFIG = {
  facilitatorUrl: process.env.FACILITATOR_URL ?? 'https://api.x402.org/facilitator',
  network: process.env.NEXT_PUBLIC_NETWORK ?? 'eip155:8453', // CAIP-2 (x402 v2)
  usdcContractAddress: process.env.USDC_CONTRACT_ADDRESS ?? '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
};

// App Configuration
export const APP_CONFIG = {
  name: 'AI Content Generator',
  logoUrl: '/logo.svg',
  description: 'Generate AI-powered video content with x402 micropayments',
  url: process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000',
};

// Video Generation Configuration
export const VIDEO_CONFIG = {
  defaultDuration: 10, // seconds
  defaultSize: '1280x720', // 720p landscape
  defaultModel: 'sora-2', // standard quality
  maxWaitMinutes: 15, // maximum wait time for video generation
  pollIntervalSeconds: 30, // polling interval for status checks
};

// Cost Configuration (in USDC)
export const COST_CONFIG = {
  firecrawlSearchMin: 0.01, // minimum cost per search
  firecrawlSearchMax: 0.05, // maximum cost per search
  sora2Video10s: 0.2, // cost per 10-second video
  initialCredit: 5.0, // initial wallet credit
  maxPaymentAmount: 0.1, // max payment amount for the @x402/fetch spend policy
};

// Workflow Configuration
export const WORKFLOW_CONFIG = {
  storagePath: process.env.WORKFLOW_STORAGE_PATH ?? '.workflow-storage',
};
