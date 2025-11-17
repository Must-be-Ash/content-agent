# @workflow/ai (/docs/api-reference/workflow-ai)

The @workflow/ai package is currently in active development and should be considered experimental.

Helpers for integrating AI SDK for building AI-powered workflows.

# DurableAgent (/docs/api-reference/workflow-ai/durable-agent)

import { ExperimentalPackageCallout } from "@/components/experimental-package-callout"
import { generateDefinition } from "@/lib/tsdoc"

# `DurableAgent`

<ExperimentalPackageCallout packageName="@workflow/ai" />
The @workflow/ai package is currently in active development and should be considered experimental.

The `DurableAgent` class enables you to create AI-powered agents that can maintain state across workflow steps, call tools, and gracefully handle interruptions and resumptions.

Tool calls can be implemented as workflow steps for automatic retries, or as regular workflow-level logic utilizing core library features such as [`sleep()`](/docs/api-reference/workflow/sleep) and [Hooks](/docs/foundations/hooks).

```typescript lineNumbers
import { DurableAgent } from '@workflow/ai/agent';
import { z } from 'zod';

async function getWeather({ city }: { city: string }) {
  "use step";

  return `Weather in ${city} is sunny`;
}

async function myAgent() {
  "use workflow";

  const agent = new DurableAgent({
    model: 'anthropic/claude-haiku-4.5',
    system: 'You are a helpful weather assistant.',
    tools: {
      getWeather: {
        description: 'Get weather for a city',
        inputSchema: z.object({ city: z.string() }),
        execute: getWeather,
      },
    },
  });

  await agent.stream({
    messages: [{ role: 'user', content: 'How is the weather in San Francisco?' }],
  });
}
```

## API Signature

### Class

<TSDoc
  definition={generateDefinition({
code: `
import { DurableAgent } from "@workflow/ai/agent";
export default DurableAgent;`
})}
/>

### DurableAgentOptions

<TSDoc
  definition={generateDefinition({
code: `
import type { DurableAgentOptions } from "@workflow/ai/agent";
export default DurableAgentOptions;`
})}
/>

### DurableAgentStreamOptions

<TSDoc
  definition={generateDefinition({
code: `
import type { DurableAgentStreamOptions } from "@workflow/ai/agent";
export default DurableAgentStreamOptions;`
})}
/>

## Key Features

* **Durable Execution**: Agents can be interrupted and resumed without losing state
* **Flexible Tool Implementation**: Tools can be implemented as workflow steps for automatic retries, or as regular workflow-level logic
* **Stream Processing**: Handles streaming responses and tool calls in a structured way
* **Workflow Native**: Fully integrated with Workflow DevKit for production-grade reliability

## Good to Know

* Tools can be implemented as workflow steps (using `"use step"` for automatic retries), or as regular workflow-level logic
* Tools can use core library features like `sleep()` and Hooks within their `execute` functions
* The agent processes tool calls iteratively until completion
* When no custom `writable` stream is provided, the agent uses the workflow's default writable stream

## Examples

### Basic Agent with Tools

```typescript
import { DurableAgent } from '@workflow/ai/agent';
import { z } from 'zod';

async function getWeather({ location }: { location: string }) {
  "use step";
  // Fetch weather data
  const response = await fetch(`https://api.weather.com?location=${location}`);
  return response.json();
}

async function weatherAgentWorkflow(userQuery: string) {
  'use workflow';

  const agent = new DurableAgent({
    model: 'anthropic/claude-haiku-4.5',
    tools: {
      getWeather: {
        description: 'Get current weather for a location',
        inputSchema: z.object({ location: z.string() }),
        execute: getWeather,
      },
    },
    system: 'You are a helpful weather assistant. Always provide accurate weather information.',
  });

  await agent.stream({
    messages: [
      {
        role: 'user',
        content: userQuery,
      },
    ],
  });
}
```

### Multiple Tools

```typescript
import { DurableAgent } from '@workflow/ai/agent';
import { z } from 'zod';

async function getWeather({ location }: { location: string }) {
  "use step";
  return `Weather in ${location}: Sunny, 72°F`;
}

async function searchEvents({ location, category }: { location: string; category: string }) {
  "use step";
  return `Found 5 ${category} events in ${location}`;
}

async function multiToolAgentWorkflow(userQuery: string) {
  'use workflow';

  const agent = new DurableAgent({
    model: 'anthropic/claude-haiku-4.5',
    tools: {
      getWeather: {
        description: 'Get weather for a location',
        inputSchema: z.object({ location: z.string() }),
        execute: getWeather,
      },
      searchEvents: {
        description: 'Search for upcoming events in a location',
        inputSchema: z.object({ location: z.string(), category: z.string() }),
        execute: searchEvents,
      },
    },
  });

  await agent.stream({
    messages: [
      {
        role: 'user',
        content: userQuery,
      },
    ],
  });
}
```

### Tools with Workflow Library Features

```typescript
import { DurableAgent } from '@workflow/ai/agent';
import { sleep, defineHook } from 'workflow';
import { z } from 'zod';

// Define a reusable hook type
const approvalHook = defineHook<{ approved: boolean; reason: string }>();

async function scheduleTask({ delaySeconds }: { delaySeconds: number }) {
  // Note: No "use step" for this tool call,
  // since `sleep()` is a workflow level function
  await sleep(`${delaySeconds}s`);
  return `Slept for ${delaySeconds} seconds`;
}

async function requestApproval({ message }: { message: string }) {
  // Note: No "use step" for this tool call either,
  // since hooks are awaited at the workflow level

  // Utilize a Hook for Human-in-the-loop approval
  const hook = approvalHook.create({
    metadata: { message }
  });

  console.log(`Approval needed - token: ${hook.token}`);

  // Wait for the approval payload
  const approval = await hook;

  if (approval.approved) {
    return `Request approved: ${approval.reason}`;
  } else {
    throw new Error(`Request denied: ${approval.reason}`);
  }
}

async function agentWithLibraryFeaturesWorkflow(userRequest: string) {
  'use workflow';

  const agent = new DurableAgent({
    model: 'anthropic/claude-haiku-4.5',
    tools: {
      scheduleTask: {
        description: 'Pause the workflow for the specified number of seconds',
        inputSchema: z.object({
          delaySeconds: z.number(),
        }),
        execute: scheduleTask,
      },
      requestApproval: {
        description: 'Request approval for an action',
        inputSchema: z.object({ message: z.string() }),
        execute: requestApproval,
      },
    },
  });

  await agent.stream({
    messages: [{ role: 'user', content: userRequest }],
  });
}
```

## See Also

* [WorkflowChatTransport](/docs/api-reference/workflow-ai/workflow-chat-transport) - Transport layer for AI SDK streams
* [Workflows and Steps](/docs/foundations/workflows-and-steps) - Understanding workflow fundamentals
* [AI SDK Documentation](https://ai-sdk.dev/docs) - AI SDK documentation reference


## Sitemap
[Overview of all docs pages](/docs/sitemap.md)

# WorkflowChatTransport (/docs/api-reference/workflow-ai/workflow-chat-transport)

import { ExperimentalPackageCallout } from "@/components/experimental-package-callout"
import { generateDefinition } from "@/lib/tsdoc"

# `WorkflowChatTransport`

<ExperimentalPackageCallout packageName="@workflow/ai" />

A chat transport implementation for the AI SDK that provides reliable message streaming with automatic reconnection to interrupted streams. This transport is a drop-in replacement for the default AI SDK transport, enabling seamless recovery from network issues, page refreshes, or Vercel Function timeouts.

<Callout>
  `WorkflowChatTransport` implements the [`ChatTransport`](https://ai-sdk.dev/docs/ai-sdk-ui/transport) interface from the AI SDK and is designed to work with workflow-based chat applications. It requires endpoints that return the `x-workflow-run-id` header to enable stream resumption.
</Callout>

```typescript lineNumbers
import { useChat } from '@ai-sdk/react';
import { WorkflowChatTransport } from '@workflow/ai';

export default function Chat() {
  const { messages, sendMessage } = useChat({
    transport: new WorkflowChatTransport(),
  });

  return (
    <div>
      {messages.map((m) => (
        <div key={m.id}>{m.content}</div>
      ))}
    </div>
  );
}
```

## API Signature

### Class

<TSDoc
  definition={generateDefinition({
code: `
import { WorkflowChatTransport } from "@workflow/ai";
export default WorkflowChatTransport;`
})}
/>

### WorkflowChatTransportOptions

<TSDoc
  definition={generateDefinition({
code: `
import type { WorkflowChatTransportOptions } from "@workflow/ai";
export default WorkflowChatTransportOptions;`
})}
/>

## Key Features

* **Automatic Reconnection**: Automatically recovers from interrupted streams with configurable retry limits
* **Workflow Integration**: Seamlessly works with workflow-based endpoints that provide the `x-workflow-run-id` header
* **Customizable Requests**: Allows intercepting and modifying requests via `prepareSendMessagesRequest` and `prepareReconnectToStreamRequest`
* **Stream Callbacks**: Provides hooks for tracking chat lifecycle via `onChatSendMessage` and `onChatEnd`
* **Custom Fetch**: Supports custom fetch implementations for advanced use cases

## Good to Know

* The transport expects chat endpoints to return the `x-workflow-run-id` header in the response to enable stream resumption
* By default, the transport posts to `/api/chat` and reconnects via `/api/chat/{runId}/stream`
* The `onChatSendMessage` callback receives the full response object, allowing you to extract and store the workflow run ID for session resumption
* Stream interruptions are automatically detected when a "finish" chunk is not received in the initial response
* The `maxConsecutiveErrors` option controls how many reconnection attempts are made before giving up (default: 3)

## Examples

### Basic Chat Setup

```typescript
'use client';

import { useChat } from '@ai-sdk/react';
import { WorkflowChatTransport } from '@workflow/ai';
import { useState } from 'react';

export default function BasicChat() {
  const [input, setInput] = useState('');
  const { messages, sendMessage } = useChat({
    transport: new WorkflowChatTransport(),
  });

  return (
    <div>
      <div className="space-y-4">
        {messages.map((m) => (
          <div key={m.id}>
            <strong>{m.role}:</strong> {m.content}
          </div>
        ))}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          sendMessage({ text: input });
          setInput('');
        }}
      >
        <input
          value={input}
          placeholder="Say something..."
          onChange={(e) => setInput(e.currentTarget.value)}
        />
      </form>
    </div>
  );
}
```

### With Session Persistence and Resumption

```typescript
'use client';

import { useChat } from '@ai-sdk/react';
import { WorkflowChatTransport } from '@workflow/ai';
import { useMemo, useState } from 'react';

export default function ChatWithResumption() {
  const [input, setInput] = useState('');
  const activeWorkflowRunId = useMemo(() => {
    if (typeof window === 'undefined') return;
    return localStorage.getItem('active-workflow-run-id') ?? undefined;
  }, []);

  const { messages, sendMessage } = useChat({
    resume: !!activeWorkflowRunId,
    transport: new WorkflowChatTransport({
      onChatSendMessage: (response, options) => {
        // Save chat history to localStorage
        localStorage.setItem(
          'chat-history',
          JSON.stringify(options.messages)
        );

        // Extract and store the workflow run ID for session resumption
        const workflowRunId = response.headers.get('x-workflow-run-id');
        if (workflowRunId) {
          localStorage.setItem('active-workflow-run-id', workflowRunId);
        }
      },
      onChatEnd: ({ chatId, chunkIndex }) => {
        console.log(`Chat ${chatId} completed with ${chunkIndex} chunks`);
        // Clear the active run ID when chat completes
        localStorage.removeItem('active-workflow-run-id');
      },
    }),
  });

  return (
    <div>
      <div className="space-y-4">
        {messages.map((m) => (
          <div key={m.id}>
            <strong>{m.role}:</strong> {m.content}
          </div>
        ))}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          sendMessage({ text: input });
          setInput('');
        }}
      >
        <input
          value={input}
          placeholder="Say something..."
          onChange={(e) => setInput(e.currentTarget.value)}
        />
      </form>
    </div>
  );
}
```

### With Custom Request Configuration

```typescript
'use client';

import { useChat } from '@ai-sdk/react';
import { WorkflowChatTransport } from '@workflow/ai';
import { useState } from 'react';

export default function ChatWithCustomConfig() {
  const [input, setInput] = useState('');
  const { messages, sendMessage } = useChat({
    transport: new WorkflowChatTransport({
      prepareSendMessagesRequest: async (config) => {
        return {
          ...config,
          api: '/api/chat',
          headers: {
            ...config.headers,
            'Authorization': `Bearer ${process.env.NEXT_PUBLIC_API_TOKEN}`,
            'X-Custom-Header': 'custom-value',
          },
          credentials: 'include',
        };
      },
      prepareReconnectToStreamRequest: async (config) => {
        return {
          ...config,
          headers: {
            ...config.headers,
            'Authorization': `Bearer ${process.env.NEXT_PUBLIC_API_TOKEN}`,
          },
          credentials: 'include',
        };
      },
      maxConsecutiveErrors: 5,
    }),
  });

  return (
    <div>
      <div className="space-y-4">
        {messages.map((m) => (
          <div key={m.id}>
            <strong>{m.role}:</strong> {m.content}
          </div>
        ))}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          sendMessage({ text: input });
          setInput('');
        }}
      >
        <input
          value={input}
          placeholder="Say something..."
          onChange={(e) => setInput(e.currentTarget.value)}
        />
      </form>
    </div>
  );
}
```

## See Also

* [DurableAgent](/docs/api-reference/workflow-ai/durable-agent) - Building durable AI agents within workflows
* [AI SDK `useChat` Documentation](https://ai-sdk.dev/docs/reference/ai-sdk-ui/use-chat) - Using `useChat` with custom transports
* [Workflows and Steps](/docs/foundations/workflows-and-steps) - Understanding workflow fundamentals
* ["flight-booking-app" Example](https://github.com/vercel/workflow-examples/tree/main/flight-booking-app) - An example application which uses `WorkflowChatTransport`
