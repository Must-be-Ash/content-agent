import { getWritable, sleep } from 'workflow';
import {
  checkVideoStatus,
  writeProgress,
  closeProgress,
} from './steps/content-steps';

export interface VideoPollRequest {
  taskId: string; // Genbase task ID from video creation
  script: string; // Script that was used for video
  research: string; // Research that was used for script
}

export interface VideoPollResult {
  videoUrl: string; // Final video URL
  thumbnailUrl?: string; // Video thumbnail URL
  script: string; // Script used
  research: string; // Research used
  videoTaskId: string; // Genbase task ID (for reference)
}

// Progress update types for video polling
export type VideoPollProgressStep =
  | 'video_polling'
  | 'completed'
  | 'failed';

export interface VideoPollProgressUpdate {
  step: VideoPollProgressStep;
  status: 'in_progress' | 'completed' | 'failed';
  message: string;
  data?: {
    // Video task
    videoTaskId?: string;

    // Polling progress
    pollingAttempt?: number;
    pollingMaxAttempts?: number;
    videoStatus?: string;
    videoProgress?: string;
    estimatedWaitSeconds?: number;

    // Final result
    videoUrl?: string;
    thumbnailUrl?: string;

    // Error details
    error?: string;
  };
}

export async function videoPollWorkflow(
  request: VideoPollRequest
): Promise<VideoPollResult> {
  "use workflow";

  // Get writable stream for progress updates
  const progress = getWritable<VideoPollProgressUpdate>();

  const { taskId, script, research } = request;

  console.log('[VideoPoll Workflow] Starting video polling for task:', taskId);

  await writeProgress(progress, {
    step: 'video_polling',
    status: 'in_progress',
    message: 'Generating video... This may take 3-10 minutes',
    data: {
      videoTaskId: taskId,
      pollingAttempt: 1,
      pollingMaxAttempts: 8,
      estimatedWaitSeconds: 180, // 3 minutes minimum
    },
  });

  const maxAttempts = 8; // 8 attempts * 2 min = 16 minutes max

  let lastStatus = '';

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    console.log(`[VideoPoll Workflow] Polling attempt ${attempt}/${maxAttempts}`);

    const status = await checkVideoStatus({ taskId });

    console.log(`[VideoPoll Workflow] Status: ${status.status}`);

    // Map status to progress percentage
    const progressPercent =
      status.status === 'pending'
        ? '20%'
        : status.status === 'processing'
        ? '50%'
        : status.status === 'video_upsampling'
        ? '80%'
        : 'Unknown';

    // Only send progress update if status changed (avoid spamming UI)
    if (status.status !== lastStatus) {
      await writeProgress(progress, {
        step: 'video_polling',
        status: 'in_progress',
        message: `Generating video... (${progressPercent})`,
        data: {
          videoTaskId: taskId,
          pollingAttempt: attempt,
          pollingMaxAttempts: maxAttempts,
          videoStatus: status.status,
          videoProgress: progressPercent,
        },
      });
      lastStatus = status.status;
    }

    // Check if video is ready
    if (status.status === 'Ready' || status.status === 'completed') {
      console.log('[VideoPoll Workflow] ✅ Video ready:', status.video_url);

      await writeProgress(progress, {
        step: 'completed',
        status: 'completed',
        message: 'Video generation complete!',
        data: {
          videoUrl: status.video_url,
          thumbnailUrl: status.thumbnail_url,
        },
      });

      // Close the stream
      await closeProgress(progress);

      return {
        videoUrl: status.video_url,
        thumbnailUrl: status.thumbnail_url,
        script,
        research,
        videoTaskId: taskId,
      };
    }

    // Check if video generation failed
    if (status.status === 'failed') {
      console.error('[VideoPoll Workflow] Video generation failed:', status.error);

      await writeProgress(progress, {
        step: 'failed',
        status: 'failed',
        message: 'Video generation failed',
        data: { error: status.error || 'Video generation failed' },
      });

      await closeProgress(progress);

      throw new Error(status.error || 'Video generation failed');
    }

    // Wait 2 minutes before next poll (except on last attempt)
    if (attempt < maxAttempts) {
      await sleep('2m'); // Zero compute cost - workflow paused for 2 minutes
    }
  }

  // Timeout after max attempts
  console.error('[VideoPoll Workflow] Video generation timed out after', maxAttempts, 'attempts');

  await writeProgress(progress, {
    step: 'failed',
    status: 'failed',
    message: 'Video generation timed out after 15 minutes',
    data: { error: 'Polling timeout' },
  });

  await closeProgress(progress);

  throw new Error('Video generation timeout after 15 minutes');
}
