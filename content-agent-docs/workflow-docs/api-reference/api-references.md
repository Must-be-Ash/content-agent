# API Reference (/docs/api-reference)

# API Reference

All the functions and primitives that come with Workflow DevKit by package.

- [`createHook()`](./create-hook.md) — Create a low-level hook to receive arbitrary payloads from external systems.
- [`createWebhook()`](./create-webhook.md) — Create a webhook that suspends the workflow until an HTTP request is received.
- [`defineHook()`](./define-hook.md) — Type-safe hook helper for consistent payload types.
- [`FatalError()`](./fatal-error.md) — When thrown, marks a step as failed and the step is not retried.
- [`fetch()`](./fetch.md) — Make HTTP requests from within a workflow with automatic retry semantics.
- [`getStepMetadata()`](./get-step-metadata.md) — A function that returns context about the current step execution.
- [`getWorkflowMetadata()`](./get-workflow-metadata.md) — A function that returns context about the current workflow execution.
- [`getWritable()`](./get-writable.md) — Access the current workflow run's default stream.
- [`RetryableError()`](./retryable-error.md) — When thrown, marks a step as retryable with an optional parameter.
- [`sleep()`](./sleep.md) — Sleeping workflows for a specified duration. Deterministic and replay-safe.


## Sitemap
[Overview of all docs pages](/docs/sitemap.md)
