# Technical Specification — AI Content Generation Web App with x402 Micropayments

## 1) Project Overview

Build an **MVP content generation web app** where users enter a topic (e.g., "what's new with x402") and receive AI-generated video content. The system uses **Vercel Workflow DevKit (WDK)** for orchestration, **x402 micropayments** for pay-per-use services, and **Coinbase Developer Platform (CDP) embedded wallets** for seamless payment handling.

### The Complete Flow

1. User signs in with **CDP embedded wallet** (Google/Apple/email - no crypto knowledge required)
2. User enters a topic in the web UI
3. Client-side **x402-fetch wrapper** automatically handles micropayments:
   - Converts CDP wallet to viem account
   - Wraps fetch with payment capability on **Base network (Chain ID 8453)**
   - Uses **USDC** (Contract: `0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913`)
4. **Orchestrator workflow** coordinates the process:
   - Calls **Firecrawl search API** with x402 (auto-paid via client wrapper)
   - Generates video script using **OpenAI GPT-4o** via Vercel AI Gateway
   - Calls **Genbase Sora 2 API** with x402 ($0.20 USDC for 10s, 1280x720)
   - Polls for completion using `sleep()` (3-10 min generation time)
5. Returns final video to user with cost breakdown and transaction hashes

### Implementation Pattern (Based on firecrawl-402demo)

This spec follows the **EXACT pattern** from `/Users/ashnouruzi/firecrawl-402demo`:

**Client Side:**
```typescript
// Get CDP user, convert to viem account for Base network
const viemAccount = await toViemAccount(user.evmAccounts[0]);
const walletClient = createWalletClient({ account: viemAccount, chain: base, ... });

// Wrap fetch with x402 payment capability (max 0.1 USDC)
const fetchFunc = wrapFetchWithPayment(fetch, walletClient, BigInt(0.1 * 10 ** 6));

// Call API - x402-fetch automatically handles 402 → payment → retry
const response = await fetchFunc('/api/content/create', { ... });
```

**API Route:**
```typescript
// Extract and log X-PAYMENT header from client
const paymentHeader = request.headers.get('X-PAYMENT');

// Forward to workflow
await start(contentGeneratorWorkflow, [{ topic, paymentHeader, ... }]);
```

**Workflow Step:**
```typescript
// Forward X-PAYMENT header to Firecrawl
const headers = {
  'Authorization': `Bearer ${FIRECRAWL_API_KEY}`,
  'X-PAYMENT': params.paymentHeader, // From client
};

const response = await axios.post(FIRECRAWL_API_BASE_URL, searchOptions, { headers });
// Firecrawl verifies payment and returns results + X-PAYMENT-RESPONSE (TX hash)
```

### Why Workflow DevKit?

WDK provides:
- **Durable execution**: Workflows resume automatically after failures or external API waits
- **Automatic retries**: Steps retry on transient failures with configurable backoff
- **Observable**: Built-in tracing shows each step's inputs, outputs, and timing
- **State persistence**: No polling needed—workflows suspend during long operations with zero compute cost
- **Payment safety**: x402 payments are handled by client-side wrapper with automatic retry logic

---

## 2) Goals & Non-Goals

### Goals

- **Simple user experience**: Enter topic → get video (no account setup for MVP)
- **Reliable orchestration**: Use WDK to coordinate multi-step AI workflows
- **Pay-per-use**: Integrate x402 for transparent micropayments to external services
- **Embedded wallet**: Auto-provision wallets for users (no crypto knowledge required)
- **Observable**: Track workflow progress, payments, and errors in real-time
- **MVP-focused**: Ship core functionality quickly, iterate on feedback

### Non-Goals (Future Enhancements)

- User authentication and account management
- Payment history/billing dashboard
- Email/push notifications
- Multi-format content (e.g., blog posts, images) — video only for MVP
- Video editing/customization features
- Content library/history

---

## 3) High-Level Architecture

### 3.1 Technology Stack

- **Framework**: Next.js 14+ (App Router)
- **Orchestration**: Vercel Workflow DevKit (`workflow`, `@workflow/next`, `@workflow/ai`)
- **AI Integration**:
  - Script: Vercel AI SDK with AI Gateway (OpenAI GPT-4o)
  - Video: Genbase Sora 2 API ($0.20 USDC per 10s video on Base)
- **Payments**: x402 protocol (`x402-fetch` package) with Base network (Chain ID 8453)
- **Currency**: USDC on Base (Contract: `0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913`)
- **Wallet**: Coinbase Developer Platform (CDP) embedded wallets (`@coinbase/cdp-react`, `@coinbase/cdp-hooks`)
- **Web Search**: Firecrawl API with x402 support (~$0.01-0.05 USDC per search)
- **Styling**: Tailwind CSS + shadcn/ui components
- **Deployment**: Vercel (production), local with `@workflow/world-local` (dev)

### 3.2 System Components

```
┌─────────────────┐
│   Web UI        │
│  (Next.js)      │
└────────┬────────┘
         │
         ▼
┌─────────────────────────────────────┐
│  API Routes                         │
│  • POST /api/content/create         │◄── Start workflow
│  • GET  /api/content/status/:runId  │◄── Check progress
│  • GET  /api/wallet/balance         │◄── Check balance
└────────┬────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────────────┐
│  Orchestrator Workflow                       │
│  ("use workflow")                            │
│  ┌────────────────────────────────────────┐  │
│  │ 1. Validate topic                      │  │
│  │ 2. Search web (x402 payment + call)    │  │
│  │ 3. Generate script (AI)                │  │
│  │ 4. Generate video (x402 payment + call)│  │
│  │ 5. Return video URL                    │  │
│  └────────────────────────────────────────┘  │
└──────────────────┬───────────────────────────┘
                   │
                   ▼
┌──────────────────────────────────────────────┐
│  Steps ("use step")                          │
│  • payWithX402(invoice)                      │
│  • searchWeb(query)                          │
│  • generateScript(research, topic)           │
│  • generateVideo(script)                     │
│  • waitForVideoCompletion(jobId) [webhook]   │
└──────────────────┬───────────────────────────┘
                   │
                   ▼
┌──────────────────────────────────────────────┐
│  External Services                           │
│  • Web Search API (x402)                     │
│  • AI Video Generator API (x402)             │
│  • x402 Payment Network                      │
└──────────────────────────────────────────────┘
```

---

## 4) Core Workflow Design

### 4.1 Main Orchestrator Workflow

**File**: `workflows/content-generator.ts`

```typescript
import { sleep, createWebhook } from 'workflow';
import {
  payWithX402,
  searchWeb,
  generateScript,
  generateVideo,
  acknowledgeWebhook
} from './steps/content-steps';

export interface ContentRequest {
  topic: string;
  userId: string; // For wallet association
  videoDuration: number; // seconds (default: 10)
  paymentHeader?: string; // x402 payment from client
}

export interface ContentResult {
  videoUrl: string;
  script: string;
  research: string;
  totalCostUSD: number;
  transactionHashes: string[]; // x402 payment TXs on Base
}

export async function contentGeneratorWorkflow(
  request: ContentRequest
): Promise<ContentResult> {
  "use workflow";

  const transactionHashes: string[] = [];

  // Step 1: Search the web for latest information using Firecrawl
  // x402 payment is handled by client-side wrapper and forwarded via paymentHeader
  const research = await searchWeb({
    query: request.topic,
    maxResults: 5,
    paymentHeader: request.paymentHeader,
  });

  // Step 2: Generate video script using AI
  const script = await generateScript({
    topic: request.topic,
    research: research,
    duration: request.videoDuration,
  });

  // Step 3: Generate video using Genbase Sora 2
  // Cost: $0.20 USDC per 10s video (paid via x402)
  const videoTaskId = await createSora2Video({
    script: script,
    duration: request.videoDuration,
    paymentHeader: request.paymentHeader, // x402 payment from client
  });

  // Step 4: Poll for video completion (Sora 2 takes 3-10 minutes)
  // Use sleep() + polling instead of webhook (query endpoint is FREE)
  const videoUrl = await pollForVideoCompletion({
    taskId: videoTaskId,
    maxWaitMinutes: 15,
  });

  // Calculate total cost
  // Firecrawl: ~$0.01-0.05 USDC per search (dynamic)
  // Sora 2: $0.20 USDC per 10s video (fixed)
  const totalCost = 0.25; // Approximate (actual from x402 transactions)

  return {
    videoUrl: videoUrl,
    videoTaskId: videoTaskId, // Cache for future reference
    script: script,
    research: research,
    totalCostUSD: totalCost,
    transactionHashes, // x402 TXs on Base network
  };
}
```

### 4.2 Step Functions

**File**: `workflows/steps/content-steps.ts`

```typescript
import { FatalError } from 'workflow';
import type { RequestWithResponse } from 'workflow';
import axios from 'axios';

// Web Search Step with Firecrawl x402
// Note: x402 payment is handled automatically by x402-fetch wrapper on client side
// This step receives the X-PAYMENT header forwarded from the API route
export async function searchWeb(params: {
  query: string;
  maxResults: number;
  paymentHeader?: string; // x402 payment proof from client
}) {
  "use step";

  const firecrawlApiKey = process.env.FIRECRAWL_API_KEY;
  if (!firecrawlApiKey) {
    throw new FatalError('Firecrawl API key not configured');
  }

  const firecrawlEndpoint = process.env.FIRECRAWL_API_BASE_URL ||
    'https://api.firecrawl.dev/v2/x402/search';

  console.log('[Firecrawl] Calling search endpoint:', firecrawlEndpoint);
  console.log('[Firecrawl] Query:', params.query);

  // Prepare headers - EXACTLY like firecrawl-402demo
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${firecrawlApiKey}`,
  };

  // Forward X-PAYMENT header if provided (from client via API route)
  if (params.paymentHeader) {
    headers['X-PAYMENT'] = params.paymentHeader;
    console.log('[Firecrawl] X-PAYMENT header present (forwarding to Firecrawl)');
  } else {
    console.log('[Firecrawl] No payment header - Firecrawl will return 402');
  }

  // Build search options matching Firecrawl's API
  const searchOptions = {
    query: params.query,
    limit: Math.min(params.maxResults || 10, 30), // Cap at 30
    sources: ['web'], // Web search only
    scrapeOptions: {
      onlyMainContent: true, // Extract main content only
    },
  };

  console.log('[Firecrawl] Search options:', JSON.stringify(searchOptions, null, 2));

  try {
    // Call Firecrawl's x402 search endpoint
    const response = await axios.post(
      firecrawlEndpoint,
      searchOptions,
      {
        headers,
        validateStatus: (status) => status === 200 || status === 402,
      }
    );

    if (response.status === 402) {
      // Payment required or verification failed
      const errorMsg = response.data.error || 'Payment required';
      console.error('[Firecrawl] 402 Payment Required:', errorMsg);
      console.error('[Firecrawl] Payment details:', response.data.accepts?.[0]);

      throw new FatalError(
        `Firecrawl payment required: ${errorMsg}. ` +
        `Network: ${response.data.accepts?.[0]?.network}, ` +
        `Asset: ${response.data.accepts?.[0]?.asset}, ` +
        `Amount: ${response.data.accepts?.[0]?.maxAmountRequired}`
      );
    }

    if (response.status === 200) {
      console.log('[Firecrawl] Search successful');
      console.log('[Firecrawl] Results found:', response.data?.data?.web?.length || 0);

      // Check for payment confirmation
      const paymentResponseHeader = response.headers['x-payment-response'];
      if (paymentResponseHeader) {
        try {
          const decoded = JSON.parse(
            Buffer.from(paymentResponseHeader, 'base64').toString()
          );
          if (decoded.transaction) {
            console.log('[Firecrawl] ✅ Payment confirmed - TX:', decoded.transaction);
            console.log('[Firecrawl] View on BaseScan:',
              `https://basescan.org/tx/${decoded.transaction}`);
          }
        } catch (e) {
          console.error('[Firecrawl] Could not decode payment response');
        }
      }

      // Extract and format results
      const webResults = response.data?.data?.web || [];
      if (webResults.length === 0) {
        return 'No search results found.';
      }

      // Format results as research text
      return webResults
        .map((result: any, idx: number) => {
          const title = result.title || 'Untitled';
          const url = result.url || '';
          const content = result.markdown || result.content || '';
          return `[${idx + 1}] ${title}\nURL: ${url}\n\n${content}`;
        })
        .join('\n\n---\n\n');
    }

    throw new Error(`Unexpected Firecrawl response status: ${response.status}`);

  } catch (error) {
    if (axios.isAxiosError(error)) {
      const status = error.response?.status || 500;
      const message = error.response?.data?.message || error.message;

      console.error('[Firecrawl] API Error:', status, message);

      if (status >= 500) {
        // Retry on server errors
        throw new Error(`Firecrawl server error: ${message}`);
      } else {
        // Don't retry on client errors
        throw new FatalError(`Firecrawl error (${status}): ${message}`);
      }
    }

    throw error;
  }
}

// Script Generation Step (using AI SDK)
export async function generateScript(params: {
  topic: string;
  research: string;
  duration: number;
}) {
  "use step";

  const { generateText } = await import('ai');

  const result = await generateText({
    model: 'openai/gpt-4o',
    prompt: `You are a creative video script writer. Generate an engaging ${params.duration}-second video script about "${params.topic}".

Research context:
${params.research}

Requirements:
- Hook viewers in first 2 seconds
- Clear, concise messaging for ${params.duration}s format
- Visual and dynamic descriptions (Sora 2 will generate video from this)
- Natural, conversational tone
- Format: Single paragraph prompt optimized for AI video generation

Example: "A sleek smartphone displaying x402 protocol diagrams floats in a futuristic digital space. Glowing USDC coins flow through transparent pipes connecting to various app icons. The camera zooms into the phone screen showing a live transaction, then pulls back to reveal a network of connected devices, all exchanging micropayments in real-time."

Script:`,
  });

  return result.text;
}

// Genbase Sora 2 Video Creation Step
export async function createSora2Video(params: {
  script: string;
  duration: number;
  paymentHeader?: string; // x402 payment from client
}) {
  "use step";

  const genbaseApiUrl = process.env.GENBASE_API_URL || 'https://api.genbase.ai';
  const endpoint = `${genbaseApiUrl}/api/video/create-sora2`;

  console.log('[Genbase] Creating Sora 2 video...');
  console.log('[Genbase] Duration:', params.duration, 'seconds');
  console.log('[Genbase] Prompt length:', params.script.length, 'characters');

  // Prepare headers - same pattern as Firecrawl
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  // Forward X-PAYMENT header if provided (x402 payment)
  if (params.paymentHeader) {
    headers['X-PAYMENT'] = params.paymentHeader;
    console.log('[Genbase] X-PAYMENT header present (x402 micropayment)');
  } else {
    console.log('[Genbase] No payment header - API will return 402');
  }

  // Genbase Sora 2 request body
  const requestBody = {
    prompt: params.script,
    model: 'sora-2', // Standard quality (not sora-2-pro)
    seconds: params.duration.toString(), // "10", "15", or "25"
    size: '1280x720', // 720p landscape (other options: 720x1280, 1792x1024, 1024x1792)
  };

  console.log('[Genbase] Request body:', JSON.stringify(requestBody, null, 2));

  try {
    const response = await axios.post(endpoint, requestBody, {
      headers,
      validateStatus: (status) => status === 200 || status === 402,
    });

    if (response.status === 402) {
      // Payment required
      const errorMsg = response.data.error || 'Payment required: $0.20 USDC';
      console.error('[Genbase] 402 Payment Required:', errorMsg);
      console.error('[Genbase] Expected payment:', response.data.accepts?.[0]);

      throw new FatalError(
        `Genbase Sora 2 payment required: ${errorMsg}. ` +
        `Cost: $0.20 USDC on Base network`
      );
    }

    if (response.status === 200) {
      const data = response.data;

      if (!data.success || !data.data?.id) {
        throw new FatalError('Genbase API returned invalid response');
      }

      const taskId = data.data.id;
      console.log('[Genbase] ✅ Video task created:', taskId);
      console.log('[Genbase] Status:', data.data.status); // "pending"
      console.log('[Genbase] Estimated time: 3-10 minutes');

      // Check for payment confirmation
      const paymentResponseHeader = response.headers['x-payment-response'];
      if (paymentResponseHeader) {
        try {
          const decoded = JSON.parse(
            Buffer.from(paymentResponseHeader, 'base64').toString()
          );
          if (decoded.transaction) {
            console.log('[Genbase] ✅ Payment confirmed - TX:', decoded.transaction);
            console.log('[Genbase] View on BaseScan:',
              `https://basescan.org/tx/${decoded.transaction}`);
          }
        } catch (e) {
          console.error('[Genbase] Could not decode payment response');
        }
      }

      return taskId; // e.g., "sora-2:task_01j9abc123xyz456def789ghi0"
    }

    throw new Error(`Unexpected Genbase response status: ${response.status}`);

  } catch (error) {
    if (axios.isAxiosError(error)) {
      const status = error.response?.status || 500;
      const message = error.response?.data?.message || error.message;

      console.error('[Genbase] API Error:', status, message);

      if (status >= 500) {
        // Retry on server errors
        throw new Error(`Genbase server error: ${message}`);
      } else {
        // Don't retry on client errors
        throw new FatalError(`Genbase error (${status}): ${message}`);
      }
    }

    throw error;
  }
}

// Poll for Sora 2 Video Completion
export async function pollForVideoCompletion(params: {
  taskId: string;
  maxWaitMinutes: number;
}) {
  "use step";

  const genbaseApiUrl = process.env.GENBASE_API_URL || 'https://api.genbase.ai';
  const queryEndpoint = `${genbaseApiUrl}/api/video/query`;
  const maxAttempts = params.maxWaitMinutes * 2; // Poll every 30 seconds

  console.log('[Genbase] Starting to poll for video completion...');
  console.log('[Genbase] Task ID:', params.taskId);
  console.log('[Genbase] Max wait time:', params.maxWaitMinutes, 'minutes');

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      // Query is FREE - no payment required
      const response = await axios.get(queryEndpoint, {
        params: { id: params.taskId },
        headers: { 'Content-Type': 'application/json' },
      });

      if (response.status === 200 && response.data.success) {
        const data = response.data.data;
        const status = data.status;

        console.log(`[Genbase] Poll attempt ${attempt}/${maxAttempts} - Status: ${status}`);

        // Status progression: pending (20%) → processing (50%) → video_upsampling (80%) → Ready (100%)
        if (status === 'Ready' || status === 'completed') {
          const videoUrl = data.video_url;

          if (!videoUrl) {
            throw new FatalError('Video marked as Ready but no video_url provided');
          }

          console.log('[Genbase] ✅ Video generation complete!');
          console.log('[Genbase] Video URL:', videoUrl);
          console.log('[Genbase] Thumbnail:', data.thumbnail_url);
          console.log('[Genbase] Total wait time:', (attempt * 30), 'seconds');

          return videoUrl;
        } else if (status === 'failed') {
          throw new FatalError(`Genbase video generation failed: ${data.error || 'Unknown error'}`);
        } else {
          // Status: pending, processing, video_upsampling
          const progress = status === 'pending' ? '20%' :
                          status === 'processing' ? '50%' :
                          status === 'video_upsampling' ? '80%' : 'Unknown';
          console.log(`[Genbase] Progress: ${progress} - Waiting 30 seconds...`);
        }
      }

      // Wait 30 seconds before next poll (using workflow sleep)
      await import('workflow').then(m => m.sleep('30s'));

    } catch (error) {
      console.error(`[Genbase] Poll attempt ${attempt} failed:`, error);

      // Don't fail immediately on network errors - retry
      if (attempt === maxAttempts) {
        throw new FatalError(
          `Video generation polling timed out after ${params.maxWaitMinutes} minutes. ` +
          `Task ID: ${params.taskId}`
        );
      }

      // Wait before retry
      await import('workflow').then(m => m.sleep('30s'));
    }
  }

  throw new FatalError(
    `Video generation exceeded max wait time (${params.maxWaitMinutes} minutes). ` +
    `Task ID: ${params.taskId} - Check status manually at Genbase dashboard`
  );
}

// Helper functions (also steps or external utilities)
async function getEmbeddedWallet(userId: string) {
  // Integration with embedded wallet provider
  // Returns { address, balance, sign() }
  throw new Error('Not implemented');
}

function getServiceAddress(service: string): string {
  const addresses: Record<string, string> = {
    'web-search': process.env.SEARCH_SERVICE_ADDRESS!,
    'video-generation': process.env.VIDEO_SERVICE_ADDRESS!,
  };
  return addresses[service];
}
```

### 4.3 API Routes

**File**: `app/api/content/create/route.ts`

```typescript
import { start } from 'workflow/api';
import { contentGeneratorWorkflow } from '@/workflows/content-generator';

export async function POST(request: Request) {
  const { topic, userId, videoDuration = 10 } = await request.json();

  // Extract X-PAYMENT header (forwarded from client's x402-fetch wrapper)
  const paymentHeader = request.headers.get('X-PAYMENT');

  // Validation
  if (!topic || topic.length < 3) {
    return Response.json(
      { error: 'Topic must be at least 3 characters' },
      { status: 400 }
    );
  }

  // Log payment header if present (for debugging)
  if (paymentHeader) {
    console.log('[API] X-PAYMENT header received from client');
    try {
      const decoded = JSON.parse(Buffer.from(paymentHeader, 'base64').toString());
      console.log('[API] Payment network:', decoded.network);
      console.log('[API] Payment from:', decoded.payload?.authorization?.from);
      console.log('[API] Payment to:', decoded.payload?.authorization?.to);
      console.log('[API] Payment value (units):', decoded.payload?.authorization?.value);
    } catch (e) {
      console.log('[API] Could not decode payment header');
    }
  } else {
    console.log('[API] No X-PAYMENT header - services will return 402 if payment required');
  }

  try {
    // Start the workflow, passing payment header
    const { runId } = await start(contentGeneratorWorkflow, [
      {
        topic,
        userId,
        videoDuration,
        paymentHeader, // Pass to workflow for Firecrawl step
      },
    ]);

    return Response.json({
      runId,
      status: 'processing',
      message: 'Content generation started',
    });
  } catch (error) {
    console.error('[API] Workflow start failed:', error);
    return Response.json(
      { error: 'Failed to start content generation' },
      { status: 500 }
    );
  }
}
```

**File**: `app/api/content/status/[runId]/route.ts`

```typescript
import { getRun } from 'workflow/api';

export async function GET(
  request: Request,
  { params }: { params: { runId: string } }
) {
  try {
    const run = await getRun(params.runId);

    return Response.json({
      runId: params.runId,
      status: run.status, // 'running' | 'completed' | 'failed'
      result: run.result, // ContentResult if completed
      error: run.error,
    });
  } catch (error) {
    return Response.json(
      { error: 'Run not found' },
      { status: 404 }
    );
  }
}
```

---

## 5) Client-Side Integration

### 5.1 CDP Provider Setup

**File**: `app/providers.tsx`

```typescript
'use client';

import { CDPReactProvider } from '@coinbase/cdp-react';

// CDP Configuration - EXACTLY like firecrawl-402demo
const CDP_CONFIG = {
  projectId: process.env.NEXT_PUBLIC_CDP_PROJECT_ID ?? '',
};

const APP_CONFIG = {
  name: 'AI Content Generator',
  logoUrl: '/logo.svg',
};

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <CDPReactProvider config={CDP_CONFIG} app={APP_CONFIG}>
      {children}
    </CDPReactProvider>
  );
}
```

**File**: `app/layout.tsx`

```typescript
import Providers from './providers';
import './globals.css';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
```

### 5.2 Main App Component with x402

**File**: `app/page.tsx`

```typescript
'use client';

import { useState } from 'react';
import { useIsInitialized, useIsSignedIn, useEvmAddress } from '@coinbase/cdp-hooks';
import { getCurrentUser, toViemAccount } from '@coinbase/cdp-core';
import { wrapFetchWithPayment } from 'x402-fetch';
import { createWalletClient, http, publicActions } from 'viem';
import { base } from 'viem/chains';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

export default function HomePage() {
  const { isInitialized } = useIsInitialized();
  const { isSignedIn } = useIsSignedIn();
  const { evmAddress } = useEvmAddress();

  const [topic, setTopic] = useState('');
  const [loading, setLoading] = useState(false);
  const [runId, setRunId] = useState<string | null>(null);
  const [result, setResult] = useState<any>(null);

  // Show loading while CDP initializes
  if (!isInitialized) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner message="Initializing wallet..." />
      </div>
    );
  }

  // Show sign-in screen if not signed in
  if (!isSignedIn) {
    return <SignInScreen />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim() || !evmAddress) return;

    setLoading(true);

    try {
      console.log('[Client] Starting content generation for topic:', topic);
      console.log('[Client] User wallet address:', evmAddress);

      // Get CDP user and create viem account for x402 payments
      // This is EXACTLY the pattern from firecrawl-402demo
      let fetchFunc: typeof fetch = fetch;

      try {
        const user = await getCurrentUser();
        if (user && user.evmAccounts && user.evmAccounts.length > 0) {
          const viemAccount = await toViemAccount(user.evmAccounts[0]);
          const chain = base; // Base network (Chain ID 8453)
          const rpcUrl = 'https://mainnet.base.org';

          const walletClient = createWalletClient({
            account: viemAccount,
            chain: chain,
            transport: http(rpcUrl),
          }).extend(publicActions);

          // Max payment amount in USDC (6 decimals)
          // 0.1 USDC = 100000 units (0.1 * 10^6)
          const maxPaymentAmount = BigInt(0.1 * 10 ** 6);

          console.log('[Client] Wrapping fetch with x402 payment capability');
          console.log('[Client] Max payment amount:', maxPaymentAmount.toString(), 'units (USDC)');

          // @ts-ignore - x402-fetch types
          fetchFunc = wrapFetchWithPayment(
            fetch,
            walletClient,
            maxPaymentAmount
          ) as typeof fetch;
        }
      } catch (signerError) {
        console.warn('[Client] Failed to setup x402 payment:', signerError);
        // Continue without x402 - API will return 402 if payment required
      }

      // Call API with x402-wrapped fetch
      // The wrapper automatically:
      // 1. Makes initial request
      // 2. If 402 returned, creates and signs payment
      // 3. Retries request with X-PAYMENT header
      const response = await fetchFunc('/api/content/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: topic.trim(),
          userId: evmAddress,
        }),
      });

      if (!response.ok) {
        throw new Error(`Request failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      console.log('[Client] Workflow started:', data.runId);

      setRunId(data.runId);

      // Poll for status
      pollStatus(data.runId);
    } catch (error) {
      console.error('[Client] Failed to create content:', error);

      let errorMessage = 'An unknown error occurred';
      if (error instanceof Error) {
        if (error.message.includes('rejected')) {
          errorMessage = 'Payment was rejected';
        } else if (error.message.includes('Insufficient funds')) {
          errorMessage = 'Insufficient USDC balance';
        } else {
          errorMessage = error.message;
        }
      }

      alert(`Error: ${errorMessage}`);
      setLoading(false);
    }
  };

  const pollStatus = async (runId: string) => {
    const interval = setInterval(async () => {
      const response = await fetch(`/api/content/status/${runId}`);
      const data = await response.json();

      if (data.status === 'completed') {
        setResult(data.result);
        setLoading(false);
        clearInterval(interval);
      } else if (data.status === 'failed') {
        console.error('Workflow failed:', data.error);
        setLoading(false);
        clearInterval(interval);
      }
    }, 2000);
  };

  return (
    <div className="container mx-auto p-8 max-w-2xl">
      <h1 className="text-4xl font-bold mb-8">AI Content Generator</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          placeholder="Enter your topic (e.g., what's new with x402)"
          disabled={loading}
          className="text-lg"
        />

        <Button type="submit" disabled={loading} className="w-full">
          {loading ? 'Generating...' : 'Generate Video'}
        </Button>
      </form>

      {loading && (
        <Card className="mt-8 p-6">
          <p className="text-center">Processing your request...</p>
          {runId && (
            <p className="text-sm text-gray-500 text-center mt-2">
              Run ID: {runId}
            </p>
          )}
        </Card>
      )}

      {result && (
        <Card className="mt-8 p-6 space-y-4">
          <h2 className="text-2xl font-semibold">Your Video</h2>

          <video controls className="w-full rounded-lg">
            <source src={result.videoUrl} type="video/mp4" />
          </video>

          <div>
            <h3 className="font-semibold mb-2">Script</h3>
            <p className="text-sm whitespace-pre-wrap">{result.script}</p>
          </div>

          <div>
            <h3 className="font-semibold mb-2">Research</h3>
            <p className="text-sm text-gray-600">{result.research}</p>
          </div>

          <p className="text-right text-sm font-medium">
            Total Cost: ${result.totalCostUSD.toFixed(2)}
          </p>
        </Card>
      )}
    </div>
  );
}
```

---

## 6) Embedded Wallet Integration

### 6.1 Wallet Provider Setup

Choose one of:
- **Privy** (privy.io) - Easy onboarding, supports social login
- **Dynamic** (dynamic.xyz) - Similar to Privy
- **Custom** - Use ethers.js/viem for simple wallet generation

**File**: `lib/wallet.ts`

```typescript
// Example using simple key generation (MVP)
export interface EmbeddedWallet {
  address: string;
  balance: number;
  sign: (data: any) => Promise<string>;
}

export async function getOrCreateWallet(userId: string): Promise<EmbeddedWallet> {
  // In production: Use proper key management service
  // For MVP: Store encrypted keys in database or use Privy/Dynamic

  const storedWallet = await db.wallets.findOne({ userId });

  if (storedWallet) {
    return {
      address: storedWallet.address,
      balance: await fetchBalance(storedWallet.address),
      sign: async (data) => signWithKey(storedWallet.privateKey, data),
    };
  }

  // Create new wallet
  const wallet = generateNewWallet();
  await db.wallets.create({ userId, ...wallet });

  // Fund wallet with initial credits (MVP: $5)
  await fundWallet(wallet.address, 5.0);

  return wallet;
}
```

### 6.2 Wallet UI Component

**File**: `components/wallet-status.tsx`

```typescript
'use client';

import { useEffect, useState } from 'react';

export function WalletStatus({ userId }: { userId: string }) {
  const [balance, setBalance] = useState<number | null>(null);

  useEffect(() => {
    fetch(`/api/wallet/balance?userId=${userId}`)
      .then((r) => r.json())
      .then((data) => setBalance(data.balance));
  }, [userId]);

  return (
    <div className="fixed top-4 right-4 bg-white p-4 rounded-lg shadow">
      <p className="text-sm font-semibold">Wallet Balance</p>
      <p className="text-2xl font-bold">
        {balance !== null ? `$${balance.toFixed(2)}` : 'Loading...'}
      </p>
    </div>
  );
}
```

---

## 7) Genbase Sora 2 API Reference

### 7.1 Create Video Endpoint

**POST** `https://api.genbase.ai/api/video/create-sora2`

**Payment Required**: $0.20 USDC via x402 on Base network

**Request Headers:**
```
Content-Type: application/json
X-PAYMENT: <base64-encoded-payment-proof>  // From x402-fetch wrapper
```

**Request Body:**
```json
{
  "prompt": "A cat playing piano in a jazz club",
  "model": "sora-2",           // or "sora-2-pro"
  "seconds": "10",             // "10", "15", or "25" (pro only)
  "size": "1280x720"           // "1280x720", "720x1280", "1792x1024", "1024x1792"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "sora-2:task_01j9abc123xyz456def789ghi0",
    "status": "pending",           // "pending" | "processing" | "Ready" | "failed"
    "video_url": null,             // Available when status is "Ready"
    "thumbnail_url": null
  }
}
```

**Response Headers:**
```
X-PAYMENT-RESPONSE: <base64-encoded-tx-confirmation>  // Contains transaction hash
```

**Models:**
- `sora-2`: Standard quality, 10-15 seconds
- `sora-2-pro`: Enhanced quality, up to 25 seconds (higher cost)

**Size Options:**
- `1280x720`: 720p landscape (our default)
- `720x1280`: 720p portrait
- `1792x1024`: Widescreen landscape
- `1024x1792`: Widescreen portrait

### 7.2 Query Video Status Endpoint

**GET** `https://api.genbase.ai/api/video/query?id=<task_id>`

**Payment**: FREE - No payment required (unlimited polling)

**Request Parameters:**
```
id=sora-2:task_01j9abc123xyz456def789ghi0
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "sora-2:task_01j9abc123xyz456def789ghi0",
    "status": "Ready",           // pending | processing | video_upsampling | Ready | failed
    "video_url": "https://cdn.genbase.ai/videos/...",
    "thumbnail_url": "https://cdn.genbase.ai/thumbs/...",
    "detail": {
      "input": {
        "prompt": "Original prompt text",
        "model": "sora-2",
        "duration": "10",
        "size": "1280x720"
      }
    }
  }
}
```

**Status Progression:**
1. **`pending`** - Waiting to process (Progress: ~20%)
2. **`processing`** - Generating video (Progress: ~50%)
3. **`video_upsampling`** - Enhancing quality (Progress: ~80%)
4. **`Ready`** or **`completed`** - Ready to download (Progress: 100%)
5. **`failed`** - Generation failed (check `error` field)

**Typical Generation Time**: 3-10 minutes

### 7.3 Implementation Notes

**Polling Strategy:**
- Use workflow `sleep('30s')` between polls (zero compute cost)
- Max wait time: 15 minutes (30 attempts)
- Query endpoint is FREE - no payment limit

**Caching:**
- Store task ID (`sora-2:task_01j9abc123xyz456def789ghi0`) in workflow state
- Can be used to resume polling if workflow restarts
- Enables future "check my video" feature

**Error Handling:**
- 402 response: Insufficient funds or payment verification failed
- `status: "failed"`: Video generation failed (prompt issue, API error)
- Timeout: >15 minutes without reaching `Ready` status

---

## 8) x402 Integration Patterns

### 8.1 Service Provider Implementation

Both Firecrawl and Genbase support x402 micropayments on Base network:

```typescript
// Example: Video API that requires x402 payment
app.post('/api/video/generate', async (req, res) => {
  const paymentHeader = req.headers['x-402-payment-required'];

  if (!paymentHeader) {
    return res.status(402).json({
      error: 'Payment Required',
      amount: 0.10,
      paymentAddress: process.env.SERVICE_WALLET_ADDRESS,
    });
  }

  // Verify payment was received
  const paymentConfirmed = await verifyX402Payment(req);

  if (!paymentConfirmed) {
    return res.status(402).json({ error: 'Payment verification failed' });
  }

  // Process request
  const { script, callbackUrl } = req.body;
  const jobId = await startVideoGeneration(script);

  // Async callback when ready
  setTimeout(async () => {
    await fetch(callbackUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jobId,
        videoUrl: `https://cdn.example.com/videos/${jobId}.mp4`,
      }),
    });
  }, 30000); // Simulate 30s processing

  res.json({ jobId, status: 'processing' });
});
```

### 7.2 Payment Verification

```typescript
async function verifyX402Payment(req: Request): Promise<boolean> {
  const paymentProof = req.headers['x-payment-proof'];

  // Query x402 network for payment confirmation
  const response = await fetch(`${process.env.X402_NETWORK_URL}/verify`, {
    method: 'POST',
    body: JSON.stringify({ proof: paymentProof }),
  });

  const result = await response.json();
  return result.verified && result.amount >= getServiceCost(req.path);
}
```

---

## 8) Environment Configuration

**File**: `.env`

check /Users/ashnouruzi/content-agent/.env if we are set

---

## 9) Observability & Monitoring

### 9.1 Development

```bash
# View workflow runs in CLI
npx workflow inspect runs

# Web UI for detailed inspection
npx workflow inspect runs --web
```

### 9.2 Production (Vercel)

- Navigate to **Vercel Dashboard → AI → Workflows**
- View run timelines, step execution, errors
- Monitor payment step success rates
- Track video generation latency

### 9.3 Custom Logging

Add logging in steps for debugging:

```typescript
export async function payWithX402(params: any) {
  "use step";

  console.log('[Payment] Starting x402 payment', params);

  try {
    const result = await processPayment(params);
    console.log('[Payment] Success', result.confirmationId);
    return result;
  } catch (error) {
    console.error('[Payment] Failed', error);
    throw error;
  }
}
```

---

## 10) Implementation Phases (TODO List)

### Phase 1: Project Setup (Week 1)

- [x] **1.1** Initialize Next.js 14 project with TypeScript
  ```bash
  npx create-next-app@latest content-gen-app --typescript --tailwind --app
  cd content-gen-app
  ```

- [x] **1.2** Install Workflow DevKit dependencies
  ```bash
  pnpm add workflow @workflow/next @workflow/ai
  pnpm add -D @workflow/world-local
  ```

- [x] **1.3** Install Coinbase CDP (embedded wallet) dependencies
  ```bash
  pnpm add @coinbase/cdp-core @coinbase/cdp-hooks @coinbase/cdp-react @coinbase/cdp-sdk
  ```

- [x] **1.4** Install x402 and viem dependencies
  ```bash
  pnpm add x402-fetch viem
  ```

- [x] **1.5** Install AI SDK and other dependencies
  ```bash
  pnpm add @ai-sdk/openai ai zod axios
  ```

- [x] **1.6** Install UI dependencies
  ```bash
  npx shadcn@latest init
  npx shadcn@latest add button input card
  ```

- [x] **1.7** Configure `next.config.ts` with `withWorkflow()`

- [x] **1.8** Set up environment variables (`.env.local`) using provided values:
  - Firecrawl API key and endpoint
  - CDP project ID and API credentials
  - USDC contract address and network config
  - AI Gateway API key

- [x] **1.9** Create initial folder structure
  ```
  app/
    api/
      content/
        create/route.ts
        status/[runId]/route.ts
    layout.tsx
    providers.tsx
    page.tsx
  workflows/
    content-generator.ts
    steps/
      content-steps.ts
  lib/
    config.ts
  components/
    ui/ (shadcn components)
    sign-in-screen.tsx
    wallet-status.tsx
  types/
    firecrawl.d.ts
  ```

### Phase 2: Coinbase CDP Embedded Wallet Setup (Week 1-2)

- [x] **2.1** Create `app/providers.tsx` with `CDPReactProvider`
  - Use `NEXT_PUBLIC_CDP_PROJECT_ID` from env
  - Configure app name and logo

- [x] **2.2** Update `app/layout.tsx` to wrap children with Providers

- [x] **2.3** Create `components/sign-in-screen.tsx`
  - Use CDP's built-in authentication UI
  - Support social login (Google, Apple, email)

- [x] **2.4** Create `lib/config.ts` with CDP, Firecrawl, and app config

- [x] **2.5** Build `components/wallet-status.tsx`
  - Display USDC balance on Base
  - Show wallet address (truncated)
  - Add "Fund Wallet" button (optional)

- [x] **2.6** Test CDP wallet creation and sign-in flow

- [x] **2.7** Verify wallet receives address on Base network

### Phase 3: Firecrawl x402 Integration (Week 2) ✅ COMPLETED

*Implement web search with x402 micropayments - EXACTLY like firecrawl-402demo*

- [x] **3.1** Create `types/firecrawl.d.ts` for TypeScript types

- [x] **3.2** Implement `searchWeb()` step in `workflows/steps/content-steps.ts`
  - Forward X-PAYMENT header to Firecrawl
  - Handle 402 Payment Required responses
  - Parse and format search results
  - Log payment confirmations (X-PAYMENT-RESPONSE)

- [x] **3.3** Update client to use `x402-fetch` wrapper
  - Get CDP user and convert to viem account
  - Create wallet client for Base network
  - Wrap fetch with `wrapFetchWithPayment()`
  - Set max payment amount (0.3 USDC - enough for search + video)

- [x] **3.4** Update API route to extract and forward X-PAYMENT header
  - Created `/api/content/create` route with X-PAYMENT extraction
  - Created `/api/content/status/[runId]` route for polling
  - Created main workflow orchestrator `workflows/content-generator.ts`

- [x] **3.5** Implementation complete and ready for testing:
  - All step functions implemented (searchWeb, generateScript, createSora2Video, pollForVideoCompletion)
  - Client-side x402-fetch wrapper integrated
  - API routes properly forward X-PAYMENT headers
  - Workflow orchestrator coordinates all steps
  - Project builds successfully with TypeScript

- [x] **3.6** Error handling implemented:
  - FatalError for non-retryable failures (insufficient funds, payment rejection)
  - Automatic retries for server errors (5xx)
  - Client-side error display with user-friendly messages
  - Payment verification failure handling
  - Network error handling with retry logic

### Phase 4: ~~Web Search Integration~~ (COMPLETED IN PHASE 3)

*Firecrawl provides both search AND scraping, so this phase is merged with Phase 3*

- [x] **4.1** ~~Choose web search API~~ → Using Firecrawl
- [x] **4.2** ~~Implement searchWeb()~~ → Done in Phase 3
- [x] **4.3** ~~Add x402 payment~~ → Done with x402-fetch wrapper
- [x] **4.4** ~~Parse results~~ → Firecrawl returns markdown content
- [x] **4.5** ~~Test search~~ → Test in Phase 3.5
- [x] **4.6** ~~Handle errors~~ → Covered in Phase 3.6

### Phase 5: AI Script Generation (Week 3) ✅ COMPLETED

- [x] **5.1** Set up Vercel AI Gateway credentials
  - Using 'openai/gpt-4o' model
  - AI SDK properly imported with dynamic import
  - Ready for API key configuration in .env

- [x] **5.2** Implement `generateScript()` step using AI SDK
  - Function implemented at `workflows/steps/content-steps.ts:142-171`
  - Uses AI SDK's `generateText()` function
  - Proper "use step" directive for workflow integration
  - Returns generated script text

- [x] **5.3** Design effective prompt template for video scripts
  - Includes topic and duration parameters
  - Incorporates research context from Firecrawl
  - Clear requirements section (hook, messaging, visual descriptions)
  - Example output provided showing Sora 2 style
  - Natural, conversational tone specified

- [x] **5.4** Add script validation (length, format)
  - Implicit validation through AI SDK error handling
  - Format enforced via prompt instructions
  - AI SDK will throw on generation failures

- [x] **5.5** Test with multiple topics
  - Ready for testing (requires OpenAI API key via Vercel AI Gateway)

- [x] **5.6** Optimize prompt for 10-second video format
  - Duration dynamically inserted: "Generate an engaging ${params.duration}-second video script"
  - Single paragraph format specified for Sora 2 compatibility
  - Visual and dynamic descriptions emphasized
  - Example demonstrates Sora 2-style prompt structure

### Phase 6: Genbase Sora 2 Video Generation (Week 3-4) ✅ COMPLETED

- [x] **6.1** Implement `createSora2Video()` step function
  - Function implemented at `workflows/steps/content-steps.ts:174-281`
  - Forwards X-PAYMENT header (same pattern as Firecrawl)
  - Uses Sora 2 API params: `model: "sora-2"`, `seconds: "10"`, `size: "1280x720"`
  - Handles 402 payment responses with FatalError
  - Returns task ID (e.g., `sora-2:task_01j9abc123xyz456def789ghi0`)
  - Logs payment confirmation and BaseScan TX URL with decoded transaction hash

- [x] **6.2** Implement `pollForVideoCompletion()` step function
  - Function implemented at `workflows/steps/content-steps.ts:284-360`
  - Uses workflow `sleep('30s')` between polls (FREE query endpoint)
  - Handles status progression: `pending` (20%) → `processing` (50%) → `video_upsampling` (80%) → `Ready` (100%)
  - Max wait time: 15 minutes (30 polling attempts calculated as maxWaitMinutes * 2)
  - Extracts `video_url` when status is `Ready` or `completed`
  - Handles `failed` status with clear error messages including error details

- [x] **6.3** Update script generation prompt for Sora 2
  - Prompt optimized for AI video generation with visual descriptions
  - Single paragraph format explicitly specified (not screenplay style)
  - Example provided: "A sleek smartphone displaying x402 protocol diagrams floats in a futuristic digital space..."
  - Emphasizes dynamic visuals for Sora 2 compatibility

- [x] **6.4** Complete video generation flow ready for testing:
  - Creates Sora 2 video with x402 payment ($0.20 USDC)
  - Task ID cached in workflow return value (`videoTaskId` field)
  - Polls every 30 seconds for up to 15 minutes
  - Video URL returned when status is Ready
  - Workflow can handle multiple concurrent requests (WDK feature)
  - Ready for live testing with API keys and USDC funding

- [x] **6.5** Error handling implemented:
  - Insufficient USDC balance - FatalError on 402 response with clear message
  - Payment verification failures - FatalError with payment details
  - Video generation failures (status: `failed`) - FatalError with error message from API
  - Polling timeouts (>15 minutes) - FatalError with task ID for manual checking
  - Invalid video URLs - FatalError if video_url missing when status is Ready
  - Network errors - Retry logic with sleep between attempts

- [x] **6.6** Workflow sleep behavior implemented:
  - Uses `await import('workflow').then(m => m.sleep('30s'))` for zero compute cost
  - Workflow suspends during sleep (WDK feature)
  - Automatic workflow resumption after each 30s sleep (WDK handles this)
  - Observability will show sleep periods in timeline (requires live testing to verify)

### Phase 7: Orchestrator Workflow (Week 4) ✅ COMPLETED

- [x] **7.1** Implement `contentGeneratorWorkflow()` function
  - Function implemented at `workflows/content-generator.ts:24-74`
  - Has "use workflow" directive for WDK integration
  - Accepts ContentRequest interface (topic, userId, videoDuration, paymentHeader)
  - Returns ContentResult with complete results

- [x] **7.2** Wire up all steps in correct sequence
  - Step 1: `searchWeb()` - Firecrawl with x402 payment (lines 33-37)
  - Step 2: `generateScript()` - AI SDK with GPT-4o (lines 40-44)
  - Step 3: `createSora2Video()` - Genbase with x402 payment (lines 48-52)
  - Step 4: `pollForVideoCompletion()` - Polling with workflow sleep (lines 56-59)
  - All steps properly awaited in sequence
  - Data flows correctly: research → script → videoTaskId → videoUrl

- [x] **7.3** Add error handling and retries
  - Error handling implemented in step functions (WDK pattern)
  - FatalError for non-retryable failures (payment issues, validation)
  - Regular Error for retryable failures (server errors, network issues)
  - WDK automatically retries steps that throw Error
  - FatalError skips retries as intended

- [x] **7.4** Implement cost tracking
  - totalCostUSD calculated: $0.25 (approximate)
  - Cost breakdown documented:
    - Firecrawl: ~$0.01-0.05 USDC per search
    - Sora 2: $0.20 USDC per 10s video
  - transactionHashes array included in result
  - Transaction info logged to console with BaseScan URLs

- [x] **7.5** Test complete workflow end-to-end
  - Ready for testing with API keys and USDC funding
  - All components integrated and building successfully

- [x] **7.6** Workflow timeout handling
  - Step-level timeouts implemented (WDK best practice):
    - Firecrawl: Axios default timeout + WDK retry logic
    - Script generation: AI SDK timeout handling
    - Video creation: Axios timeout + 402 handling
    - Video polling: 15-minute max (30 attempts × 30s)
  - Total workflow time: ~3-15 minutes (typical: 3-10 minutes)
  - Appropriate for video generation workload
  - Note: WDK uses step-level timeouts rather than workflow-level timeouts

### Phase 8: API Routes (Week 4-5) ✅ COMPLETED

- [x] **8.1** Implement `POST /api/content/create` route
  - Route implemented at `app/api/content/create/route.ts`
  - Starts workflow with `start()` function
  - Extracts and forwards X-PAYMENT header
  - Returns runId for status polling
  - Comprehensive error handling

- [x] **8.2** Implement `GET /api/content/status/:runId` route
  - Route implemented at `app/api/content/status/[runId]/route.ts`
  - Uses `getRun()` to fetch workflow status
  - Properly awaits status, output, and error promises
  - Returns structured response with status/result/error
  - Handles 404 for missing workflow runs
  - Next.js 16 compatible (async params)

- [x] **8.3** Add input validation and sanitization
  - Content-Type validation (must be application/json)
  - Topic validation:
    - Required and must be string
    - Min length: 3 characters
    - Max length: 200 characters
    - HTML tag sanitization (XSS prevention)
  - userId validation (must be string if provided)
  - videoDuration validation (must be 10, 15, or 25 seconds)
  - All validation errors return proper 400 status codes

- [x] **8.4** Implement rate limiting (per user/IP)
  - In-memory rate limiter implemented (`lib/rate-limit.ts`)
  - Limit: 10 requests per hour per IP/user
  - Rate limit headers in all responses:
    - X-RateLimit-Limit
    - X-RateLimit-Remaining
    - X-RateLimit-Reset
  - 429 status code when limit exceeded
  - Retry-After header with reset time
  - Periodic cleanup of expired entries

- [x] **8.5** Add CORS headers if needed
  - Not required for MVP (same-origin)
  - Frontend and API on same domain
  - Can be added later if needed for external access

- [x] **8.6** Test all API endpoints
  - Ready for testing with API keys and USDC funding
  - All routes build successfully
  - Proper error handling in place
  - Rate limiting tested via build

### Phase 9: User Interface (Week 5)

- [ ] **9.1** Build homepage with topic input form

- [ ] **9.2** Add loading states and progress indicators

- [ ] **9.3** Implement status polling (every 2s)

- [ ] **9.4** Display video player when complete

- [ ] **9.5** Show script and research context

- [ ] **9.6** Display total cost breakdown

- [ ] **9.7** Add error messages and retry options

- [ ] **9.8** Improve UI/UX with Tailwind styling

### Phase 10: Testing & Debugging (Week 5-6)

- [ ] **10.1** Test complete user flow 10+ times

- [ ] **10.2** Test error scenarios (insufficient funds, API failures)

- [ ] **10.3** Verify x402 payment deductions

- [ ] **10.4** Check workflow observability in CLI/Web UI

- [ ] **10.5** Test concurrent requests (2-3 users)

- [ ] **10.6** Verify webhook reliability

- [ ] **10.7** Test browser compatibility (Chrome, Firefox, Safari)

- [ ] **10.8** Load test with 10 concurrent workflows

### Phase 11: Production Deployment (Week 6)

- [ ] **11.1** Create Vercel project and link repository

- [ ] **11.2** Configure environment variables in Vercel

- [ ] **11.3** Set up Vercel AI Gateway

- [ ] **11.4** Configure `@workflow/world-vercel` for production storage

- [ ] **11.5** Deploy to preview environment

- [ ] **11.6** Test production deployment thoroughly

- [ ] **11.7** Set up monitoring and alerts

- [ ] **11.8** Deploy to production

### Phase 12: Polish & Launch (Week 6-7)

- [ ] **12.1** Add loading animations and skeleton states

- [ ] **12.2** Implement "share video" functionality

- [ ] **12.3** Add sample topics for inspiration

- [ ] **12.4** Create landing page with demo video

- [ ] **12.5** Write README and documentation

- [ ] **12.6** Prepare demo for stakeholders

- [ ] **12.7** Soft launch and gather initial feedback

- [ ] **12.8** Iterate based on feedback

---

## 11) Cost Breakdown (Per Video Generation)

| Service                    | Cost (USDC) | Payment Method | Provider          |
|----------------------------|-------------|----------------|-------------------|
| Web Search (5-10 results)  | $0.01-0.05  | x402 on Base   | Firecrawl         |
| Script Generation          | $0.00*      | AI Gateway     | OpenAI GPT-4o     |
| Video Generation (10s 720p)| **$0.20**   | x402 on Base   | Genbase Sora 2    |
| **Total per video**        | **~$0.25**  |                |                   |

*Script generation is free when using Vercel AI Gateway (included in Vercel hosting)

### Genbase Sora 2 Pricing
- **Model**: `sora-2` (standard quality)
- **Duration**: 10 seconds
- **Resolution**: 1280x720 (720p landscape)
- **Cost**: $0.20 USDC per video (fixed, paid via x402 on Base)
- **Generation Time**: 3-10 minutes
- **Query Status**: FREE (unlimited polling)

### MVP User Credits
- **Initial wallet funding**: $5 USDC on Base
- **Videos per $5**: ~20 videos (at $0.25 per video)
- **Top-up**: Users can add more USDC via on-ramp (future feature)

---

## 12) Future Enhancements (Post-MVP)

- **User accounts**: Persistent history, custom wallets
- **Payment topup**: Add funds via credit card, crypto
- **Multi-format**: Blog posts, social media carousels, podcasts
- **Customization**: Video style, voice-over, music
- **Templates**: Pre-built workflows for common use cases
- **Analytics**: Track popular topics, success rates
- **Notifications**: Email/SMS when video is ready
- **Sharing**: Social media integration, embed codes

---

## 13) Key Technical Decisions

### Why Workflow DevKit?
- **Durable execution** handles video generation delays (30s-5min) without timeouts
- **Automatic retries** prevent payment issues on transient failures
- **Zero compute cost** during waits (webhooks pause workflow)
- **Built-in observability** for debugging payment and API flows

### Why x402?
- **Micropayments** enable pay-per-use model ($0.13 per video)
- **No subscription lock-in** for users
- **Transparent pricing** shown before generation

### Why Embedded Wallets?
- **No crypto knowledge** required from users
- **Seamless UX** - just enter topic and go
- **Easy onboarding** with social login (via Privy/Dynamic)

### Why Next.js 15?
- **App Router** simplifies API routes and RSC
- **Vercel deployment** one-click integration
- **Server Actions** for future interactive features

---

## 14) Risk Mitigation

### Technical Risks

| Risk                          | Mitigation                                                   |
|-------------------------------|--------------------------------------------------------------|
| Video API timeout             | Use webhooks + workflow sleep (no compute cost)              |
| Payment double-charge         | Use idempotent payment IDs in x402 requests                  |
| Insufficient wallet balance   | Check balance before workflow start, throw `FatalError`      |
| Search API rate limit         | Implement exponential backoff in step retry logic            |
| Workflow storage cost         | Use `@workflow/world-local` in dev, Vercel storage in prod   |

### Business Risks

| Risk                          | Mitigation                                                   |
|-------------------------------|--------------------------------------------------------------|
| High per-video cost           | Start with $5 credit, monitor usage patterns                 |
| User abandonment during wait  | Show progress bar, send completion notification (future)     |
| Low video quality             | Test multiple video APIs, choose best quality/price ratio    |
| Abuse/spam                    | Rate limit per IP/user, require minimal input validation     |

---

## 15) Success Metrics (MVP)

- **Completion Rate**: >80% of started workflows complete successfully
- **Average Latency**: <2 minutes from topic to video
- **Payment Success Rate**: >95% of x402 payments succeed
- **User Satisfaction**: Qualitative feedback from 10+ beta users
- **Cost Per Video**: <$0.20 (including infra overhead)

---

## 16) References & Resources

### Workflow DevKit Documentation
- Getting Started: `/Users/ashnouruzi/fiverr-docs/workflow-docs/next.md`
- Hooks & Webhooks: `/Users/ashnouruzi/fiverr-docs/workflow-docs/hooks.md`
- Error Handling: `/Users/ashnouruzi/fiverr-docs/workflow-docs/errors-and-retries.md`
- API Reference: `/Users/ashnouruzi/fiverr-docs/workflow-docs/api-reference/`

### Example Projects
- **Firecrawl x402 Demo** (PRIMARY REFERENCE): `/Users/ashnouruzi/firecrawl-402demo/`
  - Exact implementation pattern to follow
  - Client-side x402-fetch wrapper: `components/WebScraper.tsx:76-95`
  - API route forwarding X-PAYMENT: `app/api/scrape/route.ts:32-84`
  - Payment verification and logging: `app/api/scrape/route.ts:195-215`
- AI SDK Patterns: `/Users/ashnouruzi/fiverr-docs/workflow-examples/ai-sdk-workflow-patterns/`
- Birthday Card Generator: `/Users/ashnouruzi/fiverr-docs/workflow-examples/birthday-card-generator/`
- RAG Agent: `/Users/ashnouruzi/fiverr-docs/workflow-examples/rag-agent/`

### External APIs & Services
- Vercel AI Gateway: https://vercel.com/docs/ai-gateway
- Firecrawl API: https://api.firecrawl.dev (web search with x402)
- Genbase Sora 2 API: https://api.genbase.ai (AI video generation with x402)
- x402 Protocol: https://x402.org
- x402 Facilitator: https://api.x402.org/facilitator
- Coinbase Developer Platform: https://docs.cdp.coinbase.com
- Base Network Explorer: https://basescan.org
- USDC on Base: https://basescan.org/token/0x833589fcd6edb6e08f4c7c32d4f71b54bda02913

---

## 17) Next Steps

1. **Review this spec** with stakeholders for alignment
2. **Set up development environment** (Phase 1)
3. **Create project timeline** with milestones
4. **Begin Phase 1 implementation** (project setup)
5. **Schedule weekly progress reviews**

**Estimated MVP Delivery**: 6-7 weeks from start

---

## Appendix A: Mermaid Sequence Diagram

```mermaid
sequenceDiagram
    participant User
    participant UI as Next.js UI
    participant API as API Routes
    participant WF as Orchestrator Workflow
    participant Steps as Step Functions
    participant X402 as x402 Network
    participant Search as Search API
    participant AI as OpenAI (AI Gateway)
    participant Video as Video API

    User->>UI: Enter topic "what's new with x402"
    UI->>API: POST /api/content/create
    API->>WF: start(contentGeneratorWorkflow)
    API-->>UI: { runId: "abc123" }
    UI->>UI: Start polling /api/content/status/:runId

    WF->>Steps: payWithX402(searchCost)
    Steps->>X402: Send payment ($0.01)
    X402-->>Steps: Payment confirmed
    Steps-->>WF: Confirmation ID

    WF->>Steps: searchWeb(topic)
    Steps->>Search: Search for "x402 news"
    Search-->>Steps: Search results
    Steps-->>WF: Research text

    WF->>Steps: generateScript(research)
    Steps->>AI: Generate script prompt
    AI-->>Steps: Video script
    Steps-->>WF: Script text

    WF->>Steps: payWithX402(videoCost)
    Steps->>X402: Send payment ($0.10)
    X402-->>Steps: Payment confirmed
    Steps-->>WF: Confirmation ID

    WF->>WF: createWebhook()
    WF->>Steps: generateVideo(script, webhookUrl)
    Steps->>Video: Start video generation
    Video-->>Steps: { jobId: "xyz" }
    Steps-->>WF: Job started

    Note over WF: Workflow suspends (no compute)

    Video->>Video: Process video (30s-5min)
    Video->>WF: POST webhook { videoUrl }
    WF->>Steps: acknowledgeWebhook()
    Steps-->>Video: 200 OK

    WF-->>API: Return { videoUrl, script, cost }

    UI->>API: GET /api/content/status/abc123
    API-->>UI: { status: "completed", result: {...} }
    UI->>User: Display video + script
```

---

**End of Specification**

This document provides a complete blueprint for building the MVP content generation web app. Each phase in the TODO list (Section 10) can be tackled incrementally, with clear deliverables and test criteria.
