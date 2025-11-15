'use client';

import { useState, useEffect, useRef } from 'react';
import Providers from './providers';
import { useIsInitialized, useIsSignedIn, useCurrentUser } from '@coinbase/cdp-hooks';
import { getCurrentUser, toViemAccount } from '@coinbase/cdp-core';
import { wrapFetchWithPayment } from 'x402-fetch';
import { createWalletClient, http, publicActions } from 'viem';
import { base } from 'viem/chains';
import { LandingPage } from '@/components/landing-page';
import { ExpandableWallet } from '@/components/expandable-wallet';
import { AuroraBackground } from '@/components/ui/aurora-background';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import type { ContentProgressUpdate } from '@/workflows/content-generator';
import type { VideoPollProgressUpdate } from '@/workflows/video-poll';
import {
  logPaymentInitiation,
  logPaymentSettlement,
  logPaymentError,
  extractTxHashFromPaymentResponse,
} from '@/lib/payment-logger';

// Union type for all progress updates (script + video polling)
type ProgressUpdate = ContentProgressUpdate | VideoPollProgressUpdate;

interface ContentResult {
  videoUrl: string;
  script: string;
  research: string;
  totalCostUSD: number;
  thumbnailUrl?: string;
  transactionHashes?: string[];
}

function ClientApp() {
  const { isInitialized } = useIsInitialized();
  const { isSignedIn } = useIsSignedIn();
  const { currentUser } = useCurrentUser();

  // Debug logging to see what's in currentUser
  useEffect(() => {
    if (currentUser) {
      console.log('===== CURRENT USER DEBUG =====');
      console.log('Full currentUser object:', currentUser);
      console.log('evmAccounts:', currentUser.evmAccounts);
      console.log('evmSmartAccounts:', currentUser.evmSmartAccounts);
      console.log('evmAccounts[0]:', currentUser.evmAccounts?.[0]);
      console.log('evmSmartAccounts[0]:', currentUser.evmSmartAccounts?.[0]);
      console.log('=============================');
    }
  }, [currentUser]);

  // Use EOA address directly (not smart account)
  // evmAccounts[0] is already the address string
  const evmAddress = currentUser?.evmAccounts?.[0];

  const [topic, setTopic] = useState('');
  const [loading, setLoading] = useState(false);
  const [runId, setRunId] = useState<string | null>(null);
  const [result, setResult] = useState<ContentResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [progressUpdates, setProgressUpdates] = useState<ProgressUpdate[]>([]);
  const eventSourceRef = useRef<EventSource | null>(null);

  // Cleanup EventSource on unmount
  useEffect(() => {
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    };
  }, []);

  if (!isInitialized) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
          <p className="text-sm text-muted-foreground">Initializing wallet...</p>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim() || !evmAddress) return;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      console.log('[Client] Starting content generation for topic:', topic);
      console.log('[Client] User EOA wallet address:', evmAddress);

      // Get CDP user and create viem account for x402 payments
      // This is EXACTLY the pattern from firecrawl-402demo
      let fetchFunc: typeof fetch = fetch;

      try {
        const user = await getCurrentUser();
        if (user && user.evmAccounts && user.evmAccounts.length > 0) {
          console.log('[Client] CDP user has', user.evmAccounts.length, 'EVM account(s)');

          // Log all accounts for debugging
          user.evmAccounts.forEach((account, idx) => {
            console.log(`[Client] Account ${idx}:`, account);
          });

          const viemAccount = await toViemAccount(user.evmAccounts[0]);
          const paymentAddress = viemAccount.address as string;

          console.log('[Client] 🔑 Wallet address (EOA from evmAccounts[0]):', paymentAddress);
          console.log('[Client] ✅ Using same address for UI and payments');

          const chain = base; // Base network (Chain ID 8453)
          const rpcUrl = 'https://mainnet.base.org';

          const walletClient = createWalletClient({
            account: viemAccount,
            chain: chain,
            transport: http(rpcUrl),
          }).extend(publicActions);

          // Max payment amount in USDC (6 decimals)
          // 0.3 USDC = 300000 units (0.3 * 10^6) - enough for search + video
          const maxPaymentAmount = BigInt(0.3 * 10 ** 6);

          console.log('[Client] Wrapping fetch with x402 payment capability');
          console.log('[Client] Max payment amount:', maxPaymentAmount.toString(), 'units (USDC)');

          // Cast wallet client to any to avoid viem/x402-fetch type mismatch
          fetchFunc = wrapFetchWithPayment(
            fetch,
            walletClient as any,
            maxPaymentAmount
          ) as typeof fetch;
        }
      } catch (signerError) {
        console.warn('[Client] Failed to setup x402 payment:', signerError);
        // Continue without x402 - API will return 402 if payment required
      }

      // Step 1: Search with Firecrawl (x402 payment handled by fetchFunc wrapper)
      console.log('[Client] Calling Firecrawl search API via proxy...');

      // Log payment initiation
      logPaymentInitiation('Firecrawl', 0.05); // Estimated max cost

      // Call API route (which forwards to Firecrawl with API key)
      // The x402-wrapped fetch automatically:
      // 1. Makes initial request to /api/test-firecrawl
      // 2. If 402 returned, creates and signs payment
      // 3. Retries request with X-PAYMENT header
      // 4. API route adds Authorization header and forwards to Firecrawl
      const searchResponse = await fetchFunc('/api/test-firecrawl', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: topic.trim(),
          limit: 10,
          sources: ['web'],
          scrapeOptions: {
            onlyMainContent: true,
          },
        }),
      });

      if (!searchResponse.ok) {
        const errorData = await searchResponse.json().catch(() => ({ error: 'Unknown error' }));
        const errorMsg = `Firecrawl search failed: ${errorData.error || searchResponse.statusText}`;
        logPaymentError('Firecrawl', new Error(errorMsg));
        throw new Error(errorMsg);
      }

      // Extract and log payment settlement from X-PAYMENT-RESPONSE header
      const paymentResponseHeader = searchResponse.headers.get('X-PAYMENT-RESPONSE');
      const txHash = extractTxHashFromPaymentResponse(paymentResponseHeader);

      if (txHash) {
        // Estimate actual cost based on typical Firecrawl pricing (~$0.01-0.05 per search)
        logPaymentSettlement('Firecrawl', txHash, 0.03); // Estimated avg cost
        // Add direct link for quick access
        console.log(`[Client] 🔗 View transaction: https://basescan.org/tx/${txHash}`);
      } else {
        console.log('[Client] No payment required for Firecrawl (API key or free tier)');
      }

      const searchData = await searchResponse.json();
      const resultCount = searchData?.data?.web?.length || 0;
      console.log('[Client] Firecrawl search successful, found', resultCount, 'results');

      // Log detailed search results
      if (resultCount > 0) {
        console.log('[Client] Search Results:');
        searchData.data.web.forEach((result: any, idx: number) => {
          console.log(`  [${idx + 1}] ${result.title || 'Untitled'}`);
          console.log(`      URL: ${result.url || 'N/A'}`);
        });

        // Log preview of first result
        const firstResult = searchData.data.web[0];
        const firstContent = firstResult.markdown || firstResult.content || '';
        if (firstContent) {
          const preview = firstContent.substring(0, 200).replace(/\n/g, ' ');
          console.log(`[Client] First result preview: "${preview}..."`);
        }
      }

      // Format results as research text
      const webResults = searchData?.data?.web || [];
      const research = webResults.length > 0
        ? webResults
            .map((result: any, idx: number) => {
              const title = result.title || 'Untitled';
              const url = result.url || '';
              const content = result.markdown || result.content || '';
              return `[${idx + 1}] ${title}\nURL: ${url}\n\n${content}`;
            })
            .join('\n\n---\n\n')
        : 'No search results found.';

      console.log('[Client] Research text length:', research.length, 'characters');

      // Phase 1: Start script generation workflow
      console.log('[Client] Phase 1: Starting script generation workflow...');
      const scriptResponse = await fetch('/api/content/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: topic.trim(),
          userId: evmAddress,
          videoDuration: 10,
          research,
        }),
      });

      if (!scriptResponse.ok) {
        const errorData = await scriptResponse.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || `Request failed: ${scriptResponse.status} ${scriptResponse.statusText}`);
      }

      const { runId: scriptRunId } = await scriptResponse.json();
      console.log('[Client] Script workflow started:', scriptRunId);

      setRunId(scriptRunId);

      // Stream script generation progress
      streamProgress(scriptRunId);

      // Poll for script completion
      console.log('[Client] Polling for script completion...');
      const scriptResult = await pollWorkflowUntilComplete(scriptRunId);

      console.log('[Client] ✅ Script generated!');
      console.log('[Client] Script:', scriptResult.script.substring(0, 100) + '...');

      // Phase 2: Create video and start polling workflow
      await createVideoAndStartPolling(scriptResult.script, scriptResult.research, fetchFunc);
    } catch (error) {
      console.error('[Client] Failed to create content:', error);

      let errorMessage = 'An unknown error occurred';
      if (error instanceof Error) {
        if (error.message.includes('rejected')) {
          errorMessage = 'Payment was rejected';
        } else if (error.message.includes('Insufficient funds')) {
          errorMessage = 'Insufficient USDC balance';
        } else {
          errorMessage = error.message;
        }
      }

      setError(errorMessage);
      setLoading(false);
    }
  };

  // Helper: Poll workflow until completion
  const pollWorkflowUntilComplete = async (runId: string): Promise<any> => {
    const maxAttempts = 60; // 60 attempts * 2s = 2 minutes max for workflow completion check

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        const response = await fetch(`/api/content/status/${runId}`);
        const data = await response.json();

        // Debug logging to diagnose polling issue
        console.log(`[Client] Poll attempt ${attempt}/${maxAttempts}`);
        console.log(`[Client] Status: ${data.status}`);
        console.log(`[Client] Has result: ${!!data.result}`);
        if (data.result) {
          console.log(`[Client] Result type: ${typeof data.result}`);
          console.log(`[Client] Result keys:`, Object.keys(data.result));
        }

        if (data.status === 'completed' && data.result) {
          console.log('[Client] ✅ Workflow completed! Result:', data.result);
          return data.result;
        }

        if (data.status === 'failed') {
          throw new Error(data.error || 'Workflow failed');
        }

        // Still processing, wait before trying again
        await new Promise((resolve) => setTimeout(resolve, 2000)); // 2 second interval
      } catch (error) {
        console.error('[Client] Error polling workflow:', error);
        throw error;
      }
    }

    throw new Error('Workflow polling timeout');
  };

  const streamProgress = async (runId: string) => {
    // Close any existing EventSource
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    setProgressUpdates([]);

    console.log('[Client] Starting to stream workflow progress for runId:', runId);

    const eventSource = new EventSource(`/api/content/stream/${runId}`);
    eventSourceRef.current = eventSource;

    eventSource.onmessage = (event) => {
      try {
        const update: ProgressUpdate = JSON.parse(event.data);
        console.log('[Client] Progress update:', update);

        setProgressUpdates((prev) => [...prev, update]);

        // Note: We don't handle completion here because we're using
        // a separate polling mechanism after the workflow completes
      } catch (err) {
        console.error('[Client] Failed to parse progress update:', err);
      }
    };

    eventSource.addEventListener('done', () => {
      console.log('[Client] Stream completed');
      eventSource.close();
    });

    eventSource.onerror = (err) => {
      console.error('[Client] EventSource error:', err);
      eventSource.close();
    };
  };

  // Phase 2: Create video and start polling workflow
  const createVideoAndStartPolling = async (script: string, research: string, fetchFunc: typeof fetch) => {
    try {
      console.log('[Client] Phase 2: Creating video with Genbase Sora 2');
      console.log('[Client] Script received for video:', script);
      console.log('[Client] Script length:', script.length, 'characters');
      console.log('[Client] Research length:', research.length, 'characters');

      // Verify script is not empty
      if (!script || script.trim().length === 0) {
        throw new Error('Script is empty - cannot create video');
      }

      // Log payment initiation
      logPaymentInitiation('Genbase Sora 2', 0.20); // Fixed cost: $0.20 per 10s video

      // Call API route (which forwards to Genbase)
      // The x402-wrapped fetch automatically:
      // 1. Makes initial request to /api/genbase/create-video
      // 2. If 402 returned, creates and signs payment
      // 3. Retries request with X-PAYMENT header
      // 4. API route forwards X-PAYMENT header to Genbase
      const videoResponse = await fetchFunc('/api/genbase/create-video', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: script,
          model: 'sora-2',
          seconds: '10',
          size: '1280x720',
        }),
      });

      if (!videoResponse.ok) {
        const errorData = await videoResponse.json().catch(() => ({ error: 'Unknown error' }));
        const errorMsg = `Video generation failed: ${errorData.error || videoResponse.statusText}`;
        logPaymentError('Genbase Sora 2', new Error(errorMsg));
        throw new Error(errorMsg);
      }

      // Extract and log payment settlement
      const paymentResponseHeader = videoResponse.headers.get('X-PAYMENT-RESPONSE');
      const txHash = extractTxHashFromPaymentResponse(paymentResponseHeader);

      if (txHash) {
        logPaymentSettlement('Genbase Sora 2', txHash, 0.20);
        // Add direct link for quick access
        console.log(`[Client] 🔗 View transaction: https://basescan.org/tx/${txHash}`);
      } else {
        console.log('[Client] No payment required for Genbase (API key or free tier)');
      }

      const videoData = await videoResponse.json();
      console.log('[Client] Genbase response:', {
        success: videoData.success,
        taskId: videoData.data?.id,
        status: videoData.data?.status
      });

      if (!videoData.success || !videoData.data?.id) {
        throw new Error('Genbase API returned invalid response');
      }

      const taskId = videoData.data.id;
      console.log('[Client] Video task created:', taskId);

      // Start video polling workflow
      console.log('[Client] Starting video polling workflow...');
      const pollResponse = await fetch('/api/content/video-poll', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskId, script, research }),
      });

      if (!pollResponse.ok) {
        throw new Error(`Failed to start video polling: ${pollResponse.statusText}`);
      }

      const { runId: pollRunId } = await pollResponse.json();
      console.log('[Client] Video polling workflow started:', pollRunId);

      // Stream progress for video polling
      streamProgress(pollRunId);

      // Poll for final video result
      const videoResult = await pollWorkflowUntilComplete(pollRunId);

      console.log('[Client] ✅ Video ready!', videoResult.videoUrl);

      // Set final result
      setResult({
        videoUrl: videoResult.videoUrl,
        script: videoResult.script,
        research: videoResult.research,
        thumbnailUrl: videoResult.thumbnailUrl,
        totalCostUSD: 0.25, // ~$0.05 search + $0.20 video
      });

      setLoading(false);
    } catch (error) {
      console.error('[Client] Failed to create video:', error);

      let errorMessage = 'Failed to create video';
      if (error instanceof Error) {
        if (error.message.includes('rejected')) {
          errorMessage = 'Video payment was rejected';
        } else if (error.message.includes('Insufficient funds')) {
          errorMessage = 'Insufficient USDC balance for video generation';
        } else {
          errorMessage = error.message;
        }
      }

      setError(errorMessage);
      setLoading(false);
    }
  };

  return (
    <>
      {!isSignedIn && <LandingPage />}
      {isSignedIn && (
        <>
          <ExpandableWallet />
          <AuroraBackground className="min-h-screen items-start justify-start overflow-y-auto">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-20 max-w-4xl w-full">
              {/* Header Section */}
              <div className="text-center mb-12 sm:mb-16">
                <p className="text-muted-foreground text-sm sm:text-base max-w-md mx-auto">
                  An autonomous AI agent that generates content. It uses x402 to pay for services it needs (Firecrawl for web search and Sora for video generation) to execute the workflow. Powered by Embedded Wallets (CDP) and Vercel's Workflow Kit.
                </p>
              </div>

              {/* Main Form Card */}
              <Card className="border-2 shadow-xl">
                <CardContent className="p-6 sm:p-8 lg:p-10">
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-2">
                      <label htmlFor="topic" className="text-sm font-medium text-muted-foreground">
                        Topic
                      </label>
                      <Input
                        id="topic"
                        value={topic}
                        onChange={(e) => setTopic(e.target.value)}
                        placeholder="Enter your topic (e.g., what's new with x402)"
                        disabled={loading}
                        className="text-base h-12 border-2 focus:border-primary transition-colors"
                      />
                    </div>

                    <Button 
                      type="submit" 
                      disabled={loading || !topic.trim()} 
                      className="w-full h-12 text-base font-semibold shadow-lg hover:shadow-xl transition-shadow"
                      size="lg"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                          Generating...
                        </>
                      ) : (
                        'Generate Video'
                      )}
                    </Button>
                  </form>
                </CardContent>
              </Card>

              {/* Error State */}
              {error && (
                <Card className="mt-6 border-destructive/50 bg-destructive/5">
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-3">
                      <div className="flex-shrink-0 w-2 h-2 rounded-full bg-destructive" />
                      <p className="text-destructive font-medium">{error}</p>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Progress State */}
              {loading && (
                <Card className="mt-6 border-2">
                  <CardHeader>
                    <CardTitle className="text-xl flex items-center gap-2">
                      <Loader2 className="w-5 h-5 animate-spin text-primary" />
                      Generating Your Content
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {progressUpdates.length === 0 ? (
                      <div className="text-center py-4">
                        <p className="text-sm text-muted-foreground">
                          Starting workflow...
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {progressUpdates.map((update, idx) => (
                          <div
                            key={idx}
                            className={`flex items-start gap-3 p-3 rounded-lg border ${
                              update.status === 'completed'
                                ? 'bg-green-500/10 border-green-500/20'
                                : update.status === 'failed'
                                ? 'bg-red-500/10 border-red-500/20'
                                : 'bg-primary/10 border-primary/20'
                            }`}
                          >
                            <div className="flex-shrink-0 mt-0.5">
                              {update.status === 'completed' ? (
                                <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center">
                                  <svg
                                    className="w-3 h-3 text-white"
                                    fill="none"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth="2"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                  >
                                    <path d="M5 13l4 4L19 7"></path>
                                  </svg>
                                </div>
                              ) : update.status === 'failed' ? (
                                <div className="w-5 h-5 rounded-full bg-red-500 flex items-center justify-center">
                                  <svg
                                    className="w-3 h-3 text-white"
                                    fill="none"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth="2"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                  >
                                    <path d="M6 18L18 6M6 6l12 12"></path>
                                  </svg>
                                </div>
                              ) : (
                                <Loader2 className="w-5 h-5 animate-spin text-primary" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm">
                                {update.message}
                              </p>
                              {update.data && (
                                <div className="mt-1 text-xs text-muted-foreground space-y-0.5">
                                  {'searchResultsCount' in update.data && update.data.searchResultsCount !== undefined && (
                                    <p>Found {update.data.searchResultsCount} sources</p>
                                  )}
                                  {'scriptLength' in update.data && update.data.scriptLength !== undefined && (
                                    <p>Script: {update.data.scriptLength} characters</p>
                                  )}
                                  {'videoTaskId' in update.data && update.data.videoTaskId && (
                                    <p className="font-mono">Task: {update.data.videoTaskId.slice(0, 20)}...</p>
                                  )}
                                  {'pollingAttempt' in update.data && update.data.pollingAttempt !== undefined && (
                                    <p>
                                      Attempt {update.data.pollingAttempt}/{update.data.pollingMaxAttempts}
                                      {update.data.videoProgress && ` - ${update.data.videoProgress}`}
                                    </p>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    {runId && (
                      <div className="pt-2 border-t">
                        <p className="text-xs text-muted-foreground font-mono">
                          Run ID: {runId}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Result State */}
              {result && (
                <Card className="mt-6 border-2 shadow-xl">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-2xl">Your Generated Content</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="rounded-lg overflow-hidden border-2 bg-muted/30">
                      <video controls className="w-full aspect-video">
                        <source src={result.videoUrl} type="video/mp4" />
                      </video>
                    </div>

                    <div className="grid gap-6 sm:grid-cols-2">
                      <div className="space-y-3">
                        <h3 className="font-semibold text-lg flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                          Script
                        </h3>
                        <div className="p-4 rounded-lg bg-muted/50 border">
                          <p className="text-sm whitespace-pre-wrap leading-relaxed">
                            {result.script}
                          </p>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <h3 className="font-semibold text-lg flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                          Research
                        </h3>
                        <div className="p-4 rounded-lg bg-muted/50 border max-h-64 overflow-y-auto">
                          <p className="text-sm text-muted-foreground leading-relaxed">
                            {result.research}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t">
                      <span className="text-sm text-muted-foreground">Total Cost</span>
                      <span className="text-lg font-bold">
                        ${result.totalCostUSD.toFixed(2)} USDC
                      </span>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </AuroraBackground>
        </>
      )}
    </>
  );
}

export default function Home() {
  return (
    <Providers>
      <ClientApp />
    </Providers>
  );
}
