import { start } from 'workflow/api';
import { videoPollWorkflow } from '@/workflows/video-poll';

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

    // Parse body
    const { taskId, script, research } = await request.json();

    // Input validation
    if (!taskId || typeof taskId !== 'string') {
      return Response.json(
        { error: 'taskId is required and must be a string' },
        { status: 400 }
      );
    }

    if (!script || typeof script !== 'string') {
      return Response.json(
        { error: 'script is required and must be a string' },
        { status: 400 }
      );
    }

    if (!research || typeof research !== 'string') {
      return Response.json(
        { error: 'research is required and must be a string' },
        { status: 400 }
      );
    }

    console.log('[API] Starting video poll workflow');
    console.log('[API] Task ID:', taskId);
    console.log('[API] Script length:', script.length, 'characters');

    // Start the video polling workflow
    const { runId } = await start(videoPollWorkflow, [
      {
        taskId,
        script,
        research,
      },
    ]);

    return Response.json({
      runId,
      status: 'polling',
      message: 'Video polling started',
    });
  } catch (error) {
    console.error('[API] Video poll workflow start failed:', error);
    return Response.json(
      { error: 'Failed to start video polling' },
      { status: 500 }
    );
  }
}
