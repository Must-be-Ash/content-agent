# workflow (/docs/api-reference/workflow)

# `workflow`

Core workflow primitives including steps, context management, streaming, webhooks, and error handling.

***

## Installation

<Tabs items={['npm', 'pnpm', 'yarn', 'bun']}>
  <Tab value="npm">
    <CodeBlock>
      npm i workflow
    </CodeBlock>
  </Tab>

  <Tab value="pnpm">
    <CodeBlock>
      pnpm i workflow
    </CodeBlock>
  </Tab>

  <Tab value="yarn">
    <CodeBlock>
      yarn add workflow
    </CodeBlock>
  </Tab>

  <Tab value="bun">
    <CodeBlock>
      bun add workflow
    </CodeBlock>
  </Tab>
</Tabs>

***

## Functions

Workflow DevKit contains the following functions you can use inside your workflow functions:

- [`getWorkflowMetadata()`](./get-workflow-metadata.md) — A function that returns context about the current workflow execution.
- [`getStepMetadata()`](./get-step-metadata.md) — A function that returns context about the current step execution.
- [`sleep()`](./sleep.md) — Sleeping workflows for a specified duration. Deterministic and replay-safe.
- [`fetch()`](./fetch.md) — Make HTTP requests from within a workflow with automatic retry semantics.
- [`createHook()`](./create-hook.md) — Create a low-level hook to receive arbitrary payloads from external systems.
- [`defineHook()`](./define-hook.md) — Type-safe hook helper for consistent payload types.
- [`createWebhook()`](./create-webhook.md) — Create a webhook that suspends the workflow until an HTTP request is received.
- [`getWritable()`](./get-writable.md) — Access the current workflow run's default stream.

***

## Error Classes

Workflow DevKit includes error classes that can be thrown in a workflow or step to change the error exit strategy of a workflow.

- [`FatalError()`](./fatal-error.md) — When thrown, marks a step as failed and the step is not retried.
- [`RetryableError()`](./retryable-error.md) — When thrown, marks a step as retryable with an optional parameter.


## Sitemap
[Overview of all docs pages](/docs/sitemap.md)
