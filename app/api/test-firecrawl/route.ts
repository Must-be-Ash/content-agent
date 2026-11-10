import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

export const dynamic = 'force-dynamic';

// Test endpoint for Firecrawl x402 payment verification
// Copied EXACTLY from firecrawl-402demo/app/api/scrape/route.ts

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { query, limit } = body;

    // Validate required fields
    if (!query) {
      return NextResponse.json(
        { error: 'Query is required' },
        { status: 400 }
      );
    }

    // Check for x402 payment header (v2: PAYMENT-SIGNATURE, v1: X-PAYMENT)
    const paymentHeaderName = request.headers.get('PAYMENT-SIGNATURE') ? 'PAYMENT-SIGNATURE' : 'X-PAYMENT';
    const paymentHeader = request.headers.get(paymentHeaderName);

    // Log the payment header if present (for debugging)
    if (paymentHeader) {
      console.log('Payment header received, forwarding to Firecrawl');
      console.log(`${paymentHeaderName} header (first 200 chars):`, paymentHeader.substring(0, 200));

      // Decode and log the payment details
      try {
        const decoded = JSON.parse(Buffer.from(paymentHeader, 'base64').toString());
        console.log('Decoded payment:', JSON.stringify(decoded, null, 2));

        // Payment validation logging
        console.log('═══ PAYMENT VALIDATION ═══');
        console.log('x402 Version:', decoded.x402Version);
        console.log('Payment Scheme:', decoded.accepted?.scheme ?? decoded.scheme);
        console.log('Network:', decoded.accepted?.network ?? decoded.network);
        console.log('From Address:', decoded.payload?.authorization?.from);
        console.log('To Address (Recipient):', decoded.payload?.authorization?.to);
        console.log('Payment Value:', decoded.payload?.authorization?.value, 'units');
        console.log('Payment Value (USDC):', (parseInt(decoded.payload?.authorization?.value) / 1e6).toFixed(6), 'USDC');
        console.log('Payment Nonce:', decoded.payload?.authorization?.nonce);
        console.log('Valid After:', decoded.payload?.authorization?.validAfter, '(', new Date(parseInt(decoded.payload?.authorization?.validAfter) * 1000).toISOString(), ')');
        console.log('Valid Before:', decoded.payload?.authorization?.validBefore, '(', new Date(parseInt(decoded.payload?.authorization?.validBefore) * 1000).toISOString(), ')');
        console.log('Current Time:', Math.floor(Date.now() / 1000), '(', new Date().toISOString(), ')');
        console.log('Signature:', decoded.payload?.signature);

        // Validate network matches env
        const expectedNetwork = process.env.NEXT_PUBLIC_NETWORK || 'eip155:8453';
        const paidNetwork = decoded.accepted?.network ?? decoded.network;
        if (paidNetwork !== expectedNetwork && decoded.x402Version !== 1) {
          console.warn(`⚠️  WARNING: Payment network (${paidNetwork}) doesn't match expected network (${expectedNetwork})`);
        }

        const expectedUSDC = process.env.USDC_CONTRACT_ADDRESS;
        console.log('Expected USDC Contract:', expectedUSDC);
        console.log('═══ END PAYMENT VALIDATION ═══');
      } catch (e) {
        console.log('Could not decode payment header as base64 JSON');
      }
    } else {
      console.log('No payment header, Firecrawl will return 402');
    }

    // x402 search needs no API key; the payment header is the credential
    const firecrawlHeaders: any = {
      'Content-Type': 'application/json',
    };

    // Forward the payment header (same name the client used) if provided
    if (paymentHeader) {
      firecrawlHeaders[paymentHeaderName] = paymentHeader;
    }

    // Firecrawl's own x402 endpoint was retired; StableEnrich proxies Firecrawl search over x402 v2
    const firecrawlEndpoint = process.env.X402_SEARCH_URL || 'https://stableenrich.dev/api/firecrawl/search';
    console.log('Calling Firecrawl x402 search endpoint:', firecrawlEndpoint);
    console.log('Search query:', query);

    // StableEnrich accepts { query, limit } with limit capped at 10
    const searchOptions = {
      query,
      limit: Math.min(limit || 10, 10),
    };

    console.log('Search options:', JSON.stringify(searchOptions, null, 2));

    // Call Firecrawl's x402 search endpoint
    let firecrawlResponse;
    try {
      firecrawlResponse = await axios.post(
        firecrawlEndpoint,
        searchOptions,
        {
          headers: firecrawlHeaders,
          validateStatus: (status) => status === 200 || status === 402 || status === 500,
        }
      );
    } catch (verificationError: any) {
      console.error('═══ FACILITATOR VERIFICATION ERROR ═══');
      console.error('Failed to verify payment with Firecrawl facilitator');
      console.error('Error type:', verificationError?.name || typeof verificationError);
      console.error('Error message:', verificationError?.message || String(verificationError));
      console.error('Facilitator URL:', firecrawlEndpoint);

      if (verificationError?.code) {
        console.error('Error code:', verificationError.code);
      }

      if (verificationError?.code === 'ECONNABORTED' || verificationError?.message?.includes('timeout')) {
        console.error('⚠️  This appears to be a timeout error');
      }

      if (verificationError?.stack) {
        console.error('Stack trace:', verificationError.stack);
      }

      console.error('═══ END FACILITATOR ERROR ═══');

      return NextResponse.json(
        {
          error: 'Facilitator verification failed',
          message: `Payment verification failed: ${verificationError?.message || 'Unknown error'}`,
          errorType: verificationError?.name || 'UnknownError',
          facilitatorUrl: firecrawlEndpoint
        },
        { status: 500 }
      );
    }

    // Handle Firecrawl's response
    if (firecrawlResponse.status === 402) {
      // Payment required
      const is_verification_failure = firecrawlResponse.data.error &&
                                      firecrawlResponse.data.error.toLowerCase().includes('verification');

      if (is_verification_failure) {
        console.error('═══ PAYMENT VERIFICATION FAILED ═══');
        console.error('Firecrawl rejected the payment:');
        console.error('Error:', firecrawlResponse.data.error);
        console.error('Network:', firecrawlResponse.data.accepts?.[0]?.network);
        console.error('Expected asset:', firecrawlResponse.data.accepts?.[0]?.asset);
        console.error('Expected recipient:', firecrawlResponse.data.accepts?.[0]?.payTo);
        console.error('Max amount:', firecrawlResponse.data.accepts?.[0]?.amount ?? firecrawlResponse.data.accepts?.[0]?.maxAmountRequired);

        if (paymentHeader) {
          try {
            const decoded = JSON.parse(Buffer.from(paymentHeader, 'base64').toString());
            console.error('Payment we sent:');
            console.error('  Network:', decoded.network);
            console.error('  From:', decoded.payload?.authorization?.from);
            console.error('  To:', decoded.payload?.authorization?.to);
            console.error('  Value:', decoded.payload?.authorization?.value);
          } catch (e) {
            console.error('Could not decode sent payment for comparison');
          }
        }
        console.error('═══ END VERIFICATION FAILURE ═══');
      } else {
        console.log('Firecrawl returned 402 Payment Required:', firecrawlResponse.data);
        console.log('Payment requirements:', firecrawlResponse.data.accepts?.[0]);
      }

      // v2 servers put requirements in the PAYMENT-REQUIRED header; v1 in the body
      const paymentRequiredHeader = firecrawlResponse.headers['payment-required'];
      return NextResponse.json(
        firecrawlResponse.data,
        {
          status: 402,
          headers: {
            'Content-Type': 'application/json',
            ...(paymentRequiredHeader ? { 'PAYMENT-REQUIRED': paymentRequiredHeader } : {}),
          }
        }
      );
    } else if (firecrawlResponse.status === 200) {
      // Success - Firecrawl returned the search results
      console.log('Firecrawl returned search results');
      console.log('Response status:', firecrawlResponse.status);
      console.log('Results found:', firecrawlResponse.data?.results?.length || 0);

      // Check for and log PAYMENT-RESPONSE (v2) / X-PAYMENT-RESPONSE (v1) header (transaction confirmation)
      const paymentResponseHeader =
        firecrawlResponse.headers['payment-response'] ?? firecrawlResponse.headers['x-payment-response'];
      if (paymentResponseHeader) {
        console.log('═══ PAYMENT CONFIRMATION ═══');
        console.log('Raw payment response header:', paymentResponseHeader);

        try {
          const decoded = JSON.parse(Buffer.from(paymentResponseHeader, 'base64').toString());
          console.log('Decoded payment response:', JSON.stringify(decoded, null, 2));

          if (decoded.transaction) {
            console.log('✅ Payment transaction hash:', decoded.transaction);
            console.log('View on BaseScan:', `https://basescan.org/tx/${decoded.transaction}`);
          }
        } catch (e) {
          console.error('Could not decode payment response header:', e);
        }

        console.log('═══ END PAYMENT CONFIRMATION ═══');
      } else {
        console.log('Note: No payment response header (payment may not have been required)');
      }

      // Normalize to the Firecrawl { data: { web: [...] } } shape the client reads
      const results: any[] = firecrawlResponse.data?.results || [];
      const response = NextResponse.json({
        success: true,
        data: {
          web: results.map((r) => ({
            title: r.title,
            url: r.url,
            markdown: r.description || r.snippet || '',
          })),
        },
      });

      // Forward the payment receipt to client (PAYMENT-RESPONSE for v2 clients; X-PAYMENT-RESPONSE kept for v1)
      if (paymentResponseHeader) {
        response.headers.set('PAYMENT-RESPONSE', paymentResponseHeader);
        response.headers.set('X-PAYMENT-RESPONSE', paymentResponseHeader);
        response.headers.set('Access-Control-Expose-Headers', 'PAYMENT-RESPONSE, X-PAYMENT-RESPONSE');
      }

      return response;
    } else if (firecrawlResponse.status === 500) {
      // Server error from Firecrawl
      console.error('═══ FIRECRAWL 500 ERROR DETAILS ═══');
      console.error('Status:', firecrawlResponse.status);
      console.error('Status Text:', firecrawlResponse.statusText);
      console.error('Response Data:', firecrawlResponse.data);

      return NextResponse.json(
        {
          error: 'Firecrawl server error',
          message: 'Firecrawl API returned 500 Internal Server Error.',
          status: 500,
          details: firecrawlResponse.data,
        },
        { status: 500 }
      );
    } else {
      // Unexpected response
      console.error('Unexpected response from Firecrawl:', firecrawlResponse.status, firecrawlResponse.data);
      return NextResponse.json(
        { error: 'Unexpected response from Firecrawl', status: firecrawlResponse.status },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Search error:', error);

    if (axios.isAxiosError(error)) {
      const status = error.response?.status || 500;
      const message = error.response?.data?.message || error.message;

      return NextResponse.json(
        {
          error: 'Firecrawl API error',
          message: message,
          status: status
        },
        { status: status }
      );
    }

    return NextResponse.json(
      { error: 'Failed to search', message: 'Unknown error occurred' },
      { status: 500 }
    );
  }
}
