'use client';

import { useState, useEffect } from 'react';
import Providers from '../providers';
import { useCurrentUser, useIsSignedIn, useIsInitialized } from '@coinbase/cdp-hooks';
import { getCurrentUser, toViemAccount } from '@coinbase/cdp-core';
import { wrapFetchWithPayment } from 'x402-fetch';
import { createWalletClient, http, publicActions } from 'viem';
import { base } from 'viem/chains';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import {
  logPaymentInitiation,
  logPaymentSettlement,
  logPaymentError,
  extractTxHashFromPaymentResponse,
} from '@/lib/payment-logger';

interface SearchResult {
  title: string;
  url: string;
  markdown?: string;
  content?: string;
}

interface SearchResponse {
  success: boolean;
  data: {
    web: SearchResult[];
  };
}

function TestFirecrawlContent() {
  const { isSignedIn } = useIsSignedIn();
  const { isInitialized } = useIsInitialized();
  const { currentUser } = useCurrentUser();

  // Debug logging to see what's in currentUser
  useEffect(() => {
    if (currentUser) {
      console.log('===== TEST PAGE - CURRENT USER DEBUG =====');
      console.log('Full currentUser object:', currentUser);
      console.log('evmAccounts:', currentUser.evmAccounts);
      console.log('evmSmartAccounts:', currentUser.evmSmartAccounts);
      console.log('evmAccounts[0]:', currentUser.evmAccounts?.[0]);
      console.log('evmSmartAccounts[0]:', currentUser.evmSmartAccounts?.[0]);
      console.log('==========================================');
    }
  }, [currentUser]);

  // Use EOA address directly (not smart account)
  const evmAddress = currentUser?.evmAccounts?.[0];

  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<SearchResult[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [paymentTxHash, setPaymentTxHash] = useState<string | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    if (!evmAddress) {
      setError('Wallet not connected');
      return;
    }

    setIsLoading(true);
    setError(null);
    setResults(null);
    setPaymentTxHash(null);

    try {
      console.log('[Test] Starting Firecrawl search with x402 payment');
      console.log('[Test] Query:', query.trim());
      console.log('[Test] EOA wallet address:', evmAddress);

      // Get CDP user and convert to viem account for x402
      // EXACT PATTERN from firecrawl-402demo
      let fetchFunc: typeof fetch = fetch;

      try {
        const user = await getCurrentUser();
        if (user && user.evmAccounts && user.evmAccounts.length > 0) {
          console.log('[Test] CDP user has', user.evmAccounts.length, 'EVM account(s)');

          // Log all accounts for debugging
          user.evmAccounts.forEach((account, idx) => {
            console.log(`[Test] Account ${idx}:`, account);
          });

          const viemAccount = await toViemAccount(user.evmAccounts[0]);
          const paymentAddress = viemAccount.address as string;

          console.log('[Test] 🔑 EOA wallet address (evmAccounts[0]):', paymentAddress);
          console.log('[Test] ✅ Using same address for UI and payments');

          const chain = base;
          const rpcUrl = 'https://mainnet.base.org';

          const walletClient = createWalletClient({
            account: viemAccount,
            chain: chain,
            transport: http(rpcUrl),
          }).extend(publicActions);

          const maxPaymentAmount = BigInt(0.1 * 10 ** 6); // 0.1 USDC

          console.log('[Test] Wrapping fetch with x402 payment capability');
          console.log('[Test] Max payment amount:', maxPaymentAmount.toString(), 'units (0.1 USDC)');

          // @ts-ignore
          fetchFunc = wrapFetchWithPayment(fetch, walletClient, maxPaymentAmount) as typeof fetch;
        }
      } catch (signerError) {
        console.warn('[Test] Failed to setup x402 payment:', signerError);
        // Continue without x402 - API will return 402 if payment required
      }

      // Log payment initiation
      logPaymentInitiation('Firecrawl', 0.05);

      // Make request to API route (which forwards to Firecrawl)
      // EXACT PATTERN from firecrawl-402demo
      const requestBody = {
        query: query.trim(),
        limit: 5,
        sources: ['web'],
        scrapeOptions: {
          onlyMainContent: true,
        },
      };

      console.log('[Test] Calling API route with x402-wrapped fetch');
      const response = await fetchFunc('/api/test-firecrawl', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        const errorMsg = `Search failed: ${errorData.error || response.statusText}`;
        logPaymentError('Firecrawl', new Error(errorMsg));
        throw new Error(errorMsg);
      }

      // Extract payment response header
      const paymentResponseHeader = response.headers.get('X-PAYMENT-RESPONSE');
      console.log('[Test] X-PAYMENT-RESPONSE header:', paymentResponseHeader);

      const txHash = extractTxHashFromPaymentResponse(paymentResponseHeader);

      if (txHash) {
        console.log('[Test] ✅ Payment transaction hash found:', txHash);
        logPaymentSettlement('Firecrawl', txHash, 0.03);
        setPaymentTxHash(txHash);
      } else {
        console.log('[Test] No payment transaction hash in response');
      }

      const data: SearchResponse = await response.json();
      console.log('[Test] Search successful, found', data?.data?.web?.length || 0, 'results');

      setResults(data.data.web || []);
      setIsLoading(false);

    } catch (err) {
      console.error('[Test] Search failed:', err);

      let errorMessage = 'An unknown error occurred';
      if (err instanceof Error) {
        if (err.message.includes('rejected')) {
          errorMessage = 'Payment was rejected';
        } else if (err.message.includes('Insufficient funds')) {
          errorMessage = 'Insufficient USDC balance';
        } else {
          errorMessage = err.message;
        }
      }

      setError(errorMessage);
      setIsLoading(false);
    }
  };

  if (!isInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
        <Card className="w-full max-w-md mx-4">
          <CardHeader>
            <CardTitle>Loading...</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <Loader2 className="w-5 h-5 animate-spin" />
              <p className="text-gray-600">Initializing wallet...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!isSignedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
        <Card className="w-full max-w-md mx-4">
          <CardHeader>
            <CardTitle>Wallet Required</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600">Please sign in with your wallet to test Firecrawl x402 payments.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4">
      <div className="max-w-4xl mx-auto py-8 space-y-6">
        {/* Header */}
        <Card>
          <CardHeader>
            <CardTitle>Firecrawl x402 Payment Test</CardTitle>
            <p className="text-sm text-gray-600 mt-2">
              Test Firecrawl search with x402 micropayments. Check the browser console for detailed payment logs.
            </p>
            <div className="mt-4">
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-xs text-blue-700 mb-1">EOA Wallet Address:</p>
                <p className="text-sm font-mono text-blue-900">{evmAddress}</p>
                <p className="text-xs text-blue-600 mt-1">✅ Used for both UI display and payments</p>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Search Form */}
        <Card>
          <CardContent className="pt-6">
            <form onSubmit={handleSearch} className="space-y-4">
              <div className="flex gap-2">
                <Input
                  type="text"
                  placeholder="Enter search query (e.g., what's x402 protocol?)"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  disabled={isLoading}
                  className="flex-1"
                />
                <Button type="submit" disabled={isLoading || !query.trim()}>
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Searching...
                    </>
                  ) : (
                    'Search'
                  )}
                </Button>
              </div>

              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setQuery("what's x402 protocol?")}
                  disabled={isLoading}
                >
                  what&apos;s x402 protocol?
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setQuery("what's Firecrawl?")}
                  disabled={isLoading}
                >
                  what&apos;s Firecrawl?
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setQuery("latest AI news")}
                  disabled={isLoading}
                >
                  latest AI news
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Payment Info */}
        {paymentTxHash && (
          <Card className="border-green-200 bg-green-50">
            <CardHeader>
              <CardTitle className="text-green-900 text-lg">✅ Payment Confirmed</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="text-sm font-mono text-green-800 break-all">
                  TX: {paymentTxHash}
                </p>
                <a
                  href={`https://basescan.org/tx/${paymentTxHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-blue-600 hover:underline"
                >
                  View on BaseScan →
                </a>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Error */}
        {error && (
          <Card className="border-red-200 bg-red-50">
            <CardHeader>
              <CardTitle className="text-red-900 text-lg">Error</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-red-800">{error}</p>
            </CardContent>
          </Card>
        )}

        {/* Results */}
        {results && results.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Search Results ({results.length})</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {results.map((result, idx) => (
                <div key={idx} className="p-4 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors">
                  <h3 className="font-semibold text-gray-900 mb-1">{result.title}</h3>
                  <a
                    href={result.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 hover:underline mb-2 block"
                  >
                    {result.url}
                  </a>
                  {(result.markdown || result.content) && (
                    <p className="text-sm text-gray-600 line-clamp-3">
                      {(result.markdown || result.content)?.substring(0, 200)}...
                    </p>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Instructions */}
        <Card className="bg-yellow-50 border-yellow-200">
          <CardHeader>
            <CardTitle className="text-yellow-900 text-lg">📋 Testing Instructions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-yellow-900">
            <p><strong>1.</strong> Open browser console (F12) to see detailed payment logs</p>
            <p><strong>2.</strong> Enter a search query and click Search</p>
            <p><strong>3.</strong> Watch for payment initiation and settlement logs</p>
            <p><strong>4.</strong> Check your wallet balance before/after to confirm payment</p>
            <p><strong>5.</strong> Verify transaction on BaseScan using the link above</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function TestFirecrawlPage() {
  return (
    <Providers>
      <TestFirecrawlContent />
    </Providers>
  );
}
