import { getRun } from 'workflow/api';
import type { ContentProgressUpdate } from '@/workflows/content-generator';

export const dynamic = 'force-dynamic';

/**
 * Stream workflow progress updates to the client using Server-Sent Events (SSE)
 * This endpoint returns a readable stream that emits ContentProgressUpdate events
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ runId: string }> }
) {
  try {
    const { runId } = await params;

    // Get the workflow run
    const run = getRun(runId) as any;

    // Check if run exists
    if (!run) {
      return Response.json({ error: 'Run not found' }, { status: 404 });
    }

    // Get the readable stream from the run
    const readable = run.readable as ReadableStream<ContentProgressUpdate>;

    if (!readable) {
      return Response.json({ error: 'No stream available for this run' }, { status: 404 });
    }

    // Create a new ReadableStream that transforms progress updates to SSE format
    const stream = new ReadableStream({
      async start(controller) {
        const reader = readable.getReader();
        const encoder = new TextEncoder();

        try {
          while (true) {
            const { done, value } = await reader.read();

            if (done) {
              // Send completion event
              controller.enqueue(
                encoder.encode('event: done\ndata: {}\n\n')
              );
              controller.close();
              break;
            }

            // Send progress update as SSE event
            const sseData = `data: ${JSON.stringify(value)}\n\n`;
            controller.enqueue(encoder.encode(sseData));
          }
        } catch (error) {
          console.error('[Stream] Error reading workflow stream:', error);
          // Send error event
          controller.enqueue(
            encoder.encode(
              `event: error\ndata: ${JSON.stringify({
                message: 'Stream error',
                error: error instanceof Error ? error.message : 'Unknown error'
              })}\n\n`
            )
          );
          controller.close();
        } finally {
          reader.releaseLock();
        }
      },
    });

    // Return SSE response
    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        'Connection': 'keep-alive',
        'X-Accel-Buffering': 'no', // Disable nginx buffering
      },
    });
  } catch (error) {
    console.error('[Stream] API Error:', error);
    return Response.json(
      { error: 'Failed to stream workflow progress' },
      { status: 500 }
    );
  }
}
