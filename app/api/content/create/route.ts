import { start } from 'workflow/api';
import { contentGeneratorWorkflow } from '@/workflows/content-generator';
import { checkRateLimit, getClientIdentifier } from '@/lib/rate-limit';

export async function POST(request: Request) {
  try {
    // Content-Type validation
    const contentType = request.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      return Response.json(
        { error: 'Content-Type must be application/json' },
        { status: 415 }
      );
    }

    // Parse body once
    const { topic, userId, videoDuration = 10, research } = await request.json();

    // Rate limiting: 10 requests per hour per IP/user
    const identifier = getClientIdentifier(request, userId);
    const rateLimit = checkRateLimit(identifier, {
      maxRequests: 10,
      windowMs: 3600000, // 1 hour
    });

    if (!rateLimit.success) {
      const resetDate = new Date(rateLimit.reset);
      return Response.json(
        {
          error: 'Rate limit exceeded',
          message: `Too many requests. Please try again after ${resetDate.toISOString()}`,
          retryAfter: Math.ceil((rateLimit.reset - Date.now()) / 1000),
        },
        {
          status: 429,
          headers: {
            'X-RateLimit-Limit': rateLimit.limit.toString(),
            'X-RateLimit-Remaining': rateLimit.remaining.toString(),
            'X-RateLimit-Reset': rateLimit.reset.toString(),
            'Retry-After': Math.ceil((rateLimit.reset - Date.now()) / 1000).toString(),
          },
        }
      );
    }

    // Input validation and sanitization
    if (!research || typeof research !== 'string') {
      return Response.json(
        { error: 'Research data is required and must be a string' },
        { status: 400 }
      );
    }

    if (research.length < 10) {
      return Response.json(
        { error: 'Research data is too short' },
        { status: 400 }
      );
    }

    if (!topic || typeof topic !== 'string') {
      return Response.json(
        { error: 'Topic is required and must be a string' },
        { status: 400 }
      );
    }

    if (topic.length < 3) {
      return Response.json(
        { error: 'Topic must be at least 3 characters' },
        { status: 400 }
      );
    }

    if (topic.length > 200) {
      return Response.json(
        { error: 'Topic must be less than 200 characters' },
        { status: 400 }
      );
    }

    // Sanitize topic (basic XSS prevention - remove HTML tags)
    const sanitizedTopic = topic.replace(/<[^>]*>/g, '').trim();

    if (!sanitizedTopic) {
      return Response.json(
        { error: 'Topic cannot be empty after sanitization' },
        { status: 400 }
      );
    }

    // Validate userId (optional but should be string if provided)
    if (userId && typeof userId !== 'string') {
      return Response.json(
        { error: 'userId must be a string' },
        { status: 400 }
      );
    }

    // Validate videoDuration (must be 10, 15, or 25 seconds for Sora 2)
    const validDurations = [10, 15, 25];
    if (!validDurations.includes(videoDuration)) {
      return Response.json(
        { error: 'videoDuration must be 10, 15, or 25 seconds' },
        { status: 400 }
      );
    }

    console.log('[API] Starting content generation workflow');
    console.log('[API] Topic:', sanitizedTopic);
    console.log('[API] Research length:', research.length, 'characters');
    console.log('[API] Note: x402 payments for Firecrawl and Genbase are handled client-side');
    console.log('[API] Check browser console for payment settlement logs');

    // Start the workflow, passing sanitized inputs
    const { runId } = await start(contentGeneratorWorkflow, [
      {
        topic: sanitizedTopic,
        userId,
        videoDuration,
        research, // Pass research results from client-side Firecrawl search
      },
    ]);

    return Response.json(
      {
        runId,
        status: 'processing',
        message: 'Content generation started',
      },
      {
        headers: {
          'X-RateLimit-Limit': rateLimit.limit.toString(),
          'X-RateLimit-Remaining': rateLimit.remaining.toString(),
          'X-RateLimit-Reset': rateLimit.reset.toString(),
        },
      }
    );
  } catch (error) {
    console.error('[API] Workflow start failed:', error);
    return Response.json(
      { error: 'Failed to start content generation' },
      { status: 500 }
    );
  }
}
