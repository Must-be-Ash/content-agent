import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

export const dynamic = 'force-dynamic';

// Genbase Sora 2 video creation endpoint with x402 payment support
// Follows the same proxy pattern as Firecrawl

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { prompt, model, seconds, size } = body;

    // Validate required fields
    if (!prompt) {
      return NextResponse.json(
        { error: 'Prompt is required' },
        { status: 400 }
      );
    }

    // Check for x402 payment header (v2: PAYMENT-SIGNATURE, v1: X-PAYMENT)
    const paymentHeaderName = request.headers.get('PAYMENT-SIGNATURE') ? 'PAYMENT-SIGNATURE' : 'X-PAYMENT';
    const paymentHeader = request.headers.get(paymentHeaderName);

    // Log the payment header if present (for debugging)
    if (paymentHeader) {
      console.log('[Genbase] Payment header received, forwarding to Genbase');
      console.log(`[Genbase] ${paymentHeaderName} header (first 200 chars):`, paymentHeader.substring(0, 200));

      // Decode and log the payment details
      try {
        const decoded = JSON.parse(Buffer.from(paymentHeader, 'base64').toString());
        console.log('[Genbase] Decoded payment:', JSON.stringify(decoded, null, 2));

        // Payment validation logging
        console.log('[Genbase] ═══ PAYMENT VALIDATION ═══');
        console.log('[Genbase] x402 Version:', decoded.x402Version);
        console.log('[Genbase] Payment Scheme:', decoded.accepted?.scheme ?? decoded.scheme);
        console.log('[Genbase] Network:', decoded.accepted?.network ?? decoded.network);
        console.log('[Genbase] From Address:', decoded.payload?.authorization?.from);
        console.log('[Genbase] To Address (Recipient):', decoded.payload?.authorization?.to);
        console.log('[Genbase] Payment Value:', decoded.payload?.authorization?.value, 'units');
        console.log('[Genbase] Payment Value (USDC):', (parseInt(decoded.payload?.authorization?.value) / 1e6).toFixed(6), 'USDC');
        console.log('[Genbase] Payment Nonce:', decoded.payload?.authorization?.nonce);
        console.log('[Genbase] Valid After:', decoded.payload?.authorization?.validAfter, '(', new Date(parseInt(decoded.payload?.authorization?.validAfter) * 1000).toISOString(), ')');
        console.log('[Genbase] Valid Before:', decoded.payload?.authorization?.validBefore, '(', new Date(parseInt(decoded.payload?.authorization?.validBefore) * 1000).toISOString(), ')');
        console.log('[Genbase] Current Time:', Math.floor(Date.now() / 1000), '(', new Date().toISOString(), ')');
        console.log('[Genbase] Signature:', decoded.payload?.signature);

        // Validate network matches env
        const expectedNetwork = process.env.NEXT_PUBLIC_NETWORK || 'eip155:8453';
        const paidNetwork = decoded.accepted?.network ?? decoded.network;
        if (paidNetwork !== expectedNetwork && decoded.x402Version !== 1) {
          console.warn(`[Genbase] ⚠️  WARNING: Payment network (${paidNetwork}) doesn't match expected network (${expectedNetwork})`);
        }

        const expectedUSDC = process.env.USDC_CONTRACT_ADDRESS;
        console.log('[Genbase] Expected USDC Contract:', expectedUSDC);
        console.log('[Genbase] ═══ END PAYMENT VALIDATION ═══');
      } catch (e) {
        console.log('[Genbase] Could not decode payment header as base64 JSON');
      }
    } else {
      console.log('[Genbase] No payment header, Genbase will return 402');
    }

    // Prepare Genbase headers
    const genbaseHeaders: any = {
      'Content-Type': 'application/json',
    };

    // Forward the payment header (same name the client used) if provided
    if (paymentHeader) {
      genbaseHeaders[paymentHeaderName] = paymentHeader;
    }

    const genbaseEndpoint = process.env.GENBASE_API_URL || 'https://www.genbase.fun';
    const createVideoEndpoint = `${genbaseEndpoint}/api/video/create-sora2`;

    console.log('[Genbase] Calling Genbase Sora 2 video creation endpoint:', createVideoEndpoint);
    console.log('[Genbase] Prompt length:', prompt.length, 'characters');
    console.log('[Genbase] Model:', model || 'sora-2');
    console.log('[Genbase] Duration:', seconds || '10', 'seconds');
    console.log('[Genbase] Size:', size || '1280x720');

    // Build request body matching Genbase's API
    const requestBody = {
      prompt,
      model: model || 'sora-2',
      seconds: seconds || '15',  // Genbase API expects 'seconds' in request
      size: size || '1280x720',
    };

    console.log('[Genbase] Request body:', JSON.stringify(requestBody, null, 2));

    // Call Genbase's x402 video creation endpoint
    let genbaseResponse;
    try {
      genbaseResponse = await axios.post(
        createVideoEndpoint,
        requestBody,
        {
          headers: genbaseHeaders,
          validateStatus: (status) => status === 200 || status === 402 || status === 500,
        }
      );
    } catch (verificationError: any) {
      console.error('[Genbase] ═══ FACILITATOR VERIFICATION ERROR ═══');
      console.error('[Genbase] Failed to verify payment with Genbase facilitator');
      console.error('[Genbase] Error type:', verificationError?.name || typeof verificationError);
      console.error('[Genbase] Error message:', verificationError?.message || String(verificationError));
      console.error('[Genbase] Facilitator URL:', createVideoEndpoint);

      if (verificationError?.code) {
        console.error('[Genbase] Error code:', verificationError.code);
      }

      if (verificationError?.code === 'ECONNABORTED' || verificationError?.message?.includes('timeout')) {
        console.error('[Genbase] ⚠️  This appears to be a timeout error');
      }

      if (verificationError?.stack) {
        console.error('[Genbase] Stack trace:', verificationError.stack);
      }

      console.error('[Genbase] ═══ END FACILITATOR ERROR ═══');

      return NextResponse.json(
        {
          error: 'Facilitator verification failed',
          message: `Payment verification failed: ${verificationError?.message || 'Unknown error'}`,
          errorType: verificationError?.name || 'UnknownError',
          facilitatorUrl: createVideoEndpoint
        },
        { status: 500 }
      );
    }

    // Handle Genbase's response
    if (genbaseResponse.status === 402) {
      // Payment required
      const is_verification_failure = genbaseResponse.data.error &&
                                      genbaseResponse.data.error.toLowerCase().includes('verification');

      if (is_verification_failure) {
        console.error('[Genbase] ═══ PAYMENT VERIFICATION FAILED ═══');
        console.error('[Genbase] Genbase rejected the payment:');
        console.error('[Genbase] Error:', genbaseResponse.data.error);
        console.error('[Genbase] Network:', genbaseResponse.data.accepts?.[0]?.network);
        console.error('[Genbase] Expected asset:', genbaseResponse.data.accepts?.[0]?.asset);
        console.error('[Genbase] Expected recipient:', genbaseResponse.data.accepts?.[0]?.payTo);
        console.error('[Genbase] Max amount:', genbaseResponse.data.accepts?.[0]?.amount ?? genbaseResponse.data.accepts?.[0]?.maxAmountRequired);

        if (paymentHeader) {
          try {
            const decoded = JSON.parse(Buffer.from(paymentHeader, 'base64').toString());
            console.error('[Genbase] Payment we sent:');
            console.error('[Genbase]   Network:', decoded.network);
            console.error('[Genbase]   From:', decoded.payload?.authorization?.from);
            console.error('[Genbase]   To:', decoded.payload?.authorization?.to);
            console.error('[Genbase]   Value:', decoded.payload?.authorization?.value);
          } catch (e) {
            console.error('[Genbase] Could not decode sent payment for comparison');
          }
        }
        console.error('[Genbase] ═══ END VERIFICATION FAILURE ═══');
      } else {
        console.log('[Genbase] Genbase returned 402 Payment Required:', genbaseResponse.data);
        console.log('[Genbase] Payment requirements:', genbaseResponse.data.accepts?.[0]);
      }

      // v2 servers put requirements in the PAYMENT-REQUIRED header; v1 in the body
      const paymentRequiredHeader = genbaseResponse.headers['payment-required'];
      return NextResponse.json(
        genbaseResponse.data,
        {
          status: 402,
          headers: {
            'Content-Type': 'application/json',
            ...(paymentRequiredHeader ? { 'PAYMENT-REQUIRED': paymentRequiredHeader } : {}),
          }
        }
      );
    } else if (genbaseResponse.status === 200) {
      // Success - Genbase returned video task created
      console.log('[Genbase] Genbase returned success');
      console.log('[Genbase] Response status:', genbaseResponse.status);
      console.log('[Genbase] Task created:', genbaseResponse.data?.data?.id || 'N/A');

      // Check for and log PAYMENT-RESPONSE (v2) / X-PAYMENT-RESPONSE (v1) header (transaction confirmation)
      const paymentResponseHeader =
        genbaseResponse.headers['payment-response'] ?? genbaseResponse.headers['x-payment-response'];
      if (paymentResponseHeader) {
        console.log('[Genbase] ═══ PAYMENT CONFIRMATION ═══');
        console.log('[Genbase] Raw payment response header:', paymentResponseHeader);

        try {
          const decoded = JSON.parse(Buffer.from(paymentResponseHeader, 'base64').toString());
          console.log('[Genbase] Decoded payment response:', JSON.stringify(decoded, null, 2));

          if (decoded.transaction) {
            console.log('[Genbase] ✅ Payment transaction hash:', decoded.transaction);
            console.log('[Genbase] View on BaseScan:', `https://basescan.org/tx/${decoded.transaction}`);
          }
        } catch (e) {
          console.error('[Genbase] Could not decode payment response header:', e);
        }

        console.log('[Genbase] ═══ END PAYMENT CONFIRMATION ═══');
      } else {
        console.log('[Genbase] Note: No payment response header (payment may not have been required)');
      }

      const response = NextResponse.json(genbaseResponse.data);

      // Forward the payment receipt to client (PAYMENT-RESPONSE for v2 clients; X-PAYMENT-RESPONSE kept for v1)
      if (paymentResponseHeader) {
        response.headers.set('PAYMENT-RESPONSE', paymentResponseHeader);
        response.headers.set('X-PAYMENT-RESPONSE', paymentResponseHeader);
        response.headers.set('Access-Control-Expose-Headers', 'PAYMENT-RESPONSE, X-PAYMENT-RESPONSE');
      }

      return response;
    } else if (genbaseResponse.status === 500) {
      // Server error from Genbase
      console.error('[Genbase] ═══ GENBASE 500 ERROR DETAILS ═══');
      console.error('[Genbase] Status:', genbaseResponse.status);
      console.error('[Genbase] Status Text:', genbaseResponse.statusText);
      console.error('[Genbase] Response Data:', genbaseResponse.data);

      return NextResponse.json(
        {
          error: 'Genbase server error',
          message: 'Genbase API returned 500 Internal Server Error.',
          status: 500,
          details: genbaseResponse.data,
        },
        { status: 500 }
      );
    } else {
      // Unexpected response
      console.error('[Genbase] Unexpected response from Genbase:', genbaseResponse.status, genbaseResponse.data);
      return NextResponse.json(
        { error: 'Unexpected response from Genbase', status: genbaseResponse.status },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('[Genbase] Video creation error:', error);

    if (axios.isAxiosError(error)) {
      const status = error.response?.status || 500;
      const message = error.response?.data?.message || error.message;

      return NextResponse.json(
        {
          error: 'Genbase API error',
          message: message,
          status: status
        },
        { status: status }
      );
    }

    return NextResponse.json(
      { error: 'Failed to create video', message: 'Unknown error occurred' },
      { status: 500 }
    );
  }
}
