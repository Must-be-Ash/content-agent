import { getWritable } from 'workflow';
import {
  generateScript,
  writeProgress,
  closeProgress,
} from './steps/content-steps';

export interface ContentRequest {
  topic: string;
  userId: string; // For wallet association
  videoDuration: number; // seconds (default: 10)
  research: string; // Research results from client-side Firecrawl search
}

export interface ContentResult {
  script: string; // Generated script for video creation
  research: string; // Research used for script generation
  searchResultsCount: number; // Number of sources found
}

// Progress update types for streaming to frontend
export type ProgressStep =
  | 'searching'
  | 'search_payment'
  | 'script_generation'
  | 'completed'
  | 'failed';

export interface ContentProgressUpdate {
  step: ProgressStep;
  status: 'in_progress' | 'completed' | 'failed';
  message: string;
  data?: {
    // Search step
    searchResultsCount?: number;

    // Script generation
    scriptLength?: number;

    // Error details
    error?: string;
  };
}

export async function contentGeneratorWorkflow(
  request: ContentRequest
): Promise<ContentResult> {
  "use workflow";

  // Get writable stream for progress updates
  const progress = getWritable<ContentProgressUpdate>();

  // Research was already performed by client before starting workflow
  // This ensures x402 payments work correctly (client handles 402 responses)
  const research = request.research;

  // Count results from research text (rough estimate)
  const searchResultsCount = (research.match(/\[\d+\]/g) || []).length;

  console.log('[Workflow] Using research from client:', searchResultsCount, 'sources');

  await writeProgress(progress, {
    step: 'searching',
    status: 'completed',
    message: `Using ${searchResultsCount} research sources from web search`,
    data: { searchResultsCount },
  });

  // Generate video script using AI
  await writeProgress(progress, {
    step: 'script_generation',
    status: 'in_progress',
    message: 'Generating video script with AI...',
  });

  const script = await generateScript({
    topic: request.topic,
    research: research,
    duration: request.videoDuration,
  });

  console.log('[Workflow] Script generated:', script.length, 'characters');

  await writeProgress(progress, {
    step: 'script_generation',
    status: 'completed',
    message: 'Script generation complete',
    data: { scriptLength: script.length },
  });

  // Final completion event
  await writeProgress(progress, {
    step: 'completed',
    status: 'completed',
    message: 'Script generation complete! Ready for video creation.',
    data: { scriptLength: script.length },
  });

  // Close the stream
  await closeProgress(progress);

  return {
    script,
    research,
    searchResultsCount,
  };
}
