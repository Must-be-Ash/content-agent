# workflow/api (/docs/api-reference/workflow-api)

# `workflow/api`

API reference for runtime functions from the `workflow/api` package.

***

## Functions

Workflow DevKit provides runtime functions that are used outside of workflow and step functions. These are accessed from the runtime entrypoint (e.g. where `start(workflowFn)` is called):

- [`start()`](./start.md) — Start/enqueue a new workflow run.
- [`resumeHook()`](./resume-hook.md) — Resume a workflow by sending a payload to a hook.
- [`resumeWebhook()`](./resume-webhook.md) — Resume a workflow by sending a `Request` to a webhook.
- [`getRun()`](./get-run.md) — Get workflow run status and metadata without waiting for completion.


## Sitemap
[Overview of all docs pages](/docs/sitemap.md)
