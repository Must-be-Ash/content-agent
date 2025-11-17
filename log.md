   Creating an optimized production build ...
 ✓ Compiled successfully in 3.6s
 ✓ Finished TypeScript in 3.4s    
 ✓ Collecting page data in 1322.1ms    
 ✓ Generating static pages (10/10) in 598.5ms
 ✓ Finalizing page optimization in 9.7ms    

Route (app)
┌ ○ /
├ ○ /_not-found
├ ƒ /.well-known/workflow/v1/flow
├ ƒ /.well-known/workflow/v1/step
├ ƒ /.well-known/workflow/v1/webhook/[token]
├ ƒ /api/content/create
├ ƒ /api/content/status/[runId]
├ ƒ /api/content/stream/[runId]
├ ƒ /api/content/video-poll
├ ƒ /api/genbase/create-video
├ ƒ /api/sora/create
├ ƒ /api/sora/download/[videoId]
├ ƒ /api/sora/status/[videoId]
├ ƒ /api/test-firecrawl
├ ○ /sora
└ ○ /test-firecrawl


○  (Static)   prerendered as static content
ƒ  (Dynamic)  server-rendered on demand

ashnouruzi@C357PRGCH2 content-agent % pnpm dev

> fiverr-docs@0.1.0 dev /Users/ashnouruzi/content-agent
> next dev

Discovering workflow directives 1307ms
Created steps bundle 26ms
Created intermediate workflow bundle 21ms
Creating webhook route
   ▲ Next.js 16.0.1 (Turbopack)
   - Local:        http://localhost:3000
   - Network:      http://192.168.1.91:3000
   - Environments: .env.local, .env

 ✓ Starting...
 ✓ Ready in 2s
Rebuilt steps bundle 60ms
Rebuilt workflow bundle 15ms
 ○ Compiling / ...
 GET / 200 in 3.7s (compile: 3.4s, render: 273ms)
 GET / 200 in 43ms (compile: 13ms, render: 30ms)
Rebuilt steps bundle 50ms
Rebuilt workflow bundle 32ms
Rebuilt steps bundle 32ms
Rebuilt workflow bundle 26ms
No payment header, Firecrawl will return 402
Calling Firecrawl x402 search endpoint: https://api.firecrawl.dev/v2/x402/search
Search query: what's new with x402?
Search options: {
  "query": "what's new with x402?",
  "limit": 10,
  "sources": [
    "web"
  ],
  "scrapeOptions": {
    "onlyMainContent": true
  }
}
(node:99614) [DEP0169] DeprecationWarning: `url.parse()` behavior is not standardized and prone to errors that have security implications. Use the WHATWG URL API instead. CVEs are not issued for `url.parse()` vulnerabilities.
(Use `node --trace-deprecation ...` to show where the warning was created)
Firecrawl returned 402 Payment Required: {
  x402Version: 1,
  error: 'X-PAYMENT header is required',
  accepts: [
    {
      scheme: 'exact',
      network: 'base',
      maxAmountRequired: '10000',
      resource: 'https://api.firecrawl.dev/x402/search',
      description: "The search endpoint combines web search (SERP) with Firecrawl's scraping capabilities to return full page content for any query. Requires micropayment via X402 protocol",
      mimeType: 'application/json',
      payTo: '0xAb4FB7151E7e2B9EC99E9CE1Bc2d5288fBa15F52',
      maxTimeoutSeconds: 120,
      asset: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
      outputSchema: [Object],
      extra: [Object]
    }
  ]
}
Payment requirements: {
  scheme: 'exact',
  network: 'base',
  maxAmountRequired: '10000',
  resource: 'https://api.firecrawl.dev/x402/search',
  description: "The search endpoint combines web search (SERP) with Firecrawl's scraping capabilities to return full page content for any query. Requires micropayment via X402 protocol",
  mimeType: 'application/json',
  payTo: '0xAb4FB7151E7e2B9EC99E9CE1Bc2d5288fBa15F52',
  maxTimeoutSeconds: 120,
  asset: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
  outputSchema: {
    input: {
      type: 'http',
      method: 'POST',
      discoverable: true,
      body: [Object]
    },
    output: { type: 'object', properties: [Object] }
  },
  extra: { name: 'USD Coin', version: '2' }
}
 POST /api/test-firecrawl 402 in 647ms (compile: 293ms, render: 354ms)
Payment header received, forwarding to Firecrawl
X-PAYMENT header (first 200 chars): eyJ4NDAyVmVyc2lvbiI6MSwic2NoZW1lIjoiZXhhY3QiLCJuZXR3b3JrIjoiYmFzZSIsInBheWxvYWQiOnsic2lnbmF0dXJlIjoiMHg5NDE2NTljY2JiODQ0MGQyOTM0NTc2OGI4NTM2YjQ4ZWYzNzBhODYyNTBmY2Y5MzJjM2RiMWJmNjk0ZDMwODU1MTcyZGFkOGUy
Decoded payment: {
  "x402Version": 1,
  "scheme": "exact",
  "network": "base",
  "payload": {
    "signature": "0x941659ccbb8440d29345768b8536b48ef370a86250fcf932c3db1bf694d30855172dad8e24e4cfe298ff18357f6e5a669ee456746137642c367b0842ace2464d1c",
    "authorization": {
      "from": "0x67C8c22E7EDc7Bf25C299E2c3b9aaD4cF2ee6c79",
      "to": "0xAb4FB7151E7e2B9EC99E9CE1Bc2d5288fBa15F52",
      "value": "10000",
      "validAfter": "1763417050",
      "validBefore": "1763417770",
      "nonce": "0xc66598a4a46a41168034f76d6c8e1045ef33adf4dc4250ccf15c3585051f192c"
    }
  }
}
═══ PAYMENT VALIDATION ═══
x402 Version: 1
Payment Scheme: exact
Network: base
From Address: 0x67C8c22E7EDc7Bf25C299E2c3b9aaD4cF2ee6c79
To Address (Recipient): 0xAb4FB7151E7e2B9EC99E9CE1Bc2d5288fBa15F52
Payment Value: 10000 units
Payment Value (USDC): 0.010000 USDC
Payment Nonce: 0xc66598a4a46a41168034f76d6c8e1045ef33adf4dc4250ccf15c3585051f192c
Valid After: 1763417050 ( 2025-11-17T22:04:10.000Z )
Valid Before: 1763417770 ( 2025-11-17T22:16:10.000Z )
Current Time: 1763417651 ( 2025-11-17T22:14:11.562Z )
Signature: 0x941659ccbb8440d29345768b8536b48ef370a86250fcf932c3db1bf694d30855172dad8e24e4cfe298ff18357f6e5a669ee456746137642c367b0842ace2464d1c
Expected USDC Contract: 0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913
═══ END PAYMENT VALIDATION ═══
Calling Firecrawl x402 search endpoint: https://api.firecrawl.dev/v2/x402/search
Search query: what's new with x402?
Search options: {
  "query": "what's new with x402?",
  "limit": 10,
  "sources": [
    "web"
  ],
  "scrapeOptions": {
    "onlyMainContent": true
  }
}
Firecrawl returned search results
Response status: 200
Results found: 10
═══ PAYMENT CONFIRMATION ═══
Raw X-PAYMENT-RESPONSE header: eyJuZXR3b3JrIjoiYmFzZSIsInBheWVyIjoiMHg2N0M4YzIyRTdFRGM3QmYyNUMyOTlFMmMzYjlhYUQ0Y0YyZWU2Yzc5Iiwic3VjY2VzcyI6dHJ1ZSwidHJhbnNhY3Rpb24iOiIweDRhOTUyZmJjMmZkOTQ4NmQ3OGMwMTI2NWIxYmMxNzYzNDc2NDE0ODA1NWY0NGNmY2UxZjE0ZGVlNjYwYzZlMjYifQ==
Decoded payment response: {
  "network": "base",
  "payer": "0x67C8c22E7EDc7Bf25C299E2c3b9aaD4cF2ee6c79",
  "success": true,
  "transaction": "0x4a952fbc2fd9486d78c01265b1bc17634764148055f44cfce1f14dee660c6e26"
}
✅ Payment transaction hash: 0x4a952fbc2fd9486d78c01265b1bc17634764148055f44cfce1f14dee660c6e26
View on BaseScan: https://basescan.org/tx/0x4a952fbc2fd9486d78c01265b1bc17634764148055f44cfce1f14dee660c6e26
═══ END PAYMENT CONFIRMATION ═══
 POST /api/test-firecrawl 200 in 2.6s (compile: 1125µs, render: 2.6s)
[API] Starting content generation workflow
[API] Topic: what's new with x402?
[API] Research length: 1395 characters
[API] Note: x402 payments for Firecrawl and Genbase are handled client-side
[API] Check browser console for payment settlement logs
 POST /api/content/create 200 in 584ms (compile: 568ms, render: 15ms)
[Workflow] Using research from client: 10 sources
 POST /.well-known/workflow/v1/flow 200 in 296ms (compile: 236ms, render: 61ms)
 POST /.well-known/workflow/v1/step 200 in 546ms (compile: 494ms, render: 52ms)
[Workflow] Using research from client: 10 sources
 POST /.well-known/workflow/v1/flow 200 in 33ms (compile: 1726µs, render: 32ms)
 POST /.well-known/workflow/v1/step 200 in 26ms (compile: 1359µs, render: 24ms)
[Workflow] Using research from client: 10 sources
 POST /.well-known/workflow/v1/flow 200 in 24ms (compile: 745µs, render: 24ms)
[Status API] RunID: wrun_01KA9Y41FQE5DSG4W0DG7BPX1Q
[Status API] Status: running
[Status API] Output type: undefined
[Status API] Output: undefined
[Status API] Has result: false
 GET /api/content/status/wrun_01KA9Y41FQE5DSG4W0DG7BPX1Q 200 in 987ms (compile: 978ms, render: 9ms)
 POST /.well-known/workflow/v1/step 200 in 6.3s (compile: 894µs, render: 6.3s)
[Workflow] Using research from client: 10 sources
[Workflow] Script generated: 999 characters
 POST /.well-known/workflow/v1/flow 200 in 22ms (compile: 1096µs, render: 21ms)
 POST /.well-known/workflow/v1/step 200 in 19ms (compile: 716µs, render: 18ms)
[Workflow] Using research from client: 10 sources
[Workflow] Script generated: 999 characters
 POST /.well-known/workflow/v1/flow 200 in 31ms (compile: 1938µs, render: 29ms)
 POST /.well-known/workflow/v1/step 200 in 32ms (compile: 995µs, render: 31ms)
[Workflow] Using research from client: 10 sources
[Workflow] Script generated: 999 characters
 POST /.well-known/workflow/v1/flow 200 in 40ms (compile: 1178µs, render: 39ms)
 GET /api/content/stream/wrun_01KA9Y41FQE5DSG4W0DG7BPX1Q 200 in 7.4s (compile: 982ms, render: 6.4s)
 POST /.well-known/workflow/v1/step 200 in 24ms (compile: 789µs, render: 24ms)
[Workflow] Using research from client: 10 sources
[Workflow] Script generated: 999 characters
 POST /.well-known/workflow/v1/flow 200 in 28ms (compile: 749µs, render: 28ms)
[Status API] RunID: wrun_01KA9Y41FQE5DSG4W0DG7BPX1Q
[Status API] Status: completed
[Status API] Output type: object
[Status API] Output: {
  script: `A person stands casually in their kitchen, speaking directly to the camera with a friendly curiosity. The camera is at eye level, capturing the authentic vibe of a handheld video. They start with, "You guys, I was diving into this thing called x402, and it’s actually fascinating." As they explain, their hands move naturally, pointing and gesturing to emphasize ideas. The camera shifts slightly as they lean against the counter, maintaining that close, selfie-style feel. Their expression shifts from intrigue to excitement as they reveal, "Turns out, it's this Web3 payment protocol that's, like, the brain behind internet payments for AI and machine-to-machine stuff." They pause, thinking, and then continue with enthusiasm, "And get this, it’s seeing a 10,000% surge in activity!" The natural light from a window enhances the laid-back, genuine tone. Throughout, it's just them narrating what they’ve learned, without any screens or devices, making it a personal, engaging moment of discovery.`,
  research: '[1] X402\n' +
    'URL: https://www.x402.org/\n' +
    '\n' +
    '\n' +
    '\n' +
    '---\n' +
    '\n' +
    '[2] x402: A Simple Explanation of the New Web3 Payment Protocol\n' +
    'URL: https://medium.com/@2005akjha/x402-a-simple-explanation-of-the-new-web3-payment-protocol-9f87bfa833e4\n' +
    '\n' +
    '\n' +
    '\n' +
    '---\n' +
    '\n' +
    '[3] x402 Explained in 2.5 Minutes - YouTube\n' +
    'URL: https://www.youtube.com/shorts/tgpVtCdu3tU\n' +
    '\n' +
    '\n' +
    '\n' +
    '---\n' +
    '\n' +
    '[4] Launching the x402 Foundation with Coinbase, and support for ...\n' +
    'URL: https://blog.cloudflare.com/x402/\n' +
    '\n' +
    '\n' +
    '\n' +
    '---\n' +
    '\n' +
    '[5] What is the x402 Payment Protocol? - Quicknode Blog\n' +
    'URL: https://blog.quicknode.com/x402-protocol-explained-inside-the-https-native-payment-layer/\n' +
    '\n' +
    '\n' +
    '\n' +
    '---\n' +
    '\n' +
    '[6] The New World of Machine-to-Machine Payments\n' +
    'URL: https://www.atlantafed.org/blogs/take-on-payments/2025/10/20/new-world-of-machine-to-machine-payments\n' +
    '\n' +
    '\n' +
    '\n' +
    '---\n' +
    '\n' +
    '[7] Deep Dive: Is x402 Payments Protocol the Stripe for AI Agents?\n' +
    'URL: https://www.fintechwrapup.com/p/deep-dive-is-x402-payments-protocol\n' +
    '\n' +
    '\n' +
    '\n' +
    '---\n' +
    '\n' +
    '[8] How the New x402 Internet Payment Protocol Could Change the ...\n' +
    'URL: https://incrypted.com/en/new-x402-internet-payment-protocol/\n' +
    '\n' +
    '\n' +
    '\n' +
    '---\n' +
    '\n' +
    "[9] Coinbase's x402 AI Payments Protocol Sees 10,000% Surge in Activity\n" +
    'URL: https://finance.yahoo.com/news/coinbase-x402-ai-payments-protocol-130700006.html\n' +
    '\n' +
    '\n' +
    '\n' +
    '---\n' +
    '\n' +
    '[10] How x402 and Dynamic Enable Internet-Native Payments for AI and ...\n' +
    'URL: https://www.dynamic.xyz/blog/how-x402-and-dynamic-enable-internet-native-payments-for-ai-and-apis\n' +
    '\n',
  searchResultsCount: 10
}
[Status API] Has result: true
 GET /api/content/status/wrun_01KA9Y41FQE5DSG4W0DG7BPX1Q 200 in 8ms (compile: 3ms, render: 5ms)
[Genbase] No payment header, Genbase will return 402
[Genbase] Calling Genbase Sora 2 video creation endpoint: https://www.genbase.fun/api/video/create-sora2
[Genbase] Prompt length: 999 characters
[Genbase] Model: sora-2
[Genbase] Duration: 15 seconds
[Genbase] Size: 1280x720
[Genbase] Request body: {
  "prompt": "A person stands casually in their kitchen, speaking directly to the camera with a friendly curiosity. The camera is at eye level, capturing the authentic vibe of a handheld video. They start with, \"You guys, I was diving into this thing called x402, and it’s actually fascinating.\" As they explain, their hands move naturally, pointing and gesturing to emphasize ideas. The camera shifts slightly as they lean against the counter, maintaining that close, selfie-style feel. Their expression shifts from intrigue to excitement as they reveal, \"Turns out, it's this Web3 payment protocol that's, like, the brain behind internet payments for AI and machine-to-machine stuff.\" They pause, thinking, and then continue with enthusiasm, \"And get this, it’s seeing a 10,000% surge in activity!\" The natural light from a window enhances the laid-back, genuine tone. Throughout, it's just them narrating what they’ve learned, without any screens or devices, making it a personal, engaging moment of discovery.",
  "model": "sora-2",
  "seconds": "15",
  "size": "1280x720"
}
[Genbase] Genbase returned 402 Payment Required: {
  x402Version: 1,
  error: 'X-PAYMENT header is required',
  accepts: [
    {
      scheme: 'exact',
      network: 'base',
      maxAmountRequired: '200000',
      resource: 'https://www.genbase.fun/api/video/create-sora2',
      description: 'Create video using Sora 2 AI model',
      mimeType: 'application/json',
      payTo: '0xF338bDD9ec443335B1c33aD3bb21A421A36f97eA',
      maxTimeoutSeconds: 300,
      asset: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
      outputSchema: [Object],
      extra: [Object]
    }
  ]
}
[Genbase] Payment requirements: {
  scheme: 'exact',
  network: 'base',
  maxAmountRequired: '200000',
  resource: 'https://www.genbase.fun/api/video/create-sora2',
  description: 'Create video using Sora 2 AI model',
  mimeType: 'application/json',
  payTo: '0xF338bDD9ec443335B1c33aD3bb21A421A36f97eA',
  maxTimeoutSeconds: 300,
  asset: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
  outputSchema: { input: { type: 'http', method: 'POST', discoverable: true } },
  extra: { name: 'USD Coin', version: '2' }
}
 POST /api/genbase/create-video 402 in 360ms (compile: 83ms, render: 277ms)
[Genbase] Payment header received, forwarding to Genbase
[Genbase] X-PAYMENT header (first 200 chars): eyJ4NDAyVmVyc2lvbiI6MSwic2NoZW1lIjoiZXhhY3QiLCJuZXR3b3JrIjoiYmFzZSIsInBheWxvYWQiOnsic2lnbmF0dXJlIjoiMHg2YjkyZTFhY2FjZmZmZDk4NWE0ZGQ1ZTk2NGZiZWVmMmJlZjdlM2I4YWEyODRjYjBjNzAyYjIwZWNkNTRiYzkyMDE1NjdhZTJm
[Genbase] Decoded payment: {
  "x402Version": 1,
  "scheme": "exact",
  "network": "base",
  "payload": {
    "signature": "0x6b92e1acacfffd985a4dd5e964fbeef2bef7e3b8aa284cb0c702b20ecd54bc9201567ae2f0e3af2b6c1497d9223a0a78167c444d1a452b2be393e37b029fdc201c",
    "authorization": {
      "from": "0x67C8c22E7EDc7Bf25C299E2c3b9aaD4cF2ee6c79",
      "to": "0xF338bDD9ec443335B1c33aD3bb21A421A36f97eA",
      "value": "200000",
      "validAfter": "1763417076",
      "validBefore": "1763417976",
      "nonce": "0x152a9dad8d6ef32ce27f679c020b13f1596bae963e4a8696f719271003691f7c"
    }
  }
}
[Genbase] ═══ PAYMENT VALIDATION ═══
[Genbase] x402 Version: 1
[Genbase] Payment Scheme: exact
[Genbase] Network: base
[Genbase] From Address: 0x67C8c22E7EDc7Bf25C299E2c3b9aaD4cF2ee6c79
[Genbase] To Address (Recipient): 0xF338bDD9ec443335B1c33aD3bb21A421A36f97eA
[Genbase] Payment Value: 200000 units
[Genbase] Payment Value (USDC): 0.200000 USDC
[Genbase] Payment Nonce: 0x152a9dad8d6ef32ce27f679c020b13f1596bae963e4a8696f719271003691f7c
[Genbase] Valid After: 1763417076 ( 2025-11-17T22:04:36.000Z )
[Genbase] Valid Before: 1763417976 ( 2025-11-17T22:19:36.000Z )
[Genbase] Current Time: 1763417676 ( 2025-11-17T22:14:36.681Z )
[Genbase] Signature: 0x6b92e1acacfffd985a4dd5e964fbeef2bef7e3b8aa284cb0c702b20ecd54bc9201567ae2f0e3af2b6c1497d9223a0a78167c444d1a452b2be393e37b029fdc201c
[Genbase] Expected USDC Contract: 0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913
[Genbase] ═══ END PAYMENT VALIDATION ═══
[Genbase] Calling Genbase Sora 2 video creation endpoint: https://www.genbase.fun/api/video/create-sora2
[Genbase] Prompt length: 999 characters
[Genbase] Model: sora-2
[Genbase] Duration: 15 seconds
[Genbase] Size: 1280x720
[Genbase] Request body: {
  "prompt": "A person stands casually in their kitchen, speaking directly to the camera with a friendly curiosity. The camera is at eye level, capturing the authentic vibe of a handheld video. They start with, \"You guys, I was diving into this thing called x402, and it’s actually fascinating.\" As they explain, their hands move naturally, pointing and gesturing to emphasize ideas. The camera shifts slightly as they lean against the counter, maintaining that close, selfie-style feel. Their expression shifts from intrigue to excitement as they reveal, \"Turns out, it's this Web3 payment protocol that's, like, the brain behind internet payments for AI and machine-to-machine stuff.\" They pause, thinking, and then continue with enthusiasm, \"And get this, it’s seeing a 10,000% surge in activity!\" The natural light from a window enhances the laid-back, genuine tone. Throughout, it's just them narrating what they’ve learned, without any screens or devices, making it a personal, engaging moment of discovery.",
  "model": "sora-2",
  "seconds": "15",
  "size": "1280x720"
}
[Genbase] Genbase returned success
[Genbase] Response status: 200
[Genbase] Task created: sora-2:task_01ka9y59j0f6r9hjqa94fxx05d
[Genbase] ═══ PAYMENT CONFIRMATION ═══
[Genbase] Raw X-PAYMENT-RESPONSE header: eyJzdWNjZXNzIjp0cnVlLCJ0cmFuc2FjdGlvbiI6IjB4NWZlOGZlNDUyN2JhNDM5ODI5YzZmMDRiODI2YzhkZDZhNDNjYmM1YjQ2NTYzYmY5ZDJjZDk0MWU4YzYxNjRlYyIsIm5ldHdvcmsiOiJiYXNlIiwicGF5ZXIiOiIweDY3QzhjMjJFN0VEYzdCZjI1QzI5OUUyYzNiOWFhRDRjRjJlZTZjNzkifQ==
[Genbase] Decoded payment response: {
  "success": true,
  "transaction": "0x5fe8fe4527ba439829c6f04b826c8dd6a43cbc5b46563bf9d2cd941e8c6164ec",
  "network": "base",
  "payer": "0x67C8c22E7EDc7Bf25C299E2c3b9aaD4cF2ee6c79"
}
[Genbase] ✅ Payment transaction hash: 0x5fe8fe4527ba439829c6f04b826c8dd6a43cbc5b46563bf9d2cd941e8c6164ec
[Genbase] View on BaseScan: https://basescan.org/tx/0x5fe8fe4527ba439829c6f04b826c8dd6a43cbc5b46563bf9d2cd941e8c6164ec
[Genbase] ═══ END PAYMENT CONFIRMATION ═══
 POST /api/genbase/create-video 200 in 20.2s (compile: 1653µs, render: 20.2s)
[API] Starting video poll workflow
[API] Task ID: sora-2:task_01ka9y59j0f6r9hjqa94fxx05d
[API] Script length: 999 characters
 POST /api/content/video-poll 200 in 93ms (compile: 87ms, render: 6ms)
[Status API] RunID: wrun_01KA9Y5ANC886T1F111F8JB841
[Status API] Status: pending
[Status API] Output type: undefined
[Status API] Output: undefined
[Status API] Has result: false
 GET /api/content/status/wrun_01KA9Y5ANC886T1F111F8JB841 200 in 7ms (compile: 3ms, render: 4ms)
[VideoPoll Workflow] Starting video polling for task: sora-2:task_01ka9y59j0f6r9hjqa94fxx05d
 POST /.well-known/workflow/v1/flow 200 in 37ms (compile: 881µs, render: 36ms)
 POST /.well-known/workflow/v1/step 200 in 27ms (compile: 2ms, render: 25ms)
[VideoPoll Workflow] Starting video polling for task: sora-2:task_01ka9y59j0f6r9hjqa94fxx05d
[VideoPoll Workflow] Polling attempt 1/8
 POST /.well-known/workflow/v1/flow 200 in 24ms (compile: 1079µs, render: 22ms)
 POST /.well-known/workflow/v1/step 200 in 453ms (compile: 889µs, render: 452ms)
[VideoPoll Workflow] Starting video polling for task: sora-2:task_01ka9y59j0f6r9hjqa94fxx05d
[VideoPoll Workflow] Polling attempt 1/8
[VideoPoll Workflow] Status: pending
 POST /.well-known/workflow/v1/flow 200 in 27ms (compile: 1092µs, render: 26ms)
 POST /.well-known/workflow/v1/step 200 in 38ms (compile: 3ms, render: 35ms)
[VideoPoll Workflow] Starting video polling for task: sora-2:task_01ka9y59j0f6r9hjqa94fxx05d
[VideoPoll Workflow] Polling attempt 1/8
[VideoPoll Workflow] Status: pending
 POST /.well-known/workflow/v1/flow 503 in 26ms (compile: 1073µs, render: 25ms)
