# Workflow Examples Repository - Comprehensive Analysis

## Overview

The `/Users/ashnouruzi/fiverr-docs/workflow-examples` directory contains 8 major example projects demonstrating different patterns and use cases for the Vercel Workflow DevKit.

---

## Key Example Projects

### 1. **AI SDK Workflow Patterns** (`ai-sdk-workflow-patterns/`)
**Focus**: AI agent architecture patterns with durability

**Patterns Implemented**:
- **Sequential Workflow**: Multi-step AI processing with quality checks and conditional regeneration
  - Generate content → Check quality → Conditionally regenerate if below threshold
  - Uses Zod for schema validation
  - Demonstrates retry logic for quality failures

- **Parallel Workflow**: Concurrent AI operations with aggregation
  - Parallel code reviews (security, performance, maintainability)
  - Uses `Promise.all()` for concurrent steps
  - Aggregates results with a summary step

- **Routing Workflow**: Dynamic routing based on input classification
  - Classify input first → Route to appropriate model/prompt
  - Demonstrates model selection based on complexity
  - Different system prompts per route (general, refund, technical)

- **Orchestrator/Worker Pattern**: Coordinated multi-agent execution
  - Orchestrator (architect) creates a plan with file changes
  - Workers execute in parallel based on plan
  - Specialized worker prompts per change type (create/modify/delete)

- **Evaluator Loop**: Iterative improvement with evaluation feedback
  - Initial generation → Evaluate → Improve based on feedback
  - Loop with MAX_ITERATIONS threshold (typically 3)
  - Uses larger models for evaluation, smaller for generation
  - Quality score threshold for early exit

**Tech Stack**:
- Next.js 15 (App Router)
- AI SDK with `generateText()` and `generateObject()`
- Zod for schema validation
- Vercel AI Gateway

**Key Implementation Detail**:
```typescript
globalThis.fetch = fetch; // Use Workflow's fetch for AI SDK integration
'use workflow'; // Marks function as durable workflow
```

---

### 2. **Birthday Card Generator** (`birthday-card-generator/`)
**Focus**: End-to-end workflow with multiple AI integrations and external APIs

**Workflow Structure** (5 Steps):
1. **Generate Prompts** - Create separate text and image prompts
2. **Generate Assets** (Parallel)
   - Generate Image via Google Gemini 2.5 Flash Image
   - Generate Message via GPT-5-nano
3. **Request RSVPs** (Webhook Pattern)
   - Send RSVP emails with webhook URLs
   - Await webhook responses from multiple recipients
4. **Wait Until Event Date** - Use `sleep()` for delayed execution
5. **Send Birthday Card** - Email final card to recipient

**Key Patterns**:
- **Webhook Integration** (`createWebhook()`)
  - Wait for external HTTP callbacks
  - Multiple concurrent webhooks with `Promise.all()`
  - Deterministic webhook URLs

- **Parallel AI Calls**:
  ```typescript
  const [image, text] = await Promise.all([
    generateImage(imagePrompt),
    generateMessage(textPrompt),
  ]);
  ```

- **Step Definition** (`'use step'` directive):
  - Marks individual functions as retryable steps
  - Automatic retry handling for transient failures
  - Used in `generate-image.ts` and `generate-message.ts`

**File Structure**:
```
birthday-card-generator/
├── app/
│   └── api/generate/
│       ├── route.ts (API entry point)
│       ├── generate-birthday-card.ts (main workflow)
│       ├── generate-image.ts (step 1)
│       ├── generate-message.ts (step 2)
│       ├── generate-prompts.ts (step 1)
│       ├── request-rsvp.ts (step 3)
│       └── send-recipient-email.ts (step 5)
```

**API Pattern**:
```typescript
const result = await start(generateBirthdayCard, [
  prompt,
  recipientEmail,
  rsvpEmails,
  eventDate
]);
const values = await result.returnValue;
```

---

### 3. **Flight Booking App** (`flight-booking-app/`)
**Focus**: Conversational AI agent with tool calling and stream reconnection

**Key Features**:
- **Retryable AI Calls**: `streamText()` with tools wrapped in `'use step'`
- **Multi-turn Conversations**: Workflow orchestrates tool-calling loop
- **Stream Reconnection**: Client can reconnect to in-progress workflows
- **Tool Execution**: 5 flight booking tools (search, status, airport info, booking, baggage)
- **Error Simulation**: 30% random failure rate to showcase retries

**Workflow Pattern**:
```typescript
const agent = new DurableAgent({
  model: "bedrock/claude-4-sonnet",
  system: FLIGHT_ASSISTANT_PROMPT,
  tools: flightBookingTools,
});

await agent.stream({
  messages: convertToModelMessages(messages),
  writable
});
```

**Tech Stack**:
- AWS Bedrock models
- DurableAgent (Workflow AI utility)
- Tool-based agent architecture

---

### 4. **RAG Agent Example** (`rag-agent/`)
**Focus**: Retrieval-Augmented Generation with persistent storage

**Architecture**:
- PostgreSQL with pgvector for embeddings
- Drizzle ORM for database access
- AI Gateway for model access
- Vercel Workflow for durability

**Use Case**:
- Knowledge base retrieval
- Durable RAG pipeline with automatic retries
- Production-ready database integration

---

### 5. **Custom Adapter (Bun)** (`custom-adapter/`)
**Focus**: Workflow integration with non-Node.js runtimes

**Key Concepts**:
- **"use workflow"** directive marks durable workflow functions
- **"use step"** directive marks individual retryable steps
- **SWC Plugin** for compile-time transformation
- **Webhook Support** for external integrations

**Example Workflow** (User Signup):
```typescript
export async function handleUserSignup(email: string) {
  "use workflow";
  
  const user = await createUser(email);          // Step 1
  await sendWelcomeEmail(user);                  // Step 2
  await sleep("5s");                             // Wait 5 seconds
  
  const webhook = createWebhook();
  await sendOnboardingEmail(user, webhook.url);  // Step 3
  await webhook;                                  // Wait for callback
  
  return { userId: user.id, status: "onboarded" };
}
```

**Bun-Specific Features**:
- Uses Bun runtime instead of Node.js
- SWC transformation at build time
- HTTP server via `Bun.serve()`
- Endpoints: `/.well-known/workflow/v1/flow` and `/.well-known/workflow/v1/step`

---

### 6. **Actor Pattern Example** (`actors/`)
**Focus**: Stateful, long-running processes with event-driven architecture

**Pattern Components**:
1. **defineHook()** - Type-safe event definition
2. **Event Loop** - `for await...of` over hook events
3. **State Management** - `getState()` / `setState()` persistence
4. **Sequential Processing** - Events processed one at a time

**Architecture**:
```typescript
const counterActorHook = defineHook<CounterEvent>();

const receiveEvent = counterActorHook.create({
  token: `counter_actor:${actorId}`
});

for await (const event of receiveEvent) {
  const state = await getState(actorId);
  const newState = await computeNewState(state, event);
  await setState(actorId, newState);
}
```

**API Endpoints**:
- `POST /api/actor` - Start new actor
- `POST /api/actor/[actorId]/event` - Send event
- `GET /api/actor/[actorId]/state` - Get state

**Use Cases**:
- Game state management
- Order processing systems
- User session management
- Stateful chatbots

---

### 7. **Framework Integrations**

#### Next.js Integration (`nextjs/`)
- Template for Next.js projects with Workflow
- RESTful API endpoints
- Standard workflow startup via `/api/signup`

#### SvelteKit Integration (`sveltekit/`)
- Alternative to Next.js
- Server-side workflows

---

## Core Workflow Patterns & Best Practices

### 1. **Workflow Definition**
```typescript
export async function myWorkflow(input: string) {
  'use workflow';  // Required directive
  // workflow logic here
}
```

### 2. **Step Definition**
```typescript
async function myStep(data: string) {
  'use step';  // Marks as retryable step
  // step logic here
}
```

### 3. **Starting Workflows**
```typescript
import { start } from 'workflow/api';

const result = await start(myWorkflow, [arg1, arg2]);
const finalValue = await result.returnValue;
```

### 4. **AI SDK Integration**
```typescript
import { generateText, generateObject } from 'ai';
import { fetch } from 'workflow';

// Override fetch to use workflow version
globalThis.fetch = fetch;

const { text } = await generateText({
  model: 'openai/gpt-4o',
  prompt: 'Your prompt here'
});
```

### 5. **Parallel Execution**
```typescript
const [result1, result2, result3] = await Promise.all([
  step1(),
  step2(),
  step3()
]);
```

### 6. **Webhook Integration**
```typescript
const webhook = createWebhook();
await sendEmailWithCallback(webhook.url);
const request = await webhook;  // Wait for callback
```

### 7. **Delayed Execution**
```typescript
import { sleep } from 'workflow';

await sleep('5s');      // 5 seconds
await sleep('1m');      // 1 minute
await sleep('1h');      // 1 hour
```

### 8. **Error Handling**
```typescript
import { FatalError } from 'workflow';

try {
  // workflow logic
} catch (error) {
  if (shouldRetry) {
    throw error;  // Will retry
  } else {
    throw new FatalError('Non-recoverable error');
  }
}
```

---

## API Call Patterns

### External API Integration
All examples use:
- **AI Gateway** for model access (no direct API keys)
- **Vercel-hosted models** (Google Gemini, OpenAI, etc.)
- **Error Simulation** for testing retry behavior

### Model Routing
```typescript
// Choose model based on conditions
const model = isComplex ? 'openai/gpt-4o' : 'openai/gpt-4o-mini';

const { text } = await generateText({ model, prompt });
```

---

## Webhook & Payment Patterns

### Webhook Pattern (Birthday Card Example)
```typescript
// Create webhook for RSVP
const webhooks = rsvpEmails.map(() => createWebhook());

// Send emails with webhook URLs
await Promise.all(
  rsvpEmails.map((email, i) => 
    requestRsvp(email, webhooks[i].url)
  )
);

// Wait for all responses
const rsvpReplies = await Promise.all(
  webhooks.map(webhook => 
    webhook.then(request => {
      const url = new URL(request.url);
      const reply = url.searchParams.get('reply');
      return { email, reply };
    })
  )
);
```

### No Direct Payment Patterns Found
- Examples use AI Gateway for LLM calls
- No Stripe/payment processor integration examples
- Could be built using webhook pattern for payment confirmations

---

## Workflow vs Steps Architecture

### Workflow Level
- **Scope**: Entire multi-step process
- **Directive**: `'use workflow'`
- **Durability**: Full workflow state persisted
- **Entry Point**: Called via `start()` API
- **Responsibility**: Orchestrate multiple steps

### Step Level
- **Scope**: Individual operation
- **Directive**: `'use step'`
- **Durability**: Step state persisted separately
- **Responsibility**: Execute atomic operation
- **Retry**: Built-in automatic retry on failure
- **Observability**: Step-level logging/metrics

### Example Hierarchy
```typescript
// Workflow Level - Orchestrates entire process
export async function generateBirthdayCard(prompt, email) {
  'use workflow';
  
  // Call step 1
  const prompts = await generatePrompts(prompt);
  
  // Call steps in parallel
  const [image, text] = await Promise.all([
    generateImage(prompts.imagePrompt),
    generateMessage(prompts.textPrompt)
  ]);
  
  // Call step 3
  await sendEmail(email, image, text);
}

// Step Level - Individual operations
async function generateImage(prompt) {
  'use step';
  const { files } = await generateText({
    model: 'google/gemini-2.5-flash-image',
    prompt
  });
  return formatImageData(files[0]);
}
```

---

## Key Technologies Used Across Examples

### AI/LLM
- **OpenAI**: GPT-4o, GPT-4o-mini, o4-mini, GPT-5-nano
- **Google**: Gemini 2.5 Flash Image
- **AWS Bedrock**: Claude 4 Sonnet
- **Vercel AI Gateway**: Unified model access

### Framework
- **Next.js 15** (primary)
- **SvelteKit** (alternative)
- **Bun** (runtime alternative)

### Data & Persistence
- **PostgreSQL + pgvector** (RAG example)
- **Drizzle ORM** (database layer)
- **Redis** (mentioned for state)
- **In-memory** (actor state store)

### UI & Styling
- **React 19**
- **shadcn/ui** (component library)
- **Tailwind CSS 4**
- **Radix UI** (primitives)

### Email
- **Resend** (email delivery)
- **React Email** (email templates)

### Utilities
- **Zod** (schema validation)
- **React Hook Form** (form handling)
- **Recharts** (data visualization)

---

## Dependencies Summary

### Core Workflow
```json
{
  "workflow": "4.0.1-beta.6",
  "ai": "^5.0.68"
}
```

### Next.js Setup
```json
{
  "next": "15.5.4",
  "react": "19.1.0",
  "react-dom": "19.1.0"
}
```

### Build Tools
- Turbopack (Next.js 15 bundler)
- SWC (TypeScript compiler)
- Tailwind CSS 4

---

## Observability Patterns

All examples include comprehensive logging:

```typescript
console.log('[WORKFLOW]', 'Starting workflow');
console.log('[Step N/Total] Finished', { duration, result });
console.error('[WORKFLOW] Error:', message);
```

**Log Format**:
- `[WORKFLOW]` prefix for workflow-level events
- `[Step N/Total]` for step progress
- Timing metrics (duration)
- Result snapshots

---

## Deployment

All examples support:
- **Local Development**: `pnpm dev` or `bun dev`
- **Vercel Deployment**: Native workflow support
- **Environment Setup**: AI Gateway handles auth on Vercel

### Example: Birthday Card Generator
- Zero env vars needed for Vercel (AI Gateway auth built-in)
- Optional `.env.local` for local development

---

## Recommended Project Structure

```
project/
├── app/
│   ├── api/
│   │   └── [workflow-endpoint]/
│   │       └── route.ts (start workflow)
│   ├── layout.tsx
│   └── page.tsx (UI)
├── workflows/
│   ├── main-workflow.ts (orchestrator)
│   ├── step-1.ts ('use step')
│   ├── step-2.ts ('use step')
│   └── ...
├── lib/
│   ├── utils.ts
│   └── types.ts
├── components/
│   └── ui/
├── env.ts (environment validation)
├── package.json
└── tsconfig.json
```

---

## Summary: When to Use Each Pattern

| Pattern | Best For | Example |
|---------|----------|---------|
| **Sequential** | Multi-step processes with quality gates | Content generation with validation |
| **Parallel** | Independent concurrent operations | Code review (3 reviewers in parallel) |
| **Routing** | Dynamic execution paths | Customer support (route by query type) |
| **Orchestrator/Worker** | Coordinated multi-agent systems | Feature implementation (plan → execute) |
| **Evaluator Loop** | Iterative improvement | Translation refinement (evaluate → improve) |
| **Webhook** | External async notifications | RSVP requests, payment confirmations |
| **Actor** | Long-running stateful processes | Game state, order processing |
| **DurableAgent** | Conversational AI with tools | Chat assistants, support bots |

