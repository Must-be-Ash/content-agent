Autonomous UGC Agent

An AI agent that generates video content end-to-end using x402 micropayments and Vercel's Workflow Kit

You give it a topic. It researches, writes a script, and creates the video, paying for every tool it needs along the way

Here's how it works 🧵👇


The agent isn't given content to work with. Just a topic.

For example you type: "what's x402?"

From there, the agent:
- Researches the topic by paying for web search
- Generates a UGC-style script
- Creates a 15-second video
- All autonomous, all paid for with x402


First, it needs to understand the topic.

The agent calls @firecrawl_dev through x402:
- Server responds 402 Payment Required (~$0.03)
- Agent's wallet signs and completes payment
- Receives 10 web search results with full content


This is where Vercel's Workflow Kit becomes critical.

The agent now has research data but needs to:
- Generate a script
- Create a video (3-10min generation time)
- Handle failures and retries
- Stream progress to the user

Traditional approaches break here or get complicated


Why Workflows?

Deterministic Execution: Every operation is logged. If the server crashes during script generation, it resumes exactly where it left off.

Automatic Retries: API calls to LLM retry with exponential backoff. No manual error handling.


After generating the script, the agent pays $0.20 via x402 to create the video and gets a task ID and starts generating. This takes 3-10 minutes.

The agent needs to poll for completion. Every 2 minutes. For up to 15 minutes.


Workflow Kit's sleep() function is designed for this.

await sleep('2m'); // Workflow pauses

During sleep, the workflow uses zero compute. No server running, no costs.

After 2 minutes, it wakes up and polls again. Completely stateless and resumable. No timeouts. No cron jobs


Why This Matters for Agentic Workflows

Durable State: Workflows survive crashes. Critical when agents make payments.

Separation of Logic:
- Workflow = Pure control flow (deterministic)
- Steps = I/O operations (retryable, non-deterministic)


Phase 1 (Client): Handle x402 payments
- Firecrawl search: ~$0.03
- Genbase video: $0.20

Phase 2 (Workflow): Orchestrate AI operations
- Script generation
- Video polling with zero-cost sleep

Client pays. Workflow executes.


Progress Streaming

While the workflow runs, it streams updates to the user:
- "Searching web... ✓"
- "Generating script... ✓"
- "Creating video (50%)..."

This uses Workflow Kit's getWritable() - a Server-Sent Events stream that survives workflow pauses and resumes


The Result

Total cost: ~$0.25 USDC
- $0.03 for research (Firecrawl)
- $0.20 for video (Genbase)
- $0.01 for script generation (Vercel AI Gateway)
- $0 for polling (sleep with zero compute)

The agent pays for what it needs, when it needs it.


Why Workflow Kit for Agents

Agents need to:
- Call paid APIs (x402)
- Wait for async operations (video generation)
- Handle failures gracefully (retries)
- Maintain state across long-running tasks (hours)

Workflow Kit provides all of this. Deterministic orchestration + stateful I/O steps

The Big Picture

This showcases x402 enabling AI agents to act as autonomous economic actors—they research, pay, create, and deliver without human intervention

Workflow Kit makes the orchestration production ready: durable, resumable, and cost-efficient for long-running agentic tasks