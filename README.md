# AI Content Generation with x402 Micropayments

An autonomous AI video generation platform that combines **Vercel Workflow DevKit**, **x402 micropayments**, and **Coinbase Developer Platform** to create AI-generated UGC videos with pay-per-use. The user types in a topic they want to make content on, the agent searches the web, creates a script based on its findings and generates the content using x402 to call and uses the tools and services it needs to complete the task.

🌐 **Live Demo:** [https://x402ugc.vercel.app/](https://x402ugc.vercel.app/)  
📦 **Repository:** [https://github.com/Must-be-Ash/content-agent](https://github.com/Must-be-Ash/content-agent)

## Overview

This application enables users to generate AI-powered video content by simply entering a topic. The system automatically:
- 🔍 Searches the web for relevant information (Firecrawl)
- 📝 Generates a video script using GPT-4o
- 🎥 Creates a video using Genbase AI video generation
- 💰 Handles micropayments via x402 protocol on Base (USDC)

**Key Innovation:** Hybrid client-server architecture that combines deterministic workflow orchestration with interactive x402 micropayment protocol.

## Quick Start

### Prerequisites
- Node.js 18+
- pnpm (recommended)
- Coinbase Developer Platform account
- OpenAI API key
- Firecrawl API key

### Installation

```bash
# Clone repository
git clone https://github.com/Must-be-Ash/content-agent.git
cd content-agent

# Install dependencies
pnpm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your API keys
```

### Environment Variables

```env
# CDP (Coinbase Developer Platform)
NEXT_PUBLIC_CDP_PROJECT_ID=your_cdp_project_id

# Firecrawl x402 API
FIRECRAWL_API_BASE_URL=https://api.firecrawl.dev/v2/x402/search
FIRECRAWL_API_KEY=your_firecrawl_api_key

# Genbase
GENBASE_API_URL=https://www.genbase.fun

# OpenAI
OPENAI_API_KEY=your_openai_api_key

# x402 Network (Base)
NEXT_PUBLIC_NETWORK=base
USDC_CONTRACT_ADDRESS=0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913
```

### Run Development Server

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) to see the application.

## Architecture

### High-Level Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                         User Interface                          │
│  (Next.js App Router + CDP Embedded Wallet + x402-fetch)       │
└────────────┬────────────────────────────────────────────────────┘
             │
             │ 1. User enters topic
             │
             ▼
┌─────────────────────────────────────────────────────────────────┐
│                    PHASE 1: Web Search                          │
│                    (Client-Side x402)                           │
└────────────┬────────────────────────────────────────────────────┘
             │
             │ x402 payment (~$0.01-0.05 USDC)
             ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Firecrawl API                              │
│         POST /v2/x402/search (x402 micropayment)                │
└────────────┬────────────────────────────────────────────────────┘
             │
             │ Returns research results
             ▼
┌─────────────────────────────────────────────────────────────────┐
│                    WORKFLOW PHASE 1                             │
│              Script Generation Workflow                         │
│          (Vercel Workflow DevKit - Server)                      │
└────────────┬────────────────────────────────────────────────────┘
             │
             │ Step: generateScript()
             ▼
┌─────────────────────────────────────────────────────────────────┐
│                      OpenAI GPT-4o                              │
│              (via Vercel AI Gateway - FREE)                     │
└────────────┬────────────────────────────────────────────────────┘
             │
             │ Returns script
             ▼
┌─────────────────────────────────────────────────────────────────┐
│                    PHASE 2: Video Creation                      │
│                    (Client-Side x402)                           │
└────────────┬────────────────────────────────────────────────────┘
             │
             │ x402 payment ($0.20 USDC)
             ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Genbase API                                │
│       POST /api/video/create-sora2 (x402 micropayment)          │
└────────────┬────────────────────────────────────────────────────┘
             │
             │ Returns taskId
             ▼
┌─────────────────────────────────────────────────────────────────┐
│                    WORKFLOW PHASE 2                             │
│               Video Polling Workflow                            │
│          (Vercel Workflow DevKit - Server)                      │
└────────────┬────────────────────────────────────────────────────┘
             │
             │ Poll every 2 minutes with sleep()
             ▼
┌─────────────────────────────────────────────────────────────────┐
│                  Genbase Status Endpoint                        │
│            GET /api/video/query?id={taskId} (FREE)              │
└────────────┬────────────────────────────────────────────────────┘
             │
             │ Video ready after 3-10 minutes
             ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Final Result                               │
│    Video URL + Script + Research + Cost Breakdown               │
└─────────────────────────────────────────────────────────────────┘
```

### Why This Architecture?

**Problem:** Vercel Workflow DevKit requires deterministic execution, but x402 micropayments involve interactive 402 status codes and payment retries.

**Solution:** Hybrid approach where:
- **Client-side**: Handles x402 payments using `x402-fetch` wrapper
- **Server-side workflows**: Orchestrate deterministic AI operations
- **Proxy API routes**: Bridge client payments with server API keys

## How It Works

### Two-Phase Workflow Design

#### Phase 1: Script Generation (~30 seconds)

1. **Client**: User enters topic (e.g., "what's new with x402")
2. **Client**: x402-wrapped fetch calls Firecrawl search API
   - `x402-fetch` automatically handles 402 → payment → retry
   - Payment settled on Base network (~$0.01-0.05 USDC)
3. **Server**: API route starts `contentGeneratorWorkflow`
4. **Workflow**: Receives research, streams progress updates
5. **Step**: `generateScript()` calls OpenAI GPT-4o via AI Gateway (free)
6. **Return**: Script + research results

#### Phase 2: Video Generation (~5 minutes)

1. **Client**: x402-wrapped fetch calls Genbase API
   - Payment settled on Base network ($0.20 USDC)
   - Returns video task ID
2. **Server**: API route starts `videoPollWorkflow`
3. **Workflow**: Polls Genbase status every 2 minutes using `sleep()`
   - Zero compute cost during sleep
   - Status: pending → processing → video_upsampling → Ready
4. **Step**: `checkVideoStatus()` queries Genbase (free, unlimited)
5. **Return**: Video URL + thumbnail + script + total cost

### x402 Payment Flow

```typescript
// Client setup (app/page.tsx)
const user = await getCurrentUser(); // CDP wallet
const viemAccount = await toViemAccount(user.evmAccounts[0]);
const walletClient = createWalletClient({
  account: viemAccount,
  chain: base,
  transport: http('https://mainnet.base.org'),
});

// Wrap fetch with x402 payment capability
const fetchFunc = wrapFetchWithPayment(fetch, walletClient, maxPaymentAmount);

// Call API - x402-fetch handles entire payment flow
const response = await fetchFunc('/api/test-firecrawl', {
  method: 'POST',
  body: JSON.stringify({ query, limit }),
});
```

**What happens under the hood:**
1. Client calls API without payment
2. Server forwards to Firecrawl (returns 402 Payment Required)
3. `x402-fetch` intercepts 402, creates payment authorization
4. Client retries with `X-PAYMENT` header
5. Server forwards payment proof to Firecrawl
6. Firecrawl verifies on-chain and returns results
7. Server forwards `X-PAYMENT-RESPONSE` with transaction hash
8. Client logs transaction on BaseScan

## Project Structure

```
content-agent/
├── app/
│   ├── page.tsx                          # Main UI (x402 payments + workflows)
│   ├── providers.tsx                     # CDP wallet configuration
│   ├── layout.tsx                        # Root layout
│   └── api/
│       ├── content/
│       │   ├── create/route.ts           # Start script generation workflow
│       │   ├── status/[runId]/route.ts   # Poll workflow status
│       │   ├── stream/[runId]/route.ts   # SSE progress updates
│       │   └── video-poll/route.ts       # Start video polling workflow
│       ├── test-firecrawl/route.ts       # Firecrawl proxy (x402)
│       └── genbase/
│           └── create-video/route.ts     # Genbase proxy (x402)
│
├── workflows/
│   ├── content-generator.ts              # Phase 1: Script generation workflow
│   ├── video-poll.ts                     # Phase 2: Video polling workflow
│   └── steps/
│       └── content-steps.ts              # All step functions (I/O operations)
│
├── lib/
│   ├── config.ts                         # Environment configuration
│   ├── payment-logger.ts                 # x402 transaction logging
│   └── rate-limit.ts                     # In-memory rate limiter
│
├── types/
│   └── firecrawl.d.ts                    # TypeScript definitions
│
└── next.config.ts                        # Workflow DevKit integration
```

### Key Files Explained

#### `app/page.tsx` (695 lines)
**Main application logic:**
- CDP wallet authentication
- x402 payment setup with `x402-fetch`
- Two-phase workflow orchestration
- Real-time progress updates via SSE
- Result display with cost breakdown

**Critical functions:**
- `handleSubmit()`: Orchestrates entire flow
- `createVideoAndStartPolling()`: Phase 2 video creation
- `pollWorkflowUntilComplete()`: Checks workflow status every 20s

#### `app/api/test-firecrawl/route.ts`
**Firecrawl proxy with x402 support:**
- Extracts `X-PAYMENT` header from client
- Adds `Authorization: Bearer {API_KEY}`
- Forwards both headers to Firecrawl
- Returns 402 or forwards `X-PAYMENT-RESPONSE`

**Why needed?** Keeps API key secret while enabling client-side x402 payments.

#### `workflows/content-generator.ts`
**Script generation workflow** (`"use workflow"`):
- Receives research from client
- Streams progress updates
- Calls `generateScript()` step
- Returns script + metadata

**Key constraint:** No direct I/O allowed (deterministic execution).

#### `workflows/steps/content-steps.ts`
**All step functions** (`"use step"`):
- `generateScript()`: Calls OpenAI GPT-4o via Vercel AI SDK
- `checkVideoStatus()`: Queries Genbase for video readiness
- `writeProgress()`: Sends progress updates to client

**Key feature:** Automatic retries with exponential backoff.

## Technology Stack

### Core Framework
- **Next.js 16** with App Router
- **React 19** (Server Components)
- **TypeScript** for type safety
- **Tailwind CSS v4** for styling

### Workflow Orchestration
- **Vercel Workflow DevKit** (WDK)
  - Durable execution with automatic retries
  - Zero-cost `sleep()` for polling
  - Progress streaming with Server-Sent Events

### Payments & Wallet
- **x402 Protocol** - Pay-per-use HTTP requests
- **x402-fetch** - Client-side payment wrapper
- **Coinbase Developer Platform** - Embedded wallets
- **Viem** - Ethereum interactions
- **Base Network** - L2 for low-cost USDC transactions

### AI Services
- **OpenAI GPT-4o** - Script generation (via Vercel AI Gateway)
- **Genbase** - AI video generation (Sora 2 via x402)
- **Firecrawl** - Web search with x402 micropayments

### Additional Libraries
- **Framer Motion** - UI animations
- **Axios** - HTTP client
- **Zod** - Schema validation

## Cost Breakdown

| Service | Cost | Payment Method | Timing |
|---------|------|----------------|--------|
| **Firecrawl Search** | ~$0.03 | x402 on Base | Before Phase 1 |
| **Script Generation** | ~$0.01 | AI Gateway | During Phase 1 |
| **Genbase Video (15s)** | $0.20 | x402 on Base | Before Phase 2 |
| **Video Polling** | Free | No auth | During Phase 2 |
| **Total per video** | **~$0.25** | | |

*Free with Vercel AI Gateway quota

**Gas Costs on Base:**
- Per transaction: ~$0.0004-0.001
- Covered by CDP facilitator (users pay service cost only)

## Development

### Inspect Workflows (Local)

```bash
# Terminal UI
npx workflow inspect runs

# Web UI
npx workflow inspect runs --web
```

### View Workflow Logs

```bash
# Follow workflow execution
npx workflow logs {runId} --follow
```

### Production Deployment

**Vercel (Recommended):**
```bash
vercel deploy
```

**Environment:**
- Workflows auto-deployed with Next.js app
- Access Workflow dashboard: Vercel → AI → Workflows
- Monitor runs, view timelines, debug errors

## Key Concepts

### Vercel Workflow DevKit

**Workflows (`"use workflow"`):**
- Deterministic orchestration (pure control flow)
- Can use: `sleep()`, `getWritable()`, `createWebhook()`
- Cannot use: `fetch()`, `Date.now()`, `Math.random()`

**Steps (`"use step"`):**
- Handle all I/O operations
- Automatic retries with backoff
- Throw `FatalError` for non-retryable errors

### x402 Micropayments

**Protocol:** HTTP 402 "Payment Required" status code
**Network:** Base (Ethereum L2)
**Currency:** USDC (6 decimals)
**Contract:** `0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913`

**Flow:**
1. Request → 402 response with payment requirements
2. Client creates payment authorization
3. Retry with `X-PAYMENT` header
4. Server verifies and processes
5. Returns `X-PAYMENT-RESPONSE` with TX hash

### CDP Embedded Wallets

**Features:**
- Email-based wallet creation (no seed phrases)
- EOA wallets for simplicity
- Seamless x402 payment signing

**Hooks:**
- `useIsInitialized()` - CDP ready
- `useIsSignedIn()` - User authenticated
- `useCurrentUser()` - Get wallet addresses

## Production Considerations

### Before Going Live

- [ ] Replace in-memory rate limiter with Redis
- [ ] Add database for workflow history
- [ ] Implement error monitoring (Sentry)
- [ ] Store transaction receipts
- [ ] Add wallet funding flow (buy USDC)
- [ ] SSL/HTTPS for all endpoints
- [ ] CORS configuration for domain

### Scaling

- **Workflow storage:** Vercel (prod) or Postgres
- **Rate limiting:** Redis/Upstash
- **Video storage:** CDN or S3 mirror
- **Payment tracking:** Database with receipts

## Troubleshooting

### "402 Payment Required" Error
- Check wallet has sufficient USDC balance
- Verify `USDC_CONTRACT_ADDRESS` is correct for Base
- Ensure CDP wallet is initialized

### Workflow Stuck
- Check workflow logs: `npx workflow logs {runId}`
- Verify external API availability (Firecrawl, Genbase)
- Check rate limits

### Video Generation Timeout
- Video generation takes 3-10 minutes (normal)
- Workflow retries up to 8 times (16 minutes max)
- Check Genbase API status

## Learn More

- [Vercel Workflow DevKit Docs](https://vercel.com/docs/workflow)
- [x402 Protocol Spec](https://www.x402.org)
- [CDP Documentation](https://docs.cdp.coinbase.com)
- [Genbase Documentation](https://www.genbase.fun)
- [More Projects](https://cdpcollection.com)

## License

MIT
