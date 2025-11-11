# Workflow Examples - Quick Reference Guide

## Project Catalog

| Project | Type | Key Features | Best For |
|---------|------|--------------|----------|
| **ai-sdk-workflow-patterns** | Tutorial | 5 AI patterns | Learning AI workflow architectures |
| **birthday-card-generator** | Full App | AI + Webhooks + Email | Understanding end-to-end workflows |
| **flight-booking-app** | Full App | Tools + DurableAgent | Conversational AI with tools |
| **rag-agent** | Full App | RAG + Database | Knowledge-based AI systems |
| **custom-adapter** | Tutorial | Bun + SWC Plugin | Alternative runtimes |
| **actors** | Pattern | State + Events | Stateful long-running processes |
| **nextjs** | Starter | Basic template | Getting started with Next.js |
| **sveltekit** | Starter | Alternative framework | Non-Next.js projects |

---

## Essential Code Snippets

### 1. Starting a Workflow
```typescript
import { start } from 'workflow/api';

const result = await start(myWorkflow, [arg1, arg2]);
const output = await result.returnValue;
```

### 2. Marking Workflows & Steps
```typescript
// Entire workflow function
export async function myWorkflow() {
  'use workflow';
  // your code
}

// Individual step
async function myStep() {
  'use step';
  // your code
}
```

### 3. AI SDK Integration
```typescript
import { generateText } from 'ai';
import { fetch } from 'workflow';

// Override fetch for Workflow
globalThis.fetch = fetch;

const { text } = await generateText({
  model: 'openai/gpt-4o',
  prompt: 'Your prompt'
});
```

### 4. Parallel Execution
```typescript
const [result1, result2] = await Promise.all([
  step1(),
  step2()
]);
```

### 5. Webhook Integration
```typescript
import { createWebhook } from 'workflow';

const webhook = createWebhook();
await sendEmailWithLink(webhook.url);
const request = await webhook; // Waits for callback
```

### 6. Delayed Execution
```typescript
import { sleep } from 'workflow';

await sleep('5s');
await sleep('24h');
```

### 7. Error Handling
```typescript
import { FatalError } from 'workflow';

if (isRecoverable) {
  throw error; // Will retry
} else {
  throw new FatalError('Cannot recover');
}
```

---

## Pattern Decision Tree

```
What's your use case?

├─ Single AI call → Step function with 'use step'
│
├─ Multiple sequential steps → Workflow with steps
│
├─ Multiple concurrent AI calls → Promise.all() with steps
│
├─ Need to route to different paths → Routing pattern
│  └─ Classify input → Choose model/prompt
│
├─ Need quality feedback loop → Evaluator pattern
│  └─ Generate → Evaluate → Improve
│
├─ Multiple agents coordinating → Orchestrator/Worker
│  └─ Plan → Execute in parallel
│
├─ Need external callback → Webhook pattern
│  └─ createWebhook() → Send → await
│
├─ Long-running stateful → Actor pattern
│  └─ defineHook() → Event loop → State management
│
└─ Conversational with tools → DurableAgent
   └─ Model + tools → stream()
```

---

## File Organization Patterns

### Pattern A: Steps in Main Workflow File
```
app/api/endpoint/
├── route.ts           (API entry, calls start())
└── workflow.ts        (everything: workflow + steps)
```

### Pattern B: Steps in Separate Files (Recommended)
```
app/api/endpoint/
├── route.ts           (API entry)
└── workflow/
    ├── main.ts        ('use workflow')
    ├── step-1.ts      ('use step')
    ├── step-2.ts      ('use step')
    └── step-3.ts      ('use step')
```

### Pattern C: Separate Workflows Directory
```
app/
├── api/
│   └── endpoint/
│       └── route.ts   (calls start())
└── workflows/
    ├── main-workflow.ts
    ├── substep-1.ts
    └── substep-2.ts
```

---

## Common Patterns & Code

### Sequential with Quality Check
```typescript
export async function workflow(input: string) {
  'use workflow';
  
  const result = await generateContent(input);
  const quality = await evaluateQuality(result);
  
  if (!quality.passes) {
    return await regenerateContent(input, quality.feedback);
  }
  
  return result;
}
```

### Parallel Operations
```typescript
export async function workflow(input: string) {
  'use workflow';
  
  const [img, txt, meta] = await Promise.all([
    generateImage(input),
    generateText(input),
    generateMetadata(input)
  ]);
  
  return { img, txt, meta };
}
```

### Routing Based on Classification
```typescript
export async function workflow(input: string) {
  'use workflow';
  
  const type = await classifyInput(input);
  
  switch(type) {
    case 'type1':
      return await handlerType1(input);
    case 'type2':
      return await handlerType2(input);
  }
}
```

### Webhook Wait Pattern
```typescript
export async function workflow(email: string) {
  'use workflow';
  
  const webhook = createWebhook();
  
  await sendEmailWithLink(email, webhook.url);
  
  const request = await webhook;
  const response = new URL(request.url).searchParams;
  
  return { confirmed: response.get('status') };
}
```

### Iterative Improvement Loop
```typescript
export async function workflow(input: string) {
  'use workflow';
  
  let current = await generate(input);
  
  for (let i = 0; i < MAX_ITERATIONS; i++) {
    const feedback = await evaluate(current);
    
    if (feedback.score >= THRESHOLD) break;
    
    current = await improve(current, feedback);
  }
  
  return current;
}
```

### Actor Pattern
```typescript
export async function actor(actorId: string) {
  'use workflow';
  
  const hook = defineHook<MyEvent>();
  const receiver = hook.create({ token: `actor:${actorId}` });
  
  for await (const event of receiver) {
    let state = await getState(actorId);
    state = applyEvent(state, event);
    await setState(actorId, state);
  }
}
```

---

## Dependency Versions (As of Examples)

```json
{
  "workflow": "4.0.1-beta.6",
  "ai": "^5.0.68",
  "next": "15.5.4",
  "react": "19.1.0",
  "tailwindcss": "^4",
  "zod": "^4.1.12"
}
```

---

## Model Options via AI Gateway

### OpenAI
- `openai/gpt-4o` (fast, smart)
- `openai/gpt-4o-mini` (faster, cheaper)
- `openai/o4-mini` (reasoning)
- `openai/gpt-5-nano` (specific use)

### Google
- `google/gemini-2.5-flash-image` (images)
- `google/gemini-2.5-flash` (general)

### AWS Bedrock
- `bedrock/claude-4-sonnet-20250514-v1`

---

## Testing Tips

### Simulate Failures
Add random failure in steps to test retry behavior:
```typescript
async function myStep() {
  'use step';
  
  if (Math.random() < 0.3) { // 30% failure rate
    throw new Error('Simulated failure');
  }
  
  // ... rest of step
}
```

### Log Timing
```typescript
console.log(`[Step ${stepNum}] Started`, { timestamp: Date.now() });
const result = await operation();
console.log(`[Step ${stepNum}] Completed`, { 
  duration: Date.now() - startTime,
  result 
});
```

---

## Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| **AI SDK calls don't retry** | Wrap in `'use step'` function |
| **globalThis.fetch undefined** | Import from workflow: `import { fetch } from 'workflow'` |
| **Webhook never resolves** | Ensure callback URL is publicly accessible |
| **State lost after restart** | Implement persistent storage (DB, Redis) |
| **Parallel steps failing** | Ensure each step handles its own errors |
| **Type errors with Zod** | Use `generateObject()` with schema for typed output |

---

## Deployment Checklist

- [ ] All `'use workflow'` and `'use step'` directives in place
- [ ] Environment variables configured (if needed)
- [ ] Error handling with FatalError for non-recoverable errors
- [ ] Logging patterns consistent (use [WORKFLOW] prefix)
- [ ] Webhooks configured with public URLs
- [ ] State persistence if needed
- [ ] Test retry behavior with simulated failures
- [ ] Vercel deployment with AI Gateway auth

---

## Next Steps

1. **Pick a pattern** from the decision tree
2. **Find matching example** in workflow-examples
3. **Copy the structure** to your project
4. **Replace with your logic** (AI calls, APIs, etc.)
5. **Test locally** with `pnpm dev`
6. **Deploy to Vercel**

