import { getRun } from 'workflow/api';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ runId: string }> }
) {
  try {
    const { runId } = await params;
    const run = getRun(runId) as any; // Type assertion needed for output property

    // Properties on Run are promises that need to be awaited
    const status = await run.status;
    const output = status === 'completed' ? await run.output : undefined;
    const error = status === 'failed' ? await run.error : undefined;

    return Response.json({
      runId: runId,
      status: status, // 'running' | 'completed' | 'failed'
      result: output, // ContentResult if completed
      error: error,
    });
  } catch (error) {
    console.error('[API] Failed to get run status:', error);
    return Response.json(
      { error: 'Run not found' },
      { status: 404 }
    );
  }
}
