# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is an **AI Content Generation Web App with x402 Micropayments** - users enter topics and receive AI-generated video content. The system uses Vercel Workflow DevKit (WDK) for orchestration, x402 micropayments on Base network for pay-per-use services, and Coinbase Developer Platform (CDP) embedded wallets for seamless payment handling.

**Primary Reference**: This project follows the EXACT pattern from `/Users/ashnouruzi/firecrawl-402demo` for x402 payment integration.

## Development Commands

```bash
# Development server
npm run dev

# Production build
npm run build

# Start production server
npm start

# Lint code
npm run lint
```

## Key Technologies

- **Framework**: Next.js 16 with App Router
- **Orchestration**: Vercel Workflow DevKit (`workflow`, `@workflow/next`, `@workflow/ai`)
- **AI Services**:
  - Script Generation: OpenAI GPT-4o via Vercel AI Gateway
  - Video Generation: Genbase Sora 2 API ($0.20 USDC per 10s video)
  - Web Search: Firecrawl API (~$0.01-0.05 USDC per search)
- **Payments**: x402 protocol on Base network (Chain ID 8453)
- **Currency**: USDC on Base (Contract: `0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913`)
- **Wallet**: Coinbase Developer Platform embedded wallets
- **Styling**: Tailwind CSS v4

## Core Architecture

### Workflow DevKit (WDK) Directives

Two primary directives transform async JavaScript into durable, resumable workflows:

1. **`"use workflow"`**: Deterministic orchestrator functions
   - Pure control flow logic (branching, loops, Promise.all)
   - No direct I/O, DB, or Node.js APIs (ensures replay determinism)
   - Can use: `sleep()`, `createWebhook()`, `defineHook()`, `createHook()`

2. **`"use step"`**: Retryable units of work with full Node.js access
   - Handle side effects: APIs, DB calls, file I/O, external services
   - Automatic retries with configurable backoff
   - Throw `FatalError` for non-retryable conditions

### File Structure (When Implementing)

```
/app
  /api
    /content
      /create/route.ts              # Start workflow with start(orchestrator, [jobSpec])
      /status/[runId]/route.ts      # Check workflow status with getRun(runId)
    /wallet
      /balance/route.ts             # Check USDC balance
  /providers.tsx                    # CDPReactProvider setup
  /layout.tsx                       # Wrap with Providers
  /page.tsx                         # Main UI with @x402/fetch (v2) integration
/workflows
  /content-generator.ts             # Main orchestrator workflow
  /steps
    /content-steps.ts               # Steps: searchWeb, generateScript, createSora2Video, etc.
/components
  /ui/                              # shadcn components
  /sign-in-screen.tsx
  /wallet-status.tsx
/lib
  /config.ts                        # CDP, Firecrawl, app config
/types
  /firecrawl.d.ts                   # TypeScript types
next.config.ts                      # export default withWorkflow(nextConfig)
```

## x402 Payment Integration Pattern

**CRITICAL**: Follow the EXACT pattern from `/Users/ashnouruzi/firecrawl-402demo`:

### Client Side (app/page.tsx)
```typescript
// 1. Get CDP user and convert to viem account
const user = await getCurrentUser();
const viemAccount = await toViemAccount(user.evmAccounts[0]);

// 2. Create public client for Base network
const publicClient = createPublicClient({
  chain: base,
  transport: http('https://mainnet.base.org'),
});

// 3. Wrap fetch with x402 v2 payment capability
// registerExactEvmScheme registers v2 (eip155:*) AND v1 schemes, so v1-only services (Genbase) still work
const maxPaymentAmount = BigInt(0.1 * 10 ** 6); // 0.1 USDC
const client = new x402Client();
registerExactEvmScheme(client, {
  signer: toClientEvmSigner(viemAccount, publicClient),
  policies: [(_v, reqs) => reqs.filter((r) => BigInt(r.amount ?? r.maxAmountRequired) <= maxPaymentAmount)],
});
const fetchFunc = wrapFetchWithPayment(fetch, client);

// 4. Call API - @x402/fetch automatically handles 402 → payment → retry
const response = await fetchFunc('/api/content/create', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ topic, userId }),
});
```

### API Route (app/api/content/create/route.ts)
```typescript
// Extract and forward payment header to workflow (v2: PAYMENT-SIGNATURE, v1: X-PAYMENT)
const paymentHeader = request.headers.get('PAYMENT-SIGNATURE') ?? request.headers.get('X-PAYMENT');
await start(contentGeneratorWorkflow, [{ topic, paymentHeader, ... }]);
```

### Workflow Step (workflows/steps/content-steps.ts)
```typescript
"use step";

// Forward payment header to service (Firecrawl or Genbase)
const headers: Record<string, string> = {
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${API_KEY}`,
};

if (params.paymentHeader) {
  // v2 payloads → PAYMENT-SIGNATURE, v1 payloads (x402Version: 1) → X-PAYMENT
  headers[paymentHeaderName] = params.paymentHeader;
}

// Service verifies payment and returns PAYMENT-RESPONSE (v1: X-PAYMENT-RESPONSE) with TX hash
const response = await axios.post(endpoint, body, { headers });
```

## Workflow Patterns

### Main Content Generator Flow
1. **Search web** with Firecrawl (x402 payment via client wrapper)
2. **Generate script** using OpenAI GPT-4o via AI Gateway
3. **Create video** with Genbase Sora 2 (x402 payment)
4. **Poll for completion** using `sleep('30s')` (FREE query endpoint)
5. **Return video URL** with cost breakdown

### Key WDK APIs

**In Workflows:**
- `sleep(duration)` - Pause execution without compute (e.g., "30s", "2h")
- `createWebhook({ respondWith })` - Create callback URL for async services
- `defineHook<T>()` - Define hook type for external events

**In API Routes:**
- `start(workflowFn, args)` - Start workflow, returns `{ runId }`
- `getRun(runId)` - Check workflow status
- `resumeHook(token, payload)` - Resume paused workflow

**In Steps:**
- Throw `FatalError` - Skip retries for non-transient errors
- Throw `Error` - Trigger automatic retry with backoff

## Genbase Sora 2 API

### Create Video (Paid via x402)
**POST** `https://www.genbase.fun/api/video/create-sora2`
- **Cost**: $0.20 USDC per 10s video
- **Headers**: `PAYMENT-SIGNATURE` / `X-PAYMENT` (from @x402/fetch wrapper)
- **Body**: `{ prompt, model: "sora-2", seconds: "10", size: "1280x720" }`
- **Returns**: `{ data: { id: "sora-2:task_..." } }`
- **Status progression**: pending → processing → video_upsampling → Ready

### Query Video Status (FREE)
**GET** `https://www.genbase.fun/api/video/query?id=<task_id>`
- **Cost**: FREE (no payment required, unlimited polling)
- **Returns**: `{ data: { status, video_url, thumbnail_url } }`
- **Generation time**: 3-10 minutes

### Polling Strategy
```typescript
"use step";
for (let attempt = 1; attempt <= maxAttempts; attempt++) {
  const response = await axios.get(queryEndpoint, { params: { id: taskId } });
  if (response.data.data.status === 'Ready') {
    return response.data.data.video_url;
  }
  await import('workflow').then(m => m.sleep('30s')); // Zero compute cost
}
```

## Firecrawl API (x402)

**POST** `https://api.firecrawl.dev/v2/x402/search`
- **Cost**: ~$0.01-0.05 USDC per search
- **Headers**: `Authorization: Bearer ${FIRECRAWL_API_KEY}`, `PAYMENT-SIGNATURE` / `X-PAYMENT` (forwarded)
- **Body**: `{ query, limit, sources: ['web'], scrapeOptions: { onlyMainContent: true } }`
- **Returns**: `{ data: { web: [{ title, url, markdown }] } }`

## Next.js + Workflow Integration

```typescript
// next.config.ts
import { withWorkflow } from 'workflow/next';
import type { NextConfig } from 'next';

const nextConfig: NextConfig = { /* config */ };
export default withWorkflow(nextConfig);
```

Auto-generated routes:
- `/.well-known/workflow/v1/webhook/:token` - Webhook handler
- `/.well-known/workflow/v1/flow` - Workflow execution
- `/.well-known/workflow/v1/step` - Step execution

## CDP Embedded Wallet Setup

```typescript
// app/providers.tsx
import { CDPReactProvider } from '@coinbase/cdp-react';

const CDP_CONFIG = {
  projectId: process.env.NEXT_PUBLIC_CDP_PROJECT_ID ?? '',
};

export default function Providers({ children }) {
  return (
    <CDPReactProvider config={CDP_CONFIG} app={{ name: 'AI Content Generator' }}>
      {children}
    </CDPReactProvider>
  );
}
```

**CDP Hooks:**
- `useIsInitialized()` - Check if CDP is ready
- `useIsSignedIn()` - Check authentication status
- `useEvmAddress()` - Get wallet address

## Observability

**Development:**
```bash
npx workflow inspect runs          # CLI view
npx workflow inspect runs --web    # Web UI
```

**Production (Vercel):**
- Navigate to AI → Workflows dashboard
- View run timelines, step logs, inputs/outputs
- Monitor errors with retry histories

## Important Constraints

1. **Workflow functions must be deterministic**
   - No `Math.random()`, `Date.now()`, or nondeterministic operations
   - No direct file system, database, or network calls
   - All side effects must be in steps

2. **x402 payment flow**
   - Payment handled client-side by @x402/fetch wrapper
   - Payment header (PAYMENT-SIGNATURE / X-PAYMENT) forwarded through API → workflow → steps
   - Services verify payment and return PAYMENT-RESPONSE with TX hash

3. **Base network (Chain ID 8453)**
   - All payments in USDC (6 decimals)
   - View transactions on BaseScan: https://basescan.org/tx/{hash}

## Cost Breakdown (Per Video)

| Service | Cost | Payment | Provider |
|---------|------|---------|----------|
| Web Search (5-10 results) | $0.01-0.05 | x402 on Base | Firecrawl |
| Script Generation | $0.00* | AI Gateway | OpenAI GPT-4o |
| Video (10s, 720p) | $0.20 | x402 on Base | Genbase Sora 2 |
| **Total** | **~$0.25** | | |

*Free with Vercel AI Gateway

## Documentation References

**Specification:**
- `content-gen-mvp-spec.md` - Complete technical specification with implementation phases

**Workflow Documentation (in content-agent-docs/):**
- `workflow-docs/workflows-and-steps.md` - Core concepts
- `workflow-docs/hooks.md` - Hook patterns
- `workflow-docs/errors-and-retries.md` - Error handling
- `workflow-docs/api-reference/` - Complete API docs

**Workflow Examples (in content-agent-docs/):**
- Reference implementation patterns
- See `START_HERE.md` for navigation guide

**Primary x402 Reference:**
- `/Users/ashnouruzi/firecrawl-402demo/` - EXACT pattern to follow

## Security Notes

- Never commit API keys or secrets to git
- Store credentials in environment variables
- Use secret tokens in webhook URLs
- Sign payment requests in steps (never in workflows)
- Payment headers (PAYMENT-SIGNATURE / X-PAYMENT) should only be forwarded, never generated in server code
- You have access to all the information you need about workflow kit including all the docs, API references, error handeling and the repo and code examples here in these three folders:
  /Users/ashnouruzi/content-agent/content-agent-docs/workflow-docs
  /Users/ashnouruzi/content-agent/content-agent-docs/workflow-examples
  /Users/ashnouruzi/content-agent/content-agent-docs/workflow-repo

  and here are reference guides for using workflow kit:
  /Users/ashnouruzi/content-agent/START_HERE.md
  /Users/ashnouruzi/content-agent/WORKFLOW_EXAMPLES_ANALYSIS.md
  /Users/ashnouruzi/content-agent/WORKFLOW_EXAMPLES_MATRIX.md
  /Users/ashnouruzi/content-agent/WORKFLOW_EXAMPLES_README.md
  /Users/ashnouruzi/content-agent/WORKFLOW_QUICK_REFERENCE.md
  /Users/ashnouruzi/content-agent/workflow.md
- we are using 'pnpm' not 'npm'
- we are using https://api.firecrawl.dev/v2/x402/search set as FIRECRAWL_API_BASE_URL in .env which is the x402 endpoint for firecrawl. we have FIRECRAWL_API_KEY that we need to use in the payment header of the x402 firecrawl call.
- Follow this functional code example /Users/ashnouruzi/firecrawl-402demo EXACTLY for setting up Firecrawl using x402