# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Overview

This is a documentation and development repository for building an **Agent Marketplace with Vercel Workflow (WDK) Orchestration** - a Fiverr/Upwork-style marketplace where agent services are invoked and paid per-use via x402 micropayments.

The repository contains:
- **workflow-repo/**: The Workflow DevKit SDK source code and packages
- **workflow-docs/**: Documentation for Workflow concepts and APIs
- **workflow-examples/**: Reference implementations and example projects
- **spec4.md**: Complete technical specification for the agent marketplace
- **understand.md, workflow.md, workflow-blog.md**: Reference documentation

## Key Concepts

### Workflow DevKit (WDK)

Workflow DevKit transforms async JavaScript into durable, resumable workflows using two primary directives:

1. **`"use workflow"`**: Deterministic orchestrator functions that can pause/resume and replay safely
   - Pure control flow logic (branching, loops, Promise.all)
   - No direct I/O, DB, or Node.js APIs (ensures replay determinism)
   - Can use: `sleep()`, `createWebhook()`, `defineHook()`, `createHook()`

2. **`"use step"`**: Retryable units of work with full Node.js access
   - Handle side effects: APIs, DB calls, file I/O, external services
   - Automatic retries with configurable backoff
   - Throw `FatalError` for non-retryable conditions

### Project Goal

Build a marketplace where:
- Jobs are decomposed into tasks and coordinated by orchestrator workflows
- Specialist agents (research, copywriting, storyboard, video) are invoked via HTTP
- Payments handled per-use via x402 micropayments
- Workflows handle retries, failures, and can resume across long waits
- Human-in-the-loop approvals using hooks
- Async agent callbacks using webhooks

## Working with workflow-repo/

### Development Commands

```bash
# Build all packages
cd workflow-repo && pnpm build

# Run tests across all packages
cd workflow-repo && pnpm test

# Run end-to-end tests
cd workflow-repo && pnpm test:e2e

# Format code with Biome
cd workflow-repo && pnpm format

# Lint and typecheck
cd workflow-repo && pnpm typecheck

# Clean build artifacts
cd workflow-repo && pnpm clean
```

### Package Testing

```bash
# Test core functionality
cd workflow-repo/packages/core && pnpm test

# Test specific file
cd workflow-repo/packages/core && pnpm vitest run src/[filename].test.ts

# E2E tests (requires running dev server)
cd workflow-repo/workbench/nextjs-turbopack && pnpm dev &
sleep 15
DEPLOYMENT_URL="http://localhost:3000" APP_NAME="nextjs-turbopack" pnpm vitest run packages/core/e2e/e2e.test.ts
```

### Example App Development

```bash
# Build workflow bundles for standalone example
cd workflow-repo/workbench/example && pnpm build

# Use workflow CLI
cd workflow-repo/workbench/example && pnpm workflow [command]
cd workflow-repo/workbench/example && pnpm wf [command]  # shorthand

# Next.js development
cd workflow-repo/workbench/nextjs-turbopack && pnpm dev
cd workflow-repo/workbench/nextjs-turbopack && pnpm build
cd workflow-repo/workbench/nextjs-turbopack && pnpm start
```

## Agent Marketplace Architecture

### File Structure (when implementing)

```
/app
  /api
    /jobs/start/route.ts        # calls start(orchestrator, [jobSpec])
    /approvals/route.ts         # resumeHook(token, payload) for human approvals
  /workflows
    orchestrator.ts             # "use workflow" - main orchestrator
    /steps
      payments.ts               # "use step" - payWith402(...)
      agents.ts                 # "use step" - call research/copy/storyboard/video
      webhooks.ts               # "use step" - respondWith helpers
next.config.ts                  # export default withWorkflow(nextConfig)
```

### Core Workflow Patterns

1. **Starting a workflow**: Use `start(workflowFn, args)` from API routes
2. **Sync agent calls**: Steps with `fetch()` and automatic retries
3. **Async agent callbacks**: `createWebhook()` + pass `webhook.url` to agent
4. **Human approvals**: `defineHook()` + `for await` loop over events
5. **Delays/pacing**: `sleep(duration)` pauses without compute
6. **Parallel execution**: `Promise.all([stepA(), stepB()])` for fan-out/fan-in

### Workflow vs Step Responsibilities

**Workflows** (`"use workflow"`):
- Receive job specifications
- Plan task graphs (pure logic)
- Orchestrate step execution
- Handle approval cycles via hooks
- Aggregate outputs
- NO direct Node.js side effects

**Steps** (`"use step"`):
- x402 payment processing
- HTTP calls to agent endpoints
- Database operations
- File I/O
- Response validation
- Error handling with retries

## Key WDK APIs

### In Workflows
- `sleep(duration)` - Pause execution without compute (e.g., "2h", "10m")
- `createWebhook({ respondWith: "manual" | value })` - Create callback URL for async agents
- `defineHook<T>()` - Define a hook type for external events
- `hook.create({ token })` - Create hook instance with unique token
- `for await (const event of hook)` - Iterate over hook events

### In API Routes
- `start(workflowFn, args)` - Start a new workflow run, returns `{ runId }`
- `resumeHook(token, payload)` - Resume paused workflow via hook
- `resumeWebhook(token, payload)` - Resume via webhook (usually auto-handled)

### In Steps
- `request.respondWith(response)` - Send webhook response (when using manual mode)
- Throw `FatalError` - Skip retries for non-transient errors
- Throw `RetryableError` or standard `Error` - Trigger automatic retry

## Next.js Integration

```typescript
// next.config.ts
import { withWorkflow } from 'workflow/next';
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // ... your config
};

export default withWorkflow(nextConfig);
```

Auto-generated routes:
- `/.well-known/workflow/v1/webhook/:token` - Webhook handler
- `/.well-known/workflow/v1/flow` - Workflow execution
- `/.well-known/workflow/v1/step` - Step execution

## Observability

During development:
```bash
npx workflow inspect runs          # CLI view of runs
npx workflow inspect runs --web    # Web UI
```

In production (Vercel):
- Navigate to AI → Workflows dashboard
- View run timelines, step logs, inputs/outputs
- Track sleeps, hook/webhook resume events
- Monitor errors with retry histories

## Important Constraints

1. **Workflow functions must be deterministic**
   - No `Math.random()`, `Date.now()`, or nondeterministic operations (unless seeded by sandbox)
   - No direct file system, database, or network calls
   - All side effects must be in steps

2. **Changesets required for workflow-repo PRs**
   - Run `pnpm changeset add` for any package changes
   - Only include changed packages in changeset
   - Mark all changes as "patch" (never "major" or "minor")

3. **Code style (Biome)**
   - 2-space indentation, single quotes, trailing commas (ES5)
   - Import type enforcement enabled
   - No explicit `any` allowed

## Documentation References

When working on workflow features, refer to:
- `workflow-docs/workflows-and-steps.md` - Core concepts
- `workflow-docs/hooks.md` - Hook patterns for external events
- `workflow-docs/starting-workflows.md` - Workflow initiation
- `workflow-docs/control-flow-patterns.md` - Common patterns
- `workflow-docs/errors-and-retries.md` - Error handling
- `workflow-docs/api-reference/` - Complete API documentation
- `spec4.md` - Full agent marketplace specification

## Package Manager

This project uses **pnpm** with workspace configuration. The required version is specified in `workflow-repo/package.json#packageManager`.

## Security Notes

- Use secret tokens in webhook URLs
- Scope tokens by jobId/user/channel
- Keep x402 credentials in environment variables
- Sign payment requests in steps (never in workflows)
- Exclude `/.well-known/workflow/*` from custom middleware/proxies
