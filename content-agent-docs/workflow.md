# How the Directives Work (/docs/how-it-works/code-transform)

# How the Directives Work

<Callout>
  This is an advanced guide that dives into internals of the Workflow DevKit directive and is not required reading to use workflows. To simply use the Workflow DevKit, check out the [getting started](/docs/getting-started) guides for your framework.
</Callout>

Workflows use special directives to mark code for transformation by the Workflow DevKit compiler. This page explains how `"use workflow"` and `"use step"` directives work, what transformations are applied, and why they're necessary for durable execution.

***

## Directives Overview

Workflows use two directives to mark functions for special handling:

```typescript
export async function handleUserSignup(email: string) {
  "use workflow"; // [!code highlight]

  const user = await createUser(email);
  await sendWelcomeEmail(user);

  return { userId: user.id };
}

async function createUser(email: string) {
  "use step"; // [!code highlight]

  return { id: crypto.randomUUID(), email };
}
```

**Key directives:**

* `"use workflow"`: Marks a function as a durable workflow entry point
* `"use step"`: Marks a function as an atomic, retryable step

These directives trigger the `@workflow/swc-plugin` compiler to transform your code in different ways depending on the execution context.

***

## The Three Transformation Modes

The compiler operates in three distinct modes, transforming the same source code differently for each execution context:

<Mermaid
  chart="flowchart LR
    A[&#x22;Source Code<br/>with directives&#x22;] --> B[&#x22;Step Mode&#x22;]
    A --> C[&#x22;Workflow Mode&#x22;]
    A --> D[&#x22;Client Mode&#x22;]
    B --> E[&#x22;step.js<br/>(Step Execution)&#x22;]
    C --> F[&#x22;flow.js<br/>(Workflow Execution)&#x22;]
    D --> G[&#x22;Your App Code<br/>(Enables `start`)&#x22;]"
/>

### Comparison Table

| Mode     | Used In       | Purpose                                    | Output API Route               | Required?  |
| -------- | ------------- | ------------------------------------------ | ------------------------------ | ---------- |
| Step     | Build time    | Bundles step handlers                      | `.well-known/workflow/v1/step` | Yes        |
| Workflow | Build time    | Bundles workflow orchestrators             | `.well-known/workflow/v1/flow` | Yes        |
| Client   | Build/Runtime | Provides workflow IDs and types to `start` | Your application code          | Optional\* |

\* Client mode is **recommended** for better developer experience—it provides automatic ID generation and type safety. Without it, you must manually construct workflow IDs or use the build manifest.

***

## Detailed Transformation Examples

<Tabs items={["Step Mode", "Workflow Mode", "Client Mode"]}>
  <Tab value="Step Mode">
    **Step Mode** creates the step execution bundle served at `/.well-known/workflow/v1/step`.

    **Input:**

    ```typescript
    export async function createUser(email: string) {
      "use step";
      return { id: crypto.randomUUID(), email };
    }
    ```

    **Output:**

    ```typescript
    import { registerStepFunction } from "workflow/internal/private"; // [!code highlight]

    export async function createUser(email: string) {
      return { id: crypto.randomUUID(), email };
    }

    registerStepFunction("step//workflows/user.js//createUser", createUser); // [!code highlight]
    ```

    **What happens:**

    * The `"use step"` directive is removed
    * The function body is kept completely intact (no transformation)
    * The function is registered with the runtime using `registerStepFunction()`
    * Step functions run with full Node.js/Deno/Bun access

    **Why no transformation?** Step functions execute in your main runtime with full access to Node.js APIs, file system, databases, etc. They don't need any special handling—they just run normally.

    **ID Format:** Step IDs follow the pattern `step//{filepath}//{functionName}`, where the filepath is relative to your project root.
  </Tab>

  <Tab value="Workflow Mode">
    **Workflow Mode** creates the workflow execution bundle served at `/.well-known/workflow/v1/flow`.

    **Input:**

    ```typescript
    export async function createUser(email: string) {
      "use step";
      return { id: crypto.randomUUID(), email };
    }

    export async function handleUserSignup(email: string) {
      "use workflow";
      const user = await createUser(email);
      return { userId: user.id };
    }
    ```

    **Output:**

    ```typescript
    export async function createUser(email: string) {
      return globalThis[Symbol.for("WORKFLOW_USE_STEP")]("step//workflows/user.js//createUser")(email); // [!code highlight]
    }

    export async function handleUserSignup(email: string) {
      const user = await createUser(email);
      return { userId: user.id };
    }
    handleUserSignup.workflowId = "workflow//workflows/user.js//handleUserSignup"; // [!code highlight]
    ```

    **What happens:**

    * Step function bodies are **replaced** with calls to `globalThis[Symbol.for("WORKFLOW_USE_STEP")]`
    * Workflow function bodies remain **intact**—they execute deterministically during replay
    * The workflow function gets a `workflowId` property for runtime identification
    * The `"use workflow"` directive is removed

    **Why this transformation?** When a workflow executes, it needs to replay past steps from the event log rather than re-executing them. The `WORKFLOW_USE_STEP` symbol is a special runtime hook that:

    1. Checks if the step has already been executed (in the event log)
    2. If yes: Returns the cached result
    3. If no: Triggers a suspension and enqueues the step for background execution

    **ID Format:** Workflow IDs follow the pattern `workflow//{filepath}//{functionName}`. The `workflowId` property is attached to the function to allow [`start()`](/docs/api-reference/workflow-api/start) to work at runtime.
  </Tab>

  <Tab value="Client Mode">
    **Client Mode** transforms workflow functions in your application code to prevent direct execution.

    **Input:**

    ```typescript
    export async function handleUserSignup(email: string) {
      "use workflow";
      const user = await createUser(email);
      return { userId: user.id };
    }
    ```

    **Output:**

    ```typescript
    export async function handleUserSignup(email: string) {
      throw new Error("You attempted to execute ..."); // [!code highlight]
    }
    handleUserSignup.workflowId = "workflow//workflows/user.js//handleUserSignup"; // [!code highlight]
    ```

    **What happens:**

    * Workflow function bodies are **replaced** with an error throw
    * The `workflowId` property is added (same as workflow mode)
    * Step functions are not transformed in client mode

    **Why this transformation?** Workflow functions cannot be called directly—they must be started using [`start()`](/docs/api-reference/workflow-api/start). The error prevents accidental direct execution while the `workflowId` property allows the `start()` function to identify which workflow to launch.

    The IDs are generated exactly like in workflow mode to ensure they can be directly referenced at runtime.

    <Callout type="info">
      **Client mode is optional:** While recommended for better developer experience (automatic IDs and type safety), you can skip client mode and instead:

      * Manually construct workflow IDs using the pattern `workflow//{filepath}//{functionName}`
      * Use the workflow manifest file generated during build to lookup IDs
      * Pass IDs directly to `start()` as strings

      All framework integrations include client mode as a loader by default.
    </Callout>
  </Tab>
</Tabs>

***

## Generated Files

When you build your application, the Workflow DevKit generates three handler files in `.well-known/workflow/v1/`:

### `flow.js`

Contains all workflow functions transformed in **workflow mode**. This file is imported by your framework to handle workflow execution requests at `POST /.well-known/workflow/v1/flow`.

**How it's structured:**

All workflow code is bundled together and embedded as a string inside `flow.js`. When a workflow needs to execute, this bundled code is run inside a **Node.js VM** (virtual machine) to ensure:

* **Determinism**: The same inputs always produce the same outputs
* **Side-effect prevention**: Direct access to Node.js APIs, file system, network, etc. is blocked
* **Sandboxed execution**: Workflow orchestration logic is isolated from the main runtime

**Build-time validation:**

The workflow mode transformation validates your code during the build:

* Catches invalid Node.js API usage (like `fs`, `http`, `child_process`)
* Prevents imports of modules that would break determinism

Most invalid patterns cause **build-time errors**, catching issues before deployment.

**What it does:**

* Exports a `POST` handler that accepts Web standard `Request` objects
* Executes bundled workflow code inside a Node.js VM for each request
* Handles workflow execution, replay, and resumption
* Returns execution results to the orchestration layer

<Callout type="info">
  **Why a VM?** Workflow functions must be deterministic to support replay. The VM sandbox prevents accidental use of non-deterministic APIs or side effects. All side effects should be performed in [step functions](/docs/foundations/workflows-and-steps#step-functions) instead.
</Callout>

### `step.js`

Contains all step functions transformed in **step mode**. This file is imported by your framework to handle step execution requests at `POST /.well-known/workflow/v1/step`.

**What it does:**

* Exports a `POST` handler that accepts Web standard `Request` objects
* Executes individual steps with full runtime access
* Returns step results to the orchestration layer

### `webhook.js`

Contains webhook handling logic for delivering external data to running workflows via [`createWebhook()`](/docs/api-reference/workflow/create-webhook).

**What it does:**

* Exports a `POST` handler that accepts webhook payloads
* Validates tokens and routes data to the correct workflow run
* Resumes workflow execution after webhook delivery

**Note:** The webhook file structure varies by framework. Next.js generates `webhook/[token]/route.js` to leverage App Router's dynamic routing, while other frameworks generate a single `webhook.js` or `webhook.mjs` handler.

***

## Why Three Modes?

The multi-mode transformation enables the Workflow DevKit's durable execution model:

1. **Step Mode** (required) - Bundles executable step functions that can access the full runtime
2. **Workflow Mode** (required) - Creates orchestration logic that can replay from event logs
3. **Client Mode** (optional) - Prevents direct execution and enables type-safe workflow references

This separation allows:

* **Deterministic replay**: Workflows can be safely replayed from event logs without re-executing side effects
* **Sandboxed orchestration**: Workflow logic runs in a controlled VM without direct runtime access
* **Stateless execution**: Your compute can scale to zero and resume from any point in the workflow
* **Type safety**: TypeScript works seamlessly with workflow references (when using client mode)

***

## Determinism and Replay

A key aspect of the transformation is maintaining **deterministic replay** for workflow functions.

**Workflow functions must be deterministic:**

* Same inputs always produce the same outputs
* No direct side effects (no API calls, no database writes, no file I/O)
* Can use seeded random/time APIs provided by the VM (`Math.random()`, `Date.now()`, etc.)

Because workflow functions are deterministic and have no side effects, they can be safely re-run multiple times to calculate what the next step should be. This is why workflow function bodies remain intact in workflow mode—they're pure orchestration logic.

**Step functions can be non-deterministic:**

* Can make API calls, database queries, etc.
* Have full access to Node.js runtime and APIs
* Results are cached in the event log after first execution

Learn more about [Workflows and Steps](/docs/foundations/workflows-and-steps).

***

## ID Generation

The compiler generates stable IDs for workflows and steps based on file paths and function names:

**Pattern:** `{type}//{filepath}//{functionName}`

**Examples:**

* `workflow//workflows/user-signup.js//handleUserSignup`
* `step//workflows/user-signup.js//createUser`
* `step//workflows/payments/checkout.ts//processPayment`

**Key properties:**

* **Stable**: IDs don't change unless you rename files or functions
* **Unique**: Each workflow/step has a unique identifier
* **Portable**: Works across different runtimes and deployments

<Callout type="info">
  Although IDs can change when files are moved or functions are renamed, Workflow DevKit function assume atomic versioning in the World. This means changing IDs won't break old workflows from running, but will prevent run from being upgraded and will cause your workflow/step names to change in the observability across deployments.
</Callout>

***

## Framework Integration

These transformations are framework-agnostic—they output standard JavaScript that works anywhere.

**For users**: Your framework handles all transformations automatically. See the [Getting Started](/docs/getting-started) guide for your framework.

**For framework authors**: Learn how to integrate these transformations into your framework in [Building Framework Integrations](/docs/how-it-works/framework-integrations).

***

## Debugging Transformed Code

If you need to debug transformation issues, you can inspect the generated files:

1. **Look in `.well-known/workflow/v1/`**: Check the generated `flow.js`, `step.js`,`webhook.js`, and other emitted debug files.
2. **Check build logs**: Most frameworks log transformation activity during builds
3. **Verify directives**: Ensure `"use workflow"` and `"use step"` are the first statements in functions
4. **Check file locations**: Transformations only apply to files in configured source directories


## Sitemap
[Overview of all docs pages](/docs/sitemap.md)

# Framework Integrations (/docs/how-it-works/framework-integrations)

# Building Framework Integrations

<Callout>
  **For users:** If you just want to use Workflow DevKit with an existing framework, check out the [Getting Started](/docs/getting-started) guide instead. This page is for framework authors who want to integrate Workflow DevKit with their framework or runtime.
</Callout>

This guide walks you through building a framework integration for Workflow DevKit using Bun as a concrete example. The same principles apply to any JavaScript runtime (Node.js, Deno, Cloudflare Workers, etc.).

<Callout type="info">
  **Prerequisites:** Before building a framework integration, we recommend reading [How the Directives Work](/docs/how-it-works/code-transform) to understand the transformation system that powers Workflow DevKit.
</Callout>

***

## What You'll Build

A framework integration has two main components:

1. **Build-time**: Generate workflow handler files (`flow.js`, `step.js`, `webhook.js`)
2. **Runtime**: Expose these handlers as HTTP endpoints in your application server

<Mermaid
  chart="flowchart TD
    A[&#x22;Source Code<br/>'use workflow'&#x22;] --> B[&#x22;Workflow Builder&#x22;]
    B --> C[&#x22;SWC Transform&#x22;]
    C --> D[&#x22;Step Mode&#x22;]
    C --> E[&#x22;Workflow Mode&#x22;]
    C --> F[&#x22;Client Mode&#x22;]
    D --> G[&#x22;Generated Handlers<br/>step.js&#x22;]
    E --> H[&#x22;Generated Handlers<br/>flow.js&#x22;]
    B --> L[&#x22;Generated Handlers<br/>webhook.js&#x22;]
    F --> I[&#x22;Used by framework loader&#x22;]
    G --> J[&#x22;HTTP Server<br/>(Your Runtime)&#x22;]
    H --> J
    L --> J

    style B fill:#a78bfa,stroke:#8b5cf6,color:#000
    style I fill:#a78bfa,stroke:#8b5cf6,color:#000
    style J fill:#a78bfa,stroke:#8b5cf6,color:#000"
/>

The purple boxes are what you implement—everything else is provided by Workflow DevKit.

***

## Example: Bun Integration

Let's build a complete integration for Bun. Bun is unique because it serves as both a runtime (needs code transformations) and a framework (provides `Bun.serve()` for HTTP routing).

<Callout type="info">
  A working example can be [found here](https://github.com/vercel/workflow-examples/tree/main/custom-adapter). For a production-ready reference, see the [Next.js integration](https://github.com/vercel/workflow/tree/main/packages/next).
</Callout>

### Step 1: Generate Handler Files

Use the `workflow` CLI to generate the handler bundles. The CLI scans your `workflows/` directory and creates `flow.js`, `step.js`, and `webhook.js`.

```json title="package.json"
{
  "scripts": {
    "dev": "bun x workflow build && PORT=3152 bun run server.ts"
  }
}
```

<Callout>
  **For production integrations:** Instead of using the CLI, extend the `BaseBuilder` class directly in your framework plugin. This gives you control over file watching, custom output paths, and framework-specific hooks. See the [Next.js plugin](https://github.com/vercel/workflow/tree/main/packages/next) for an example.
</Callout>

**What gets generated:**

* `/.well-known/workflow/v1/flow.js` - Handles workflow execution (workflow mode transform)
* `/.well-known/workflow/v1/step.js` - Handles step execution (step mode transform)
* `/.well-known/workflow/v1/webhook.js` - Handles webhook delivery

Each file exports a `POST` function that accepts Web standard `Request` objects.

### Step 2: Add Client Mode Transform (Optional)

Client mode transforms your application code to provide better DX. Add a Bun plugin to apply this transformation at runtime:

```typescript title="workflow-plugin.ts" lineNumbers
import { plugin } from "bun";
import { transform } from "@swc/core";

plugin({
  name: "workflow-transform",
  setup(build) {
    build.onLoad({ filter: /\.(ts|tsx|js|jsx)$/ }, async (args) => {
      const source = await Bun.file(args.path).text();

      // Optimization: Skip files that do not have any directives
      if (!source.match(/(use step|use workflow)/)) {
        return { contents: source };
      }

      const result = await transform(source, {
        filename: args.path,
        jsc: {
          experimental: {
            plugins: [
              [require.resolve("@workflow/swc-plugin"), { mode: "client" }], // [!code highlight]
            ],
          },
        },
      });

      return { contents: result.code, loader: "ts" };
    });
  },
});
```

Activate the plugin in `bunfig.toml`:

```toml title="bunfig.toml"
preload = ["./workflow-plugin.ts"]
```

**What this does:**

* Attaches workflow IDs to functions for use with `start()`
* Provides TypeScript type safety
* Prevents accidental direct execution of workflows

**Why optional?** Without client mode, you can still use workflows by manually constructing IDs or referencing the build manifest.

### Step 3: Expose HTTP Endpoints

Wire up the generated handlers to HTTP endpoints using `Bun.serve()`:

```typescript title="server.ts" lineNumbers
import flow from "./.well-known/workflow/v1/flow.js";
import step from "./.well-known/workflow/v1/step.js";
import * as webhook from "./.well-known/workflow/v1/webhook.js";

import { start } from "workflow/api";
import { handleUserSignup } from "./workflows/user-signup.js";

const server = Bun.serve({
  port: process.env.PORT,
  routes: {
    "/.well-known/workflow/v1/flow": {
      POST: (req) => flow.POST(req),
    },
    "/.well-known/workflow/v1/step": {
      POST: (req) => step.POST(req),
    },
    // webhook exports handlers for GET, POST, DELETE, etc.
    "/.well-known/workflow/v1/webhook/:token": webhook,

    // Example: Start a workflow
    "/": {
      GET: async (req) => {
        const email = `test-${crypto.randomUUID()}@test.com`;
        const run = await start(handleUserSignup, [email]);
        return Response.json({
          message: "User signup workflow started",
          runId: run.runId,
        });
      },
    },
  },
});

console.log(`Server listening on http://localhost:${server.port}`);
```

**That's it!** Your Bun integration is complete.

***

## Understanding the Endpoints

Your integration must expose three HTTP endpoints. The generated handlers manage all protocol details—you just route requests.

### Workflow Endpoint

**Route:** `POST /.well-known/workflow/v1/flow`

Executes workflow orchestration logic. The workflow function is "rendered" multiple times during execution—each time it progresses until it encounters the next step.

**Called when:**

* Starting a new workflow
* Resuming after a step completes
* Resuming after a webhook or hook triggers
* Recovering from failures

### Step Endpoint

**Route:** `POST /.well-known/workflow/v1/step`

Executes individual atomic operations within workflows. Each step runs exactly once per execution (unless retried due to failure). Steps have full runtime access (Node.js APIs, file system, databases, etc.).

### Webhook Endpoint

**Route:** `POST /.well-known/workflow/v1/webhook/:token`

Delivers webhook data to running workflows via [`createWebhook()`](/docs/api-reference/workflow/create-webhook). The `:token` parameter identifies which workflow run should receive the data.

<Callout type="info">
  The webhook file structure varies by framework. Next.js generates `webhook/[token]/route.js` to leverage App Router's dynamic routing, while other frameworks generate a single `webhook.js` handler.
</Callout>

***

## Adapting to Other Frameworks

The Bun example demonstrates the core pattern. To adapt for your framework:

### Build-Time

**Option 1: Use the CLI** (simplest)

```bash
workflow build
```

This will default to scanning the `./workflows` top-level directory for workflow files, and will output bundled files directly into your working directory.

**Option 2: Extend `BaseBuilder`** (recommended)

```typescript lineNumbers
import { BaseBuilder } from '@workflow/cli/dist/lib/builders/base-builder';

class MyFrameworkBuilder extends BaseBuilder {
  constructor(options) {
    super({
      dirs: ['workflows'],
      workingDir: options.rootDir,
      watch: options.dev,
    });
  }

  override async build(): Promise<void> {
    const inputFiles = await this.getInputFiles();

    await this.createWorkflowsBundle({
      outfile: '/path/to/.well-known/workflow/v1/flow.js',
      format: 'esm',
      inputFiles,
    });

    await this.createStepsBundle({
      outfile: '/path/to/.well-known/workflow/v1/step.js',
      format: 'esm',
      inputFiles,
    });

    await this.createWebhookBundle({
      outfile: '/path/to/.well-known/workflow/v1/webhook.js',
    });
  }
}
```

If your framework supports virtual server routes and dev mode watching, make sure to adapt accordingly. Please open a PR to the Workflow DevKit if the base builder class is missing necessary functionality.

Hook into your framework's build:

```typescript title="pseudocode.ts" lineNumbers
framework.hooks.hook('build:before', async () => {
  await new MyFrameworkBuilder(framework).build();
});
```

### Runtime (Client Mode)

Add a loader/plugin for your bundler:

**Rollup/Vite:**

```typescript lineNumbers
export function workflowPlugin() {
  return {
    name: 'workflow-client-transform',
    async transform(code, id) {
      if (!code.match(/(use step|use workflow)/)) return null;

      const result = await transform(code, {
        filename: id,
        jsc: {
          experimental: {
            plugins: [[require.resolve("@workflow/swc-plugin"), { mode: "client" }]], // [!code highlight]
          },
        },
      });

      return { code: result.code, map: result.map };
    },
  };
}
```

**Webpack:**

```javascript lineNumbers
module.exports = {
  module: {
    rules: [
      {
        test: /\.(ts|tsx|js|jsx)$/,
        use: 'workflow-client-loader', // Similar implementation
      },
    ],
  },
};
```

### HTTP Server

Route the three endpoints to the generated handlers. The exact implementation depends on your framework's routing API.

In the bun example above, we left routing to the user. Essentially, the user has to serve routes like this:

```typescript title="server.ts" lineNumbers
import flow from "./.well-known/workflow/v1/flow.js";
import step from "./.well-known/workflow/v1/step.js";
import * as webhook from "./.well-known/workflow/v1/webhook.js";

// Expose the 3 generated routes
const server = Bun.serve({
  routes: {
    "/.well-known/workflow/v1/flow": {
      POST: (req) => flow.POST(req),
    },
    "/.well-known/workflow/v1/step": {
      POST: (req) => step.POST(req),
    },
    // webhook exports handlers for GET, POST, DELETE, etc.
    "/.well-known/workflow/v1/webhook/:token": webhook,
  },
});
```

Production framework integrations should handle this routing in the plugin instead of leaving it to the user, and this depends on each framework's unique implementaiton.
Check the Workflow DevKit source code for examples of production framework implementations.
In the future, the Workflow DevKit will emit more routes under the `.well-known/workflow` namespace.

***

## Security

**How are these HTTP endpoints secured?**

Security is handled by the **world abstraction** you're using:

**Vercel (`@workflow/world-vercel`):**

* Vercel Queue will support private invoke, making routes inaccessible from the public internet
* Handlers receive only a message ID that must be retrieved from Vercel's backend
* Impossible to craft custom payloads without valid queue-issued message IDs

**Custom implementations:**

* Implement authentication via framework middleware
* Use API keys, JWT validation, or other auth schemes
* Network-level security (VPCs, private networks, firewall rules)
* Rate limiting and request validation

Learn more about [world abstractions](/docs/deploying/world).

***

## Testing Your Integration

### 1. Test Build Output

Create a test workflow:

```typescript title="workflows/test.ts" lineNumbers
import { sleep, createWebhook } from "workflow";

export async function handleUserSignup(email: string) {
  "use workflow";

  const user = await createUser(email);
  await sendWelcomeEmail(user);

  await sleep("5s");

  const webhook = createWebhook();
  await sendOnboardingEmail(user, webhook.url);

  await webhook;
  console.log("Webhook Resolved");

  return { userId: user.id, status: "onboarded" };
}

async function createUser(email: string) {
  "use step";

  console.log(`Creating a new user with email: ${email}`);

  return { id: crypto.randomUUID(), email };
}

async function sendWelcomeEmail(user: { id: string; email: string }) {
  "use step";

  console.log(`Sending welcome email to user: ${user.id}`);
}

async function sendOnboardingEmail(user: { id: string; email: string }, callback: string) {
  "use step";

  console.log(`Sending onboarding email to user: ${user.id}`);

  console.log(`Click this link to resolve the webhook: ${callback}`);
}

```

Run your build and verify:

* `.well-known/workflow/v1/flow.js` exists
* `.well-known/workflow/v1/step.js` exists
* `.well-known/workflow/v1/webhook.js` exists

### 2. Test HTTP Endpoints

Start your server and verify routes respond:

```bash
curl -X POST http://localhost:3000/.well-known/workflow/v1/flow
curl -X POST http://localhost:3000/.well-known/workflow/v1/step
curl -X POST http://localhost:3000/.well-known/workflow/v1/webhook/test
```

(Should respond but not trigger meaningful code without authentication/proper workflow run)

### 3. Run a Workflow End-to-End

```typescript
import { start } from "workflow/api";
import { handleUserSignup } from "./workflows/test";

const run = await start(handleUserSignup, ["test@example.com"]);
console.log("Workflow started:", run.runId);
```


## Sitemap
[Overview of all docs pages](/docs/sitemap.md)

# Workflows and Steps (/docs/foundations/workflows-and-steps)

import { File, Folder, Files } from 'fumadocs-ui/components/files';

# Workflows and Steps

Workflows (a.k.a. *durable functions*) are a programming model for building long-running, stateful application logic that can maintain their execution state across restarts, failures, or user events. Unlike traditional serverless functions that lose all state when they terminate, workflows persist their progress and can resume exactly where they left off.

Moreover, workflows let you easily model complex multi-step processes in simple, elegant code. To do this, we introduce two fundamental entities:

1. **Workflow Functions**: Functions that orchestrate/organize steps
2. **Step Functions**: Functions that carry out the actual work

***

## Workflow Functions

*Directive: `"use workflow"`*

Workflow functions define the entrypoint of a workflow and organize how step functions are called. This type of function does not have access to the Node.js runtime, and usable `npm` packages are limited.

Although this may seem limiting initially, this feature is important in order to suspend and accurately resume execution of workflows.

It helps to think of the workflow function less like a full JavaScript runtime, and more like "stitching together" various steps using conditionals, loops, try/catch handlers, `Promise.all`, and other language primitives.

```typescript lineNumbers
export async function processOrderWorkflow(orderId: string) {
  "use workflow"; // [!code highlight]

  // Orchestrate multiple steps
  const order = await fetchOrder(orderId);
  const payment = await chargePayment(order);

  return { orderId, status: 'completed' };
}
```

**Key Characteristics:**

* Runs in a sandboxed environment without full Node.js access
* All step results are persisted to the event log
* Must be **deterministic** to allow resuming after failures

Determinism in the workflow is required in order to resume to workflow from a suspension. Essentially, the workflow code gets re-run multiple times during its lifecycle,
each time, using an event log to resume the workflow to the correct spot.

The sandboxed environment that workflows are run in already ensures determinism. For instance, `Math.random` and `Date` constructors are fixed in workflow runs, so you are safe to use them and the framework ensures that the values don't change across replays.

## Step Functions

*Directive: `"use step"`*

Step functions perform the actual work in a workflow and have full runtime access.

```typescript lineNumbers
async function chargePayment(order: Order) {
  "use step"; // [!code highlight]

  // Full Node.js access - use any npm package
  const stripe = new Stripe(process.env.STRIPE_KEY);

  const charge = await stripe.charges.create({
    amount: order.total,
    currency: 'usd',
    source: order.paymentToken
  });

  return { chargeId: charge.id };
}
```

**Key Characteristics:**

* Full Node.js runtime and npm package access
* Automatic retry on errors
* Results persisted for replay

By default, steps have a maximum of 3 retry attempts before they fail and propagate the error over to the workflow. Learn more about errors and retrying in the [Errors & Retrying](/docs/foundations/errors-and-retries) page.

<Callout type="info">
  Step functions are primarily meant to be used inside a workflow.
</Callout>

Calling a step from outside a workflow, or from another step will essentially run the step in the same process like a normal function (in other words, the `use step` directive is a no-op). This means you can reuse step functions in other parts of your codebase without needing to duplicate business logic.

```typescript lineNumbers
async function updateUser(userId: string) {
  "use step";
  await db.insert(...);
}

// Used inside a workflow
export async function userOnboardingWorkflow(userId: string) {
  "use workflow";
  await updateUser(userId);
  // ... more steps
}

// Used directly outside a workflow
export async function POST() {
  await updateUser("123");
  // ... more logic
}
```

<Callout type="info">
  Keep in mind that calling a step function outside of a workflow function will not have retry semantics nor will it be observable. Additionally, certain workflow-specific functions like [`getStepMetadata()`](/docs/api-reference/workflow/get-step-metadata) will throw an error when used inside a step that's called outside a workflow.
</Callout>

***

### Suspension and Resumption

Workflow functions have the ability to automatically suspend while they wait on asynchronous work. While suspended, the workflow's state is stored via the event log and no compute resources are used until the workflow resumes execution.

There are multiple ways a workflow can suspend:

* Waiting on a step function: the workflow yields while the step runs in the step runtime.
* Using `sleep()` to pause for some fixed duration.
* Awaiting on a promise returned by [`createWebhook()`](/docs/api-reference/workflow/create-webhook), which resumes the workflow when an external system passes data into the workflow.

```typescript lineNumbers
import { sleep, createWebhook } from 'workflow';

export async function documentReviewProcess(userId: string) {
  "use workflow";

  await sleep("1 month"); // Sleep will suspend without consuming any resources [!code highlight]

  // Create a webhook for external workflow resumption
  const webhook = createWebhook();

  // Send the webhook url to some external service or in an email, etc.
  await sendHumanApprovalEmail("Click this link to accept the review", webhook.url)

  const data = await webhook; // The workflow suspends till the URL is resumed [!code highlight]

  console.log("Document reviewed!")
}
```

***

## Writing Workflows

### Basic Structure

The simplest workflow consists of a workflow function and one or more step functions.

```typescript lineNumbers
// Workflow function (orchestrates the steps)
export async function greetingWorkflow(name: string) {
  "use workflow";

  const message = await greet(name);
  return { message };
}

// Step function (does the actual work)
async function greet(name: string) {
  "use step";

  // Access Node.js APIs
  const message = `Hello ${name} at ${new Date().toISOString()}`;
  console.log(message);
  return message;
}
```

### Project structure

While you can organize workflow and step functions however you like, we find that larger projects benefit from some structure:

<Files>
  <Folder name="workflows" defaultOpen disabled>
    <Folder name="userOnboarding" defaultOpen disabled>
      <File name="index.ts" />

      <File name="steps.ts" />
    </Folder>

    <Folder name="aiVideoGeneration" defaultOpen disabled>
      <File name="index.ts" />

      <Folder name="steps" defaultOpen disabled>
        <File name="transcribeUpload.ts" />

        <File name="generateVideo.ts" />

        <File name="notifyUser.ts" />
      </Folder>
    </Folder>

    <Folder name="shared" defaultOpen disabled>
      <File name="validateInput.ts" />

      <File name="logActivity.ts" />
    </Folder>
  </Folder>
</Files>

You can choose to organize your steps into a single `steps.ts` file or separate files within a `steps` folder. The `shared` folder is a good place to put common steps that are used by multiple workflows.

<Callout type="info">
  Splitting up steps and workflows will also help avoid most bundler related bugs with the Workflow DevKit.
</Callout>


## Sitemap
[Overview of all docs pages](/docs/sitemap.md)
# Starting Workflows (/docs/foundations/starting-workflows)

# Starting Workflows

Once you've defined your workflow functions, you need to trigger them to begin execution. This is done using the `start()` function from `workflow/api`, which enqueues a new workflow run and returns a `Run` object that you can use to track its progress.

***

## The `start()` Function

The [`start()`](/docs/api-reference/workflow-api/start) function is used to programmatically trigger workflow executions from runtime contexts like API routes, Server Actions, or any server-side code.

```typescript lineNumbers
import { start } from 'workflow/api';
import { handleUserSignup } from './workflows/user-signup';

export async function POST(request: Request) {
  const { email } = await request.json();

  // Start the workflow
  const run = await start(handleUserSignup, [email]); // [!code highlight]

  return Response.json({
    message: 'Workflow started',
    runId: run.runId
  });
}
```

**Key Points:**

* `start()` returns immediately after enqueuing the workflow - it doesn't wait for completion
* The first argument is your workflow function
* The second argument is an array of arguments to pass to the workflow (optional if the workflow takes no arguments)
* All arguments must be [serializable](/docs/foundations/serialization)

**Learn more:** [`start()` API Reference](/docs/api-reference/workflow-api/start)

***

## The `Run` Object

When you call `start()`, it returns a [`Run`](/docs/api-reference/workflow-api/start#returns) object that provides access to the workflow's status and results.

```typescript lineNumbers
import { start } from 'workflow/api';
import { processOrder } from './workflows/process-order';

const run = await start(processOrder, [orderId]);

// The run object has properties you can await
console.log('Run ID:', run.runId);

// Check the workflow status
const status = await run.status; // 'running' | 'completed' | 'failed'

// Get the workflow's return value (blocks until completion)
const result = await run.returnValue;
```

**Key Properties:**

* `runId` - Unique identifier for this workflow run
* `status` - Current status of the workflow (async)
* `returnValue` - The value returned by the workflow function (async, blocks until completion)
* `readable` - ReadableStream for streaming updates from the workflow

<Callout type="info">
  Most `Run` properties are async getters that return promises. You need to `await` them to get their values. For the complete list of properties and methods, see the API reference below.
</Callout>

**Learn more:** [`Run` API Reference](/docs/api-reference/workflow-api/start#returns)

***

## Common Patterns

### Fire and Forget

The most common pattern is to start a workflow and immediately return, letting it execute in the background:

```typescript lineNumbers
import { start } from 'workflow/api';
import { sendNotifications } from './workflows/notifications';

export async function POST(request: Request) {
  // Start workflow and don't wait for it
  const run = await start(sendNotifications, [userId]);

  // Return immediately
  return Response.json({
    message: 'Notifications queued',
    runId: run.runId
  });
}
```

### Wait for Completion

If you need to wait for the workflow to complete before responding:

```typescript lineNumbers
import { start } from 'workflow/api';
import { generateReport } from './workflows/reports';

export async function POST(request: Request) {
  const run = await start(generateReport, [reportId]);

  // Wait for the workflow to complete
  const report = await run.returnValue; // [!code highlight]

  return Response.json({ report });
}
```

<Callout type="warn">
  Be cautious when waiting for `returnValue` - if your workflow takes a long time, your API route may timeout.
</Callout>

### Stream Updates to Client

Stream real-time updates from your workflow as it executes, without waiting for completion:

```typescript lineNumbers
import { start } from 'workflow/api';
import { generateAIContent } from './workflows/ai-generation';

export async function POST(request: Request) {
  const { prompt } = await request.json();

  // Start the workflow
  const run = await start(generateAIContent, [prompt]);

  // Get the readable stream (can also use run.readable as shorthand)
  const stream = run.getReadable(); // [!code highlight]

  // Return the stream immediately
  return new Response(stream, {
    headers: {
      'Content-Type': 'application/octet-stream',
    },
  });
}
```

Your workflow can write to the stream using [`getWritable()`](/docs/api-reference/workflow/get-writable):

```typescript lineNumbers
import { getWritable } from 'workflow';

export async function generateAIContent(prompt: string) {
  'use workflow';

  const writable = getWritable(); // [!code highlight]

  await streamContentToClient(writable, prompt);

  return { status: 'complete' };
}

async function streamContentToClient(
  writable: WritableStream,
  prompt: string
) {
  'use step';

  const writer = writable.getWriter();

  // Stream updates as they become available
  for (let i = 0; i < 10; i++) {
    const chunk = new TextEncoder().encode(`Update ${i}\n`);
    await writer.write(chunk);
  }

  writer.releaseLock();
}
```

<Callout type="info">
  Streams are particularly useful for AI workflows where you want to show progress to users in real-time, or for long-running processes that produce intermediate results.
</Callout>

**Learn more:** [Streaming in Workflows](/docs/foundations/serialization#streaming)

### Check Status Later

You can retrieve a workflow run later using its `runId` with [`getRun()`](/docs/api-reference/workflow-api/get-run):

```typescript lineNumbers
import { getRun } from 'workflow/api';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const runId = url.searchParams.get('runId');

  // Retrieve the existing run
  const run = getRun(runId); // [!code highlight]

  // Check its status
  const status = await run.status;

  if (status === 'completed') {
    const result = await run.returnValue;
    return Response.json({ result });
  }

  return Response.json({ status });
}
```

***

## Next Steps

Now that you understand how to start workflows and track their execution:

* Learn about [Control Flow Patterns](/docs/foundations/control-flow-patterns) for organizing complex workflows
* Explore [Errors & Retrying](/docs/foundations/errors-and-retries) to handle failures gracefully
* Check the [`start()` API Reference](/docs/api-reference/workflow-api/start) for complete details


## Sitemap
[Overview of all docs pages](/docs/sitemap.md)

# Hooks & Webhooks (/docs/foundations/hooks)

# Hooks & Webhooks

Hooks provide a powerful mechanism for pausing workflow execution and resuming it later with external data. They enable workflows to wait for external events, user interactions (also known as "human in the loop"), or HTTP requests. This guide will teach you the core concepts, starting with the low-level Hook primitive and building up to the higher-level Webhook abstraction.

## Understanding Hooks

At their core, **Hooks** are a low-level primitive that allow you to pause a workflow and resume it later with arbitrary [serializable data](/docs/foundations/serialization). Think of them as a suspension point in your workflow where you're waiting for external input.

When you create a hook, it generates a unique token that external systems use to send data back to your workflow. This makes hooks perfect for scenarios like:

* Waiting for approval from a user or admin
* Receiving data from an external system or service
* Implementing event-driven workflows that react to multiple events over time

### Creating Your First Hook

Let's start with a simple example. Here's a workflow that creates a hook and waits for external data:

```typescript lineNumbers
import { createHook } from "workflow";

export async function approvalWorkflow() {
  "use workflow";

  // Create a hook that expects an approval payload
  const hook = createHook<{ approved: boolean; comment: string }>();

  console.log("Waiting for approval...");
  console.log("Send approval to token:", hook.token);

  // Workflow pauses here until data is sent
  const result = await hook;

  if (result.approved) {
    console.log("Approved with comment:", result.comment);
    // Continue with approved workflow...
  } else {
    console.log("Rejected:", result.comment);
    // Handle rejection...
  }
}
```

The workflow will pause at `await hook` until external code sends data to resume it.

<Callout type="info">
  See the full API reference for [`createHook()`](/docs/api-reference/workflow/create-hook) for all available options.
</Callout>

### Resuming a Hook

To send data to a waiting workflow, use [`resumeHook()`](/docs/api-reference/workflow-api/resume-hook) from an API route, server action, or any other external context:

```typescript lineNumbers
import { resumeHook } from "workflow/api";

// In an API route or external handler
export async function POST(request: Request) {
  const { token, approved, comment } = await request.json();

  // Resume the workflow with the approval data
  const result = await resumeHook(token, { approved, comment });

  if (result) {
    return Response.json({ success: true, runId: result.runId });
  } else {
    return Response.json({ error: "Invalid token" }, { status: 404 });
  }
}
```

The key points:

* Hooks allow you to pass **any [serializable data](/docs/foundations/serialization)** as the payload
* You need the hook's `token` to resume it
* The workflow will resume execution right where it left off

### Custom Tokens for Deterministic Hooks

By default, hooks generate a random token. However, you often want to use a **custom token** that the external system can reconstruct. This is especially useful for long-running workflows where the same workflow instance should handle multiple events.

For example, imagine a Slack bot where each channel should have its own workflow instance:

```typescript lineNumbers
import { createHook } from "workflow";

export async function slackChannelBot(channelId: string) {
  "use workflow";

  // Use channel ID in the token so Slack webhooks can find this workflow
  const hook = createHook<SlackMessage>({
    token: `slack_messages:${channelId}`
  });

  for await (const message of hook) {
    console.log(`${message.user}: ${message.text}`);

    if (message.text === "/stop") {
      break;
    }

    await processMessage(message);
  }
}

async function processMessage(message: SlackMessage) {
  "use step";
  // Process the Slack message
}
```

Now your Slack webhook handler can deterministically resume the correct workflow:

```typescript lineNumbers
import { resumeHook } from "workflow/api";

export async function POST(request: Request) {
  const slackEvent = await request.json();
  const channelId = slackEvent.channel;

  // Reconstruct the token using the channel ID
  await resumeHook(`slack_messages:${channelId}`, slackEvent);

  return new Response("OK");
}
```

### Receiving Multiple Events

Hooks are *reusable* - they implement `AsyncIterable`, which means you can use `for await...of` to receive multiple events over time:

```typescript lineNumbers
import { createHook } from "workflow";

export async function dataCollectionWorkflow() {
  "use workflow";

  const hook = createHook<{ value: number; done?: boolean }>();

  const values: number[] = [];

  // Keep receiving data until we get a "done" signal
  for await (const payload of hook) {
    values.push(payload.value);

    if (payload.done) {
      break;
    }
  }

  console.log("Collected values:", values);
  return values;
}
```

Each time you call `resumeHook()` with the same token, the loop receives another value.

## Understanding Webhooks

While hooks are powerful, they require you to manually handle HTTP requests and route them to the workflow. **Webhooks** solve this by providing a higher-level abstraction built on top of hooks that:

1. Automatically serializes the entire HTTP [`Request`](https://developer.mozilla.org/en-US/docs/Web/API/Request) object
2. Provides an automatically addressable `url` property pointing to the generated webhook endpoint
3. Handles sending HTTP [`Response`](https://developer.mozilla.org/en-US/docs/Web/API/Response) objects back to the caller

When using Workflow DevKit, webhooks are automatically wired up at `/.well-known/workflow/v1/webhook/:token` without any additional setup.

<Callout type="info">
  See the full API reference for [`createWebhook()`](/docs/api-reference/workflow/create-webhook) for all available options.
</Callout>

### Creating Your First Webhook

Here's a simple webhook that receives HTTP requests:

```typescript lineNumbers
import { createWebhook } from "workflow";

export async function webhookWorkflow() {
  "use workflow";

  const webhook = createWebhook();

  // The webhook is automatically available at this URL
  console.log("Send HTTP requests to:", webhook.url);
  // Example: https://your-app.com/.well-known/workflow/v1/webhook/lJHkuMdQ2FxSFTbUMU84k

  // Workflow pauses until an HTTP request is received
  const request = await webhook;

  console.log("Received request:", request.method, request.url);

  // Access the request body
  const data = await request.json();
  console.log("Data:", data);
}
```

The webhook will automatically respond with a `202 Accepted` status by default. External systems can simply make an HTTP request to the `webhook.url` to resume your workflow.

### Sending Custom Responses

Webhooks provide two ways to send custom HTTP responses: **static responses** and **dynamic responses**.

#### Static Responses

Use the `respondWith` option to provide a static response that will be sent automatically for every request:

```typescript lineNumbers
import { createWebhook } from "workflow";

export async function webhookWithStaticResponse() {
  "use workflow";

  const webhook = createWebhook({
    respondWith: new Response(
      JSON.stringify({ success: true, message: "Webhook received" }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" }
      }
    )
  });

  const request = await webhook;

  // The response was already sent automatically
  // Continue processing the request asynchronously
  const data = await request.json();
  await processData(data);
}

async function processData(data: any) {
  "use step";
  // Long-running processing here
}
```

#### Dynamic Responses (Manual Mode)

For dynamic responses based on the request content, set `respondWith: "manual"` and call the `respondWith()` method on the request:

```typescript lineNumbers
import { createWebhook, type RequestWithResponse } from "workflow";

async function sendCustomResponse(request: RequestWithResponse, message: string) {
  "use step";

  // Call respondWith() to send the response
  await request.respondWith(
    new Response(
      JSON.stringify({ message }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" }
      }
    )
  );
}

export async function webhookWithDynamicResponse() {
  "use workflow";

  // Set respondWith to "manual" to handle responses yourself
  const webhook = createWebhook({ respondWith: "manual" });

  const request = await webhook;
  const data = await request.json();

  // Decide what response to send based on the data
  if (data.type === "urgent") {
    await sendCustomResponse(request, "Processing urgently");
  } else {
    await sendCustomResponse(request, "Processing normally");
  }

  // Continue workflow...
}
```

<Callout type="warning">
  When using `respondWith: "manual"`, the `respondWith()` method **must** be called from within a step function due to serialization requirements. This requirement may be removed in the future.
</Callout>

### Handling Multiple Webhook Requests

Like hooks, webhooks support iteration:

```typescript lineNumbers
import { createWebhook, type RequestWithResponse } from "workflow";

async function respondToSlack(request: RequestWithResponse, text: string) {
  "use step";

  await request.respondWith(
    new Response(
      JSON.stringify({ response_type: "in_channel", text }),
      { headers: { "Content-Type": "application/json" } }
    )
  );
}

export async function slackCommandWorkflow(channelId: string) {
  "use workflow";

  const webhook = createWebhook({
    token: `slack_command:${channelId}`,
    respondWith: "manual"
  });

  console.log("Configure Slack command webhook:", webhook.url);

  for await (const request of webhook) {
    const formData = await request.formData();
    const command = formData.get("command");
    const text = formData.get("text");

    if (command === "/status") {
      await respondToSlack(request, "Checking status...");
      const status = await checkSystemStatus();
      await postToSlack(channelId, `Status: ${status}`);
    }

    if (text === "stop") {
      await respondToSlack(request, "Stopping workflow...");
      break;
    }
  }
}

async function checkSystemStatus() {
  "use step";
  return "All systems operational";
}

async function postToSlack(channelId: string, message: string) {
  "use step";
  // Post message to Slack
}
```

## Hooks vs. Webhooks: When to Use Each

| Feature               | Hooks                                                          | Webhooks                                                                                    |
| --------------------- | -------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| **Data Format**       | Arbitrary serializable data                                    | HTTP `Request` objects                                                                      |
| **URL**               | No automatic URL                                               | Automatic `webhook.url` property                                                            |
| **Response Handling** | N/A                                                            | Can send HTTP `Response` (static or dynamic)                                                |
| **Use Case**          | Custom integrations, type-safe payloads                        | HTTP webhooks, standard REST APIs                                                           |
| **Resuming**          | [`resumeHook()`](/docs/api-reference/workflow-api/resume-hook) | Automatic via HTTP, or [`resumeWebhook()`](/docs/api-reference/workflow-api/resume-webhook) |

**Use Hooks when:**

* You need full control over the payload structure
* You're integrating with custom event sources
* You want strong TypeScript typing with [`defineHook()`](/docs/api-reference/workflow/define-hook)

**Use Webhooks when:**

* You're receiving HTTP requests from external services
* You need to send HTTP responses back to the caller
* You want automatic URL routing without writing API handlers

## Advanced Patterns

### Type-Safe Hooks with `defineHook()`

The [`defineHook()`](/docs/api-reference/workflow/define-hook) helper provides type safety between creating and resuming hooks:

```typescript lineNumbers
import { defineHook } from "workflow";

// Define the hook type once
type ApprovalRequest = {
  requestId: string;
  approved: boolean;
  approvedBy: string;
  comment: string;
};

const approvalHook = defineHook<ApprovalRequest>();

// In your workflow
export async function documentApprovalWorkflow(documentId: string) {
  "use workflow";

  const hook = approvalHook.create({
    token: `approval:${documentId}`
  });

  const approval = await hook;

  console.log(`Document ${approval.requestId} ${approval.approved ? "approved" : "rejected"}`);
  console.log(`By: ${approval.approvedBy}, Comment: ${approval.comment}`);
}

// In your API route - TypeScript ensures the payload matches!
export async function POST(request: Request) {
  const { documentId, ...approvalData } = await request.json();

  // This is type-safe - TypeScript knows the exact shape required
  await approvalHook.resume(`approval:${documentId}`, approvalData);

  return new Response("OK");
}
```

This pattern is especially valuable in larger applications where the workflow and API code are in separate files.

## Best Practices

### Token Design

When using custom tokens:

* **Make them deterministic**: Base them on data the external system can reconstruct (like channel IDs, user IDs, etc.)
* **Use namespacing**: Prefix tokens to avoid conflicts (e.g., `slack:${channelId}`, `github:${repoId}`)
* **Include routing information**: Ensure the token contains enough information to identify the correct workflow instance

### Response Handling in Webhooks

* Use **static responses** (`respondWith: Response`) for simple acknowledgments
* Use **manual mode** (`respondWith: "manual"`) when responses depend on request processing
* Remember that `respondWith()` must be called from within a step function

### Iterating Over Events

Both hooks and webhooks support iteration, making them perfect for long-running event loops:

```typescript
const hook = createHook<Event>();

for await (const event of hook) {
  await processEvent(event);

  if (shouldStop(event)) {
    break;
  }
}
```

This pattern allows a single workflow instance to handle multiple events over time, maintaining state between events.

## Related Documentation

* [Serialization](/docs/foundations/serialization) - Understanding what data can be passed through hooks
* [`createHook()` API Reference](/docs/api-reference/workflow/create-hook)
* [`createWebhook()` API Reference](/docs/api-reference/workflow/create-webhook)
* [`defineHook()` API Reference](/docs/api-reference/workflow/define-hook)
* [`resumeHook()` API Reference](/docs/api-reference/workflow-api/resume-hook)
* [`resumeWebhook()` API Reference](/docs/api-reference/workflow-api/resume-webhook)


## Sitemap
[Overview of all docs pages](/docs/sitemap.md)