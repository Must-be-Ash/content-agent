# Workflow Examples - Feature & Pattern Comparison Matrix

## Example Projects Feature Matrix

| Feature | ai-sdk patterns | birthday-card | flight-booking | rag-agent | custom-adapter | actors | nextjs | sveltekit |
|---------|-----------------|---------------|----------------|-----------|----------------|--------|--------|-----------|
| **AI Integration** | ✓✓✓ | ✓✓ | ✓✓✓ | ✓✓ | - | - | ✓ | ✓ |
| **Webhook Pattern** | - | ✓✓✓ | - | - | ✓ | - | - | - |
| **Database** | - | - | - | ✓✓ | - | ✓ | - | - |
| **Tool Calling** | - | - | ✓✓✓ | - | - | - | - | - |
| **Email Integration** | - | ✓✓ | - | - | - | - | - | - |
| **Actor Pattern** | - | - | - | - | - | ✓✓✓ | - | - |
| **UI Component** | ✓ | ✓ | ✓ | ✓ | - | ✓ | - | - |
| **Bun Runtime** | - | - | - | - | ✓✓ | - | - | - |
| **Multiple Models** | ✓✓ | ✓ | ✓ | ✓ | - | - | - | - |
| **Streaming** | - | - | ✓✓ | ✓ | - | - | - | - |

Legend: ✓✓✓ = Primary Focus, ✓✓ = Strong Feature, ✓ = Included

---

## AI Pattern Implementation Comparison

| Pattern | Implementation | Lines of Code | Complexity | Use Case |
|---------|---|---|---|---|
| **Sequential** | ai-sdk-patterns | ~25 | Low | Content gen + validation |
| **Parallel** | ai-sdk-patterns | ~35 | Low-Med | Multi-reviewer scenarios |
| **Routing** | ai-sdk-patterns | ~30 | Med | Dynamic path selection |
| **Orchestrator** | ai-sdk-patterns | ~45 | Med | Multi-agent coordination |
| **Evaluator Loop** | ai-sdk-patterns | ~55 | Med-High | Iterative refinement |
| **Tool Calling** | flight-booking | ~100+ | High | Complex agent interactions |
| **RAG** | rag-agent | ~150+ | High | Knowledge-based systems |

---

## API Pattern Comparison

| Pattern | File Location | Models Used | Key Primitives |
|---------|---|---|---|
| **Generate + Validate** | sequential-workflow.ts | gpt-4o | generateText, generateObject |
| **Parallel Reviews** | parallel-workflow.ts | gpt-4o (×3) + aggregator | Promise.all, generateObject |
| **Classification Router** | routing-workflow.ts | gpt-4o + conditional | generateObject, conditional logic |
| **Plan → Execute** | orchestrator-workflow.ts | gpt-4o (×N+1) | map, Promise.all, specialized prompts |
| **Improve Loop** | evaluator-workflow.ts | gpt-4o + gpt-4o-mini | while loop, quality threshold |
| **Tool-Based** | flight-booking/index.ts | claude via bedrock | DurableAgent, streamText |
| **RAG** | rag-agent/* | varies | embeddings, pgvector, generateText |

---

## Webhook Implementation Patterns

### Birthday Card Generator (Most Complete Example)
**Location**: `app/api/generate/generate-birthday-card.ts`

**Pattern**:
```typescript
// Create multiple webhooks
const webhooks = rsvpEmails.map(() => createWebhook());

// Send async
await Promise.all(
  rsvpEmails.map((email, i) => requestRsvp(email, webhooks[i].url))
);

// Wait for all to resolve
const responses = await Promise.all(webhooks);
```

**Use Cases**:
- User confirmations
- External approvals
- Payment confirmations
- Event RSVPs

---

## Step Structure Patterns

### Pattern 1: Separate Step Files (Birthday Card)
```
app/api/generate/
├── route.ts
├── generate-birthday-card.ts    ('use workflow')
├── generate-image.ts            ('use step')
├── generate-message.ts          ('use step')
├── generate-prompts.ts          ('use step')
├── request-rsvp.ts              ('use step')
└── send-recipient-email.ts      ('use step')
```
**Pros**: Clean separation, reusable steps  
**Cons**: More files to manage

### Pattern 2: Monolithic Workflow (Custom Adapter)
```
workflows/
└── user-signup.ts               ('use workflow' + steps inline)
```
**Pros**: Simple, self-contained  
**Cons**: Can get unwieldy with many steps

### Pattern 3: Workflows Directory (AI SDK Patterns)
```
workflows/
├── sequential-workflow.ts
├── parallel-workflow.ts
├── routing-workflow.ts
├── orchestrator-workflow.ts
└── evaluator-workflow.ts
```
**Pros**: Clear organization per pattern  
**Cons**: Need separate API routes

---

## State Management Approaches

| Approach | Example | Storage | Persistence | Use Case |
|----------|---------|---------|---|---|
| **Return Value** | All simple examples | Memory | No | Synchronous operations |
| **In-Memory Map** | actors (demo) | In-memory | No | Development only |
| **PostgreSQL** | rag-agent | Database | Yes | Production RAG |
| **Redis** | (mentioned) | Redis | Yes | High-performance caching |
| **Workflow State** | Custom Adapter | Workflow engine | Yes | Default per-run state |

---

## Error Handling Strategies

### Strategy 1: Automatic Retry (Default)
```typescript
async function step() {
  'use step';
  throw new Error('Will retry');  // Retried automatically
}
```
**When**: Transient failures, network issues

### Strategy 2: Conditional Retry
```typescript
if (isTransient(error)) {
  throw error;  // Retry
} else {
  throw new FatalError(error);  // Stop, don't retry
}
```
**When**: Need to distinguish error types

### Strategy 3: Manual Quality Check
```typescript
const quality = await evaluate(result);
if (!quality.passes) {
  return await regenerate(input);
}
```
**When**: Quality threshold needed

### Strategy 4: Degraded Response
```typescript
try {
  return await generateWithModel('gpt-4o');
} catch {
  return await generateWithModel('gpt-4o-mini');
}
```
**When**: Fallback models available

---

## Performance & Scaling Considerations

| Aspect | Recommendation | Example |
|--------|---|---|
| **Concurrency** | Use Promise.all() for parallel steps | parallel-workflow.ts |
| **Model Choice** | Use smaller models for speed, larger for quality | routing-workflow selects based on complexity |
| **Chunking** | Break large operations into steps | evaluator loop (max 3 iterations) |
| **Caching** | Use RAG + embeddings for knowledge | rag-agent with pgvector |
| **Streaming** | Use streamText for real-time updates | flight-booking uses streaming |
| **Webhooks** | Parallel webhook collection | birthday-card uses Promise.all() |

---

## Testing Approaches Found

| Approach | Location | Purpose |
|----------|----------|---------|
| **Simulated Failures** | flight-booking | 30% random failure to test retries |
| **Quality Thresholds** | sequential-workflow | Validate output meets criteria |
| **Mock Tools** | flight-booking | Tool responses can be simulated |
| **Local Development** | All | `pnpm dev` for local testing |
| **Logging Patterns** | All | `[WORKFLOW]` prefix for tracking |

---

## External Integrations Used

| Service | Example | Purpose |
|---------|---------|---------|
| **Vercel AI Gateway** | All examples | Model access & auth |
| **OpenAI API** | ai-sdk patterns, birthday-card | LLM inference |
| **Google Gemini** | birthday-card | Image generation |
| **AWS Bedrock** | flight-booking | Alternative LLM provider |
| **Resend** | birthday-card | Email delivery |
| **PostgreSQL** | rag-agent | Data persistence |
| **pgvector** | rag-agent | Vector similarity search |

---

## Deployment Configurations

| Project | Target | Requires Env | Special Setup |
|---------|--------|---|---|
| ai-sdk-patterns | Vercel | AI_GATEWAY_API_KEY (optional) | None |
| birthday-card | Vercel | None (AI Gateway auth built-in) | None |
| flight-booking | Vercel | AI_GATEWAY_API_KEY | None |
| rag-agent | Vercel | DATABASE_URL, API_GATEWAY_KEY | DB migrations |
| custom-adapter | Bun | None | SWC plugin config |
| actors | Vercel | None | State persistence setup |

---

## Development Environment Setup

All examples support:
```bash
pnpm install      # or npm/bun
pnpm dev          # Start dev server
```

Special cases:
```bash
# rag-agent also needs
pnpm db:migrate

# custom-adapter uses Bun
bun install
bun run dev
```

---

## Learning Progression

### Level 1: Foundations
1. Start with **nextjs** - Basic workflow template
2. Read **ai-sdk-patterns/sequential** - Single process
3. Try **custom-adapter** - Understand directives

### Level 2: Intermediate
4. Study **ai-sdk-patterns/parallel** - Concurrent operations
5. Build with **birthday-card** - Real-world workflow
6. Implement **ai-sdk-patterns/routing** - Conditional logic

### Level 3: Advanced
7. Explore **ai-sdk-patterns/evaluator** - Feedback loops
8. Learn **ai-sdk-patterns/orchestrator** - Multi-agent
9. Study **flight-booking** - Tool-based agents
10. Build with **rag-agent** - Knowledge systems
11. Master **actors** - Stateful processes

---

## Quick Lookup: Find Example By Feature

### "I need to generate text and images in parallel"
→ **birthday-card-generator** (`generateImage` + `generateMessage` with Promise.all)

### "I need to classify then route to different handlers"
→ **ai-sdk-patterns/routing-workflow** (classify → switch on type)

### "I need to evaluate quality and retry"
→ **ai-sdk-patterns/sequential-workflow** or **evaluator-workflow**

### "I need to wait for external feedback"
→ **birthday-card-generator** (webhook pattern) or **custom-adapter** (sleep + webhook)

### "I need a conversational AI with tool calling"
→ **flight-booking-app** (DurableAgent + tools)

### "I need knowledge-based AI with embeddings"
→ **rag-agent** (PostgreSQL + pgvector + embeddings)

### "I need stateful long-running processes"
→ **actors** (defineHook + event loop)

### "I need to handle errors and retries"
→ Any example (see try/catch + FatalError patterns)

### "I want to use Bun instead of Node"
→ **custom-adapter** (SWC plugin + Bun.serve)

---

## File Size & Complexity Indicators

| Project | Total Files | Largest File | Est. Lines | Complexity |
|---------|---|---|---|---|
| ai-sdk-patterns | 10+ | ~60 lines | ~150 | Low |
| birthday-card | 15+ | ~120 lines | ~300 | Medium |
| flight-booking | 20+ | ~200 lines | ~500 | High |
| rag-agent | 30+ | ~250 lines | ~700 | High |
| custom-adapter | 8 | ~50 lines | ~120 | Low |
| actors | 12 | ~150 lines | ~250 | Medium |

