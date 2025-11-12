'use client';

import { useState, useEffect, useRef } from 'react';
import Providers from './providers';
import { useIsInitialized, useIsSignedIn, useEvmAddress } from '@coinbase/cdp-hooks';
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

interface ContentResult {
  videoUrl: string;
  script: string;
  research: string;
  totalCostUSD: number;
  transactionHashes?: string[];
}

function ClientApp() {
  const { isInitialized } = useIsInitialized();
  const { isSignedIn } = useIsSignedIn();
  const { evmAddress } = useEvmAddress();

  const [topic, setTopic] = useState('');
  const [loading, setLoading] = useState(false);
  const [runId, setRunId] = useState<string | null>(null);
  const [result, setResult] = useState<ContentResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [progressUpdates, setProgressUpdates] = useState<ContentProgressUpdate[]>([]);
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
      console.log('[Client] User wallet address:', evmAddress);

      // Get CDP user and create viem account for x402 payments
      // This is EXACTLY the pattern from firecrawl-402demo
      let fetchFunc: typeof fetch = fetch;

      try {
        const user = await getCurrentUser();
        if (user && user.evmAccounts && user.evmAccounts.length > 0) {
          const viemAccount = await toViemAccount(user.evmAccounts[0]);
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
      console.log('[Client] Calling Firecrawl search API...');

      const firecrawlEndpoint = process.env.NEXT_PUBLIC_FIRECRAWL_API_BASE_URL ||
        'https://api.firecrawl.dev/v2/x402/search';
      const firecrawlApiKey = process.env.NEXT_PUBLIC_FIRECRAWL_API_KEY;

      if (!firecrawlApiKey) {
        throw new Error('Firecrawl API key not configured');
      }

      // Call Firecrawl with x402-wrapped fetch
      // The wrapper automatically:
      // 1. Makes initial request
      // 2. If 402 returned, creates and signs payment
      // 3. Retries request with X-PAYMENT header
      const searchResponse = await fetchFunc(firecrawlEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${firecrawlApiKey}`,
        },
        body: JSON.stringify({
          query: topic.trim(),
          limit: 5,
          sources: ['web'],
          scrapeOptions: {
            onlyMainContent: true,
          },
        }),
      });

      if (!searchResponse.ok) {
        const errorData = await searchResponse.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(`Firecrawl search failed: ${errorData.error || searchResponse.statusText}`);
      }

      const searchData = await searchResponse.json();
      console.log('[Client] Firecrawl search successful, found', searchData?.data?.web?.length || 0, 'results');

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

      // Step 2: Start workflow with research results
      console.log('[Client] Starting content generation workflow...');
      const response = await fetch('/api/content/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: topic.trim(),
          userId: evmAddress,
          videoDuration: 10,
          research, // Pass research results from Firecrawl
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || `Request failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      console.log('[Client] Workflow started:', data.runId);

      setRunId(data.runId);

      // Stream workflow progress in real-time
      streamProgress(data.runId);
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
        const update: ContentProgressUpdate = JSON.parse(event.data);
        console.log('[Client] Progress update:', update);

        setProgressUpdates((prev) => [...prev, update]);

        // If workflow is completed, fetch final result
        if (update.step === 'completed' && update.status === 'completed') {
          console.log('[Client] Workflow completed, fetching final result');
          fetchFinalResult(runId);
          eventSource.close();
        }

        // If workflow failed, show error
        if (update.step === 'failed' || update.status === 'failed') {
          console.error('[Client] Workflow failed:', update.data?.error);
          setError(update.data?.error || update.message || 'Workflow failed');
          setLoading(false);
          eventSource.close();
        }
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

      // Fallback: fetch final result
      setTimeout(() => {
        fetchFinalResult(runId);
      }, 1000);
    };
  };

  const fetchFinalResult = async (runId: string) => {
    try {
      const response = await fetch(`/api/content/status/${runId}`);
      const data = await response.json();

      if (data.status === 'completed' && data.result) {
        setResult(data.result);
        setLoading(false);
      } else if (data.status === 'failed') {
        setError(data.error || 'Workflow failed');
        setLoading(false);
      } else {
        // Still processing, try again
        setTimeout(() => fetchFinalResult(runId), 2000);
      }
    } catch (error) {
      console.error('[Client] Failed to fetch final result:', error);
      setError('Failed to retrieve final result');
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
                                  {update.data.searchResultsCount !== undefined && (
                                    <p>Found {update.data.searchResultsCount} sources</p>
                                  )}
                                  {update.data.scriptLength !== undefined && (
                                    <p>Script: {update.data.scriptLength} characters</p>
                                  )}
                                  {update.data.videoTaskId && (
                                    <p className="font-mono">Task: {update.data.videoTaskId.slice(0, 20)}...</p>
                                  )}
                                  {update.data.pollingAttempt !== undefined && (
                                    <p>
                                      Attempt {update.data.pollingAttempt}/{update.data.pollingMaxAttempts}
                                      {update.data.videoProgress && ` - ${update.data.videoProgress}`}
                                    </p>
                                  )}
                                  {update.data.paymentTx && (
                                    <p className="font-mono">
                                      Payment TX:{' '}
                                      <a
                                        href={`https://basescan.org/tx/${update.data.paymentTx}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-primary hover:underline"
                                      >
                                        {update.data.paymentTx.slice(0, 10)}...
                                      </a>
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
