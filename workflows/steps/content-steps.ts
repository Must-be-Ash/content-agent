import { FatalError } from 'workflow';
import axios from 'axios';
import type {
  FirecrawlSearchOptions,
  FirecrawlSearchResponse,
  FirecrawlSearchResult,
} from '@/types/firecrawl';
import type { ContentProgressUpdate } from '@/workflows/content-generator';

// Progress Streaming Helper Steps
// These steps write to the workflow's writable stream
// They MUST be steps because getWriter() is not supported in workflow functions

export async function writeProgress<T>(
  writable: WritableStream<T>,
  update: T
) {
  "use step";

  const writer = writable.getWriter();
  await writer.write(update);
  writer.releaseLock();
}

export async function closeProgress<T>(writable: WritableStream<T>) {
  "use step";

  await writable.close();
}

// Web Search Step with Firecrawl x402
// ⚠️ DEPRECATED: This function is no longer used
// Web search is now performed client-side before workflow starts
// This ensures x402 payments work correctly (client handles 402 responses)
// Kept for reference only - do not use in new code
export async function searchWeb(params: {
  query: string;
  maxResults: number;
  paymentHeader?: string; // x402 payment proof from client
}) {
  "use step";

  const firecrawlApiKey = process.env.FIRECRAWL_API_KEY;
  if (!firecrawlApiKey) {
    throw new FatalError('Firecrawl API key not configured');
  }

  const firecrawlEndpoint = process.env.FIRECRAWL_API_BASE_URL ||
    'https://api.firecrawl.dev/v2/x402/search';

  console.log('[Firecrawl] Calling search endpoint:', firecrawlEndpoint);
  console.log('[Firecrawl] Query:', params.query);

  // Prepare headers - EXACTLY like firecrawl-402demo
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${firecrawlApiKey}`,
  };

  // Forward X-PAYMENT header if provided (from client via API route)
  if (params.paymentHeader) {
    headers['X-PAYMENT'] = params.paymentHeader;
    console.log('[Firecrawl] X-PAYMENT header present (forwarding to Firecrawl)');
  } else {
    console.log('[Firecrawl] No payment header - Firecrawl will return 402');
  }

  // Build search options matching Firecrawl's API
  const searchOptions: FirecrawlSearchOptions = {
    query: params.query,
    limit: Math.min(params.maxResults || 10, 30), // Cap at 30
    sources: ['web'], // Web search only
    scrapeOptions: {
      onlyMainContent: true, // Extract main content only
    },
  };

  console.log('[Firecrawl] Search options:', JSON.stringify(searchOptions, null, 2));

  try {
    // Call Firecrawl's x402 search endpoint
    const response = await axios.post<FirecrawlSearchResponse>(
      firecrawlEndpoint,
      searchOptions,
      {
        headers,
        validateStatus: (status) => status === 200 || status === 402,
      }
    );

    if (response.status === 402) {
      // Payment required or verification failed
      const errorMsg = (response.data as any).error || 'Payment required';
      console.error('[Firecrawl] 402 Payment Required:', errorMsg);
      console.error('[Firecrawl] Payment details:', (response.data as any).accepts?.[0]);

      throw new FatalError(
        `Firecrawl payment required: ${errorMsg}. ` +
        `Network: ${(response.data as any).accepts?.[0]?.network}, ` +
        `Asset: ${(response.data as any).accepts?.[0]?.asset}, ` +
        `Amount: ${(response.data as any).accepts?.[0]?.maxAmountRequired}`
      );
    }

    if (response.status === 200) {
      console.log('[Firecrawl] Search successful');
      console.log('[Firecrawl] Results found:', response.data?.data?.web?.length || 0);

      // Check for payment confirmation
      const paymentResponseHeader = response.headers['x-payment-response'];
      if (paymentResponseHeader) {
        try {
          const decoded = JSON.parse(
            Buffer.from(paymentResponseHeader, 'base64').toString()
          );
          if (decoded.transaction) {
            console.log('[Firecrawl] ✅ Payment confirmed - TX:', decoded.transaction);
            console.log('[Firecrawl] View on BaseScan:',
              `https://basescan.org/tx/${decoded.transaction}`);
          }
        } catch (e) {
          console.error('[Firecrawl] Could not decode payment response');
        }
      }

      // Extract and format results
      const webResults = response.data?.data?.web || [];
      if (webResults.length === 0) {
        return 'No search results found.';
      }

      // Format results as research text
      return webResults
        .map((result: FirecrawlSearchResult, idx: number) => {
          const title = result.title || 'Untitled';
          const url = result.url || '';
          const content = result.markdown || result.content || '';
          return `[${idx + 1}] ${title}\nURL: ${url}\n\n${content}`;
        })
        .join('\n\n---\n\n');
    }

    throw new Error(`Unexpected Firecrawl response status: ${response.status}`);

  } catch (error) {
    if (axios.isAxiosError(error)) {
      const status = error.response?.status || 500;
      const message = error.response?.data?.message || error.message;

      console.error('[Firecrawl] API Error:', status, message);

      if (status >= 500) {
        // Retry on server errors
        throw new Error(`Firecrawl server error: ${message}`);
      } else {
        // Don't retry on client errors
        throw new FatalError(`Firecrawl error (${status}): ${message}`);
      }
    }

    throw error;
  }
}

// Script Generation Step (using AI SDK)
export async function generateScript(params: {
  topic: string;
  research: string;
  duration: number;
}) {
  "use step";

  const { generateText } = await import('ai');

  const result = await generateText({
    model: 'openai/gpt-4o',
    prompt: `You are a friend explaining something interesting you just learned. Generate a ${params.duration}-second TikTok-style UGC video prompt about "${params.topic}" that will be used to generate an AI video with Sora 2.

Research findings to incorporate:
${params.research}

CRITICAL Requirements:
- ONLY ONE PERSON on screen talking directly to the camera (selfie mode)
- NO screens, devices, laptops, phones, or other objects visible
- Just a person in a natural setting (bedroom, living room, kitchen, etc.) talking
- Handheld, mobile-shot aesthetic (authentic TikTok/Instagram Reel vibe)
- Natural, conversational tone - like explaining to a friend, NOT selling anything
- Organic and genuine - avoid any salesy or promotional language
- Person should be explaining the research insights in their own words
- Include natural gestures, expressions, and reactions as they explain
- Keep it dynamic with natural movements and slight camera movements
- Format: Single paragraph prompt describing what the camera sees

Tone Guidelines:
- Friendly and approachable, like sharing something cool you discovered
- Educational but casual - "I found out that..." or "So here's what's interesting..."
- Avoid: "You need to know", "This will change everything", "Don't miss out"
- Use: "I was researching...", "Turns out...", "Here's what I learned..."

Example UGC Prompt: "A person sits casually on their bed, speaking directly to the camera with genuine curiosity. The camera is positioned at eye level, creating that authentic selfie-style TikTok perspective. They start by saying 'Okay so I was looking into this thing and it's actually pretty interesting.' As they explain, they use natural hand gestures to emphasize points. The camera slightly moves as they shift positions, creating that authentic handheld feel. Their expressions change from curiosity to realization as they break down the key points. They occasionally pause to think, then continue explaining in a conversational, friendly way. The lighting is natural, like from a window or room light. Throughout, it's just them talking - no screens, no devices visible, just a person sharing what they learned in a natural, organic way."

Generate a UGC video prompt that feels like a friend naturally explaining these research insights - organic, genuine, and educational without being salesy:`,
  });

  return result.text;
}

// Genbase Sora 2 Video Creation Step
// Note: For MVP, using API key authentication
// TODO: Implement x402 payment for Genbase when available
export async function createSora2Video(params: {
  script: string;
  duration: number;
}) {
  "use step";

  const genbaseApiUrl = process.env.GENBASE_API_URL || 'https://api.genbase.ai';
  const genbaseApiKey = process.env.GENBASE_API_KEY;
  const endpoint = `${genbaseApiUrl}/api/video/create-sora2`;

  console.log('[Genbase] Creating Sora 2 video...');
  console.log('[Genbase] Duration:', params.duration, 'seconds');
  console.log('[Genbase] Prompt length:', params.script.length, 'characters');

  // Prepare headers with API key
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  // Add API key if available
  if (genbaseApiKey) {
    headers['Authorization'] = `Bearer ${genbaseApiKey}`;
    console.log('[Genbase] Using API key authentication');
  } else {
    console.log('[Genbase] No API key - request may fail');
  }

  // Genbase Sora 2 request body
  const requestBody = {
    prompt: params.script,
    model: 'sora-2', // Enhanced quality, up to 10 seconds
    seconds: params.duration.toString(), // "10", "15", or "25"
    size: '1280x720', // 720p landscape (other options: 720x1280, 1792x1024, 1024x1792)
  };

  console.log('[Genbase] Request body:', JSON.stringify(requestBody, null, 2));

  try {
    const response = await axios.post(endpoint, requestBody, {
      headers,
      validateStatus: (status) => status === 200 || status === 402,
    });

    if (response.status === 402) {
      // Payment required
      const errorMsg = response.data.error || 'Payment required: $0.20 USDC';
      console.error('[Genbase] 402 Payment Required:', errorMsg);
      console.error('[Genbase] Expected payment:', response.data.accepts?.[0]);

      throw new FatalError(
        `Genbase Sora 2 payment required: ${errorMsg}. ` +
        `Cost: $0.20 USDC on Base network`
      );
    }

    if (response.status === 200) {
      const data = response.data;

      if (!data.success || !data.data?.id) {
        throw new FatalError('Genbase API returned invalid response');
      }

      const taskId = data.data.id;
      console.log('[Genbase] ✅ Video task created:', taskId);
      console.log('[Genbase] Status:', data.data.status); // "pending"
      console.log('[Genbase] Estimated time: 3-10 minutes');

      // Check for payment confirmation
      const paymentResponseHeader = response.headers['x-payment-response'];
      if (paymentResponseHeader) {
        try {
          const decoded = JSON.parse(
            Buffer.from(paymentResponseHeader, 'base64').toString()
          );
          if (decoded.transaction) {
            console.log('[Genbase] ✅ Payment confirmed - TX:', decoded.transaction);
            console.log('[Genbase] View on BaseScan:',
              `https://basescan.org/tx/${decoded.transaction}`);
          }
        } catch (e) {
          console.error('[Genbase] Could not decode payment response');
        }
      }

      return taskId; // e.g., "sora-2:task_01j9abc123xyz456def789ghi0"
    }

    throw new Error(`Unexpected Genbase response status: ${response.status}`);

  } catch (error) {
    if (axios.isAxiosError(error)) {
      const status = error.response?.status || 500;
      const message = error.response?.data?.message || error.message;

      console.error('[Genbase] API Error:', status, message);

      if (status >= 500) {
        // Retry on server errors
        throw new Error(`Genbase server error: ${message}`);
      } else {
        // Don't retry on client errors
        throw new FatalError(`Genbase error (${status}): ${message}`);
      }
    }

    throw error;
  }
}

// Check Sora 2 Video Status
// This is a simple step that queries the video status once
// The polling loop is in the workflow function (where sleep() can be called)
export async function checkVideoStatus(params: {
  taskId: string;
}) {
  "use step";

  const genbaseApiUrl = process.env.GENBASE_API_URL || 'https://api.genbase.ai';
  const queryEndpoint = `${genbaseApiUrl}/api/video/query`;

  try {
    // Query is FREE - no payment required
    const response = await axios.get(queryEndpoint, {
      params: { id: params.taskId },
      headers: { 'Content-Type': 'application/json' },
    });

    if (response.status === 200 && response.data.success) {
      const data = response.data.data;

      // Return the status data for the workflow to process
      return {
        status: data.status, // pending | processing | video_upsampling | Ready | failed
        video_url: data.video_url,
        thumbnail_url: data.thumbnail_url,
        error: data.error,
      };
    }

    throw new Error(`Unexpected Genbase response: ${response.status}`);

  } catch (error) {
    if (axios.isAxiosError(error)) {
      const status = error.response?.status || 500;
      const message = error.response?.data?.message || error.message;

      console.error('[Genbase] Status check error:', status, message);

      if (status >= 500) {
        // Retry on server errors
        throw new Error(`Genbase server error: ${message}`);
      } else {
        // Don't retry on client errors
        throw new FatalError(`Genbase error (${status}): ${message}`);
      }
    }

    throw error;
  }
}
