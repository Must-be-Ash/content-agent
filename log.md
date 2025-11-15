[Genbase] ═══ PAYMENT VALIDATION ═══
[Genbase] x402 Version: 1
[Genbase] Payment Scheme: exact
[Genbase] Network: base
[Genbase] From Address: 0x67C8c22E7EDc7Bf25C299E2c3b9aaD4cF2ee6c79
[Genbase] To Address (Recipient): 0xF338bDD9ec443335B1c33aD3bb21A421A36f97eA
[Genbase] Payment Value: 200000 units
[Genbase] Payment Value (USDC): 0.200000 USDC
[Genbase] Payment Nonce: 0x4c6679a2391a6ed2593d70a98d6346159f67458c03fb19fa365881321ab794fb
[Genbase] Valid After: 1763174281 ( 2025-11-15T02:38:01.000Z )
[Genbase] Valid Before: 1763175181 ( 2025-11-15T02:53:01.000Z )
[Genbase] Current Time: 1763174881 ( 2025-11-15T02:48:01.815Z )
[Genbase] Signature: 0xe7db9d3b7544fb1b9251585d2574128b13254bd1acfb5a83c0e9d891393154d00ca73d40fc90a0e103109eeaa4e8543746476c5e4ecba2c0e362d1352c1fabe91c
[Genbase] Expected USDC Contract: 0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913
[Genbase] ═══ END PAYMENT VALIDATION ═══
[Genbase] Calling Genbase Sora 2 video creation endpoint: https://genbase.fun/api/video/create-sora2
[Genbase] Prompt length: 350 characters
[Genbase] Model: sora-2
[Genbase] Duration: 10 seconds
[Genbase] Size: 1280x720
[Genbase] Request body: {
  "prompt": "\"A futuristic cityscape comes alive as the x402 logo pulses on a digital billboard. Zoom into AI agents interacting, powered by the x402 protocol. Glowing pathways show seamless USDC transfers between devices. Then, pivot to users effortlessly making private online purchases, ending on a dynamic network map that highlights x402's innovative reach.\"",
  "model": "sora-2",
  "seconds": "10",
  "size": "1280x720"
}
[Genbase] Genbase returned success
[Genbase] Response status: 200
[Genbase] Task created: sora-2:task_01ka2pkbvaf67vtnc7v92hqtvc
[Genbase] ═══ PAYMENT CONFIRMATION ═══
[Genbase] Raw X-PAYMENT-RESPONSE header: eyJzdWNjZXNzIjp0cnVlLCJ0cmFuc2FjdGlvbiI6IjB4YjRiYjAzN2UzMTI4ZDQwMjM2ZjY2NmIyM2I5NzcyMTFkMGYzZDRlM2UwZGMzZGFmNWI0YzA0YzRlMTU2MzBkNCIsIm5ldHdvcmsiOiJiYXNlIiwicGF5ZXIiOiIweDY3QzhjMjJFN0VEYzdCZjI1QzI5OUUyYzNiOWFhRDRjRjJlZTZjNzkifQ==
[Genbase] Decoded payment response: {
  "success": true,
  "transaction": "0xb4bb037e3128d40236f666b23b977211d0f3d4e3e0dc3daf5b4c04c4e15630d4",
  "network": "base",
  "payer": "0x67C8c22E7EDc7Bf25C299E2c3b9aaD4cF2ee6c79"
}
[Genbase] ✅ Payment transaction hash: 0xb4bb037e3128d40236f666b23b977211d0f3d4e3e0dc3daf5b4c04c4e15630d4
[Genbase] View on BaseScan: https://basescan.org/tx/0xb4bb037e3128d40236f666b23b977211d0f3d4e3e0dc3daf5b4c04c4e15630d4
[Genbase] ═══ END PAYMENT CONFIRMATION ═══
 POST /api/genbase/create-video 200 in 6.1s (compile: 1276µs, render: 6.1s)
[API] Starting video poll workflow
[API] Task ID: sora-2:task_01ka2pkbvaf67vtnc7v92hqtvc
[API] Script length: 350 characters
 POST /api/content/video-poll 200 in 92ms (compile: 86ms, render: 6ms)
[Status API] RunID: wrun_01KA2PKCGZWBXAR94NGXDVWR7E
[Status API] Status: pending
[Status API] Output type: undefined
[Status API] Output: undefined
[Status API] Has result: false
 GET /api/content/status/wrun_01KA2PKCGZWBXAR94NGXDVWR7E 200 in 11ms (compile: 3ms, render: 7ms)
[VideoPoll Workflow] Starting video polling for task: sora-2:task_01ka2pkbvaf67vtnc7v92hqtvc
 POST /.well-known/workflow/v1/flow 200 in 38ms (compile: 1682µs, render: 36ms)
 POST /.well-known/workflow/v1/step 200 in 44ms (compile: 3ms, render: 41ms)
[VideoPoll Workflow] Starting video polling for task: sora-2:task_01ka2pkbvaf67vtnc7v92hqtvc
[VideoPoll Workflow] Polling attempt 1/30
 POST /.well-known/workflow/v1/flow 200 in 26ms (compile: 1651µs, render: 25ms)
 POST /.well-known/workflow/v1/step 200 in 596ms (compile: 787µs, render: 596ms)
[VideoPoll Workflow] Starting video polling for task: sora-2:task_01ka2pkbvaf67vtnc7v92hqtvc
[VideoPoll Workflow] Polling attempt 1/30
[VideoPoll Workflow] Status: pending
 POST /.well-known/workflow/v1/flow 200 in 24ms (compile: 1169µs, render: 23ms)
 POST /.well-known/workflow/v1/step 200 in 22ms (compile: 1226µs, render: 21ms)
[VideoPoll Workflow] Starting video polling for task: sora-2:task_01ka2pkbvaf67vtnc7v92hqtvc
[VideoPoll Workflow] Polling attempt 1/30
[VideoPoll Workflow] Status: pending
 POST /.well-known/workflow/v1/flow 503 in 48ms (compile: 964µs, render: 47ms)
[Status API] RunID: wrun_01KA2PKCGZWBXAR94NGXDVWR7E
[Status API] Status: running
[Status API] Output type: undefined
[Status API] Output: undefined
[Status API] Has result: false
 GET /api/content/status/wrun_01KA2PKCGZWBXAR94NGXDVWR7E 200 in 5ms (compile: 2ms, render: 2ms)
[Status API] RunID: wrun_01KA2PKCGZWBXAR94NGXDVWR7E
[Status API] Status: running
[Status API] Output type: undefined
[Status API] Output: undefined
[Status API] Has result: false
 GET /api/content/status/wrun_01KA2PKCGZWBXAR94NGXDVWR7E 200 in 8ms (compile: 3ms, render: 4ms)
[Status API] RunID: wrun_01KA2PKCGZWBXAR94NGXDVWR7E
[Status API] Status: running
[Status API] Output type: undefined
[Status API] Output: undefined
[Status API] Has result: false
 GET /api/content/status/wrun_01KA2PKCGZWBXAR94NGXDVWR7E 200 in 7ms (compile: 3ms, render: 4ms)
[Status API] RunID: wrun_01KA2PKCGZWBXAR94NGXDVWR7E
[Status API] Status: running
[Status API] Output type: undefined
[Status API] Output: undefined
[Status API] Has result: false
 GET /api/content/status/wrun_01KA2PKCGZWBXAR94NGXDVWR7E 200 in 6ms (compile: 3ms, render: 4ms)
[Status API] RunID: wrun_01KA2PKCGZWBXAR94NGXDVWR7E
[Status API] Status: running
[Status API] Output type: undefined
[Status API] Output: undefined
[Status API] Has result: false
 GET /api/content/status/wrun_01KA2PKCGZWBXAR94NGXDVWR7E 200 in 6ms (compile: 3ms, render: 3ms)
[Status API] RunID: wrun_01KA2PKCGZWBXAR94NGXDVWR7E
[Status API] Status: running
[Status API] Output type: undefined
[Status API] Output: undefined
[Status API] Has result: false
 GET /api/content/status/wrun_01KA2PKCGZWBXAR94NGXDVWR7E 200 in 6ms (compile: 2ms, render: 3ms)
[Status API] RunID: wrun_01KA2PKCGZWBXAR94NGXDVWR7E
[Status API] Status: running
[Status API] Output type: undefined
[Status API] Output: undefined
[Status API] Has result: false
 GET /api/content/status/wrun_01KA2PKCGZWBXAR94NGXDVWR7E 200 in 6ms (compile: 2ms, render: 3ms)
[Status API] RunID: wrun_01KA2PKCGZWBXAR94NGXDVWR7E
[Status API] Status: running
[Status API] Output type: undefined
[Status API] Output: undefined
[Status API] Has result: false
 GET /api/content/status/wrun_01KA2PKCGZWBXAR94NGXDVWR7E 200 in 6ms (compile: 2ms, render: 3ms)
[Status API] RunID: wrun_01KA2PKCGZWBXAR94NGXDVWR7E
[Status API] Status: running
[Status API] Output type: undefined
[Status API] Output: undefined
[Status API] Has result: false
 GET /api/content/status/wrun_01KA2PKCGZWBXAR94NGXDVWR7E 200 in 6ms (compile: 2ms, render: 4ms)
[Status API] RunID: wrun_01KA2PKCGZWBXAR94NGXDVWR7E
[Status API] Status: running
[Status API] Output type: undefined
[Status API] Output: undefined
[Status API] Has result: false
 GET /api/content/status/wrun_01KA2PKCGZWBXAR94NGXDVWR7E 200 in 8ms (compile: 4ms, render: 5ms)
[Status API] RunID: wrun_01KA2PKCGZWBXAR94NGXDVWR7E
[Status API] Status: running
[Status API] Output type: undefined
[Status API] Output: undefined
[Status API] Has result: false
 GET /api/content/status/wrun_01KA2PKCGZWBXAR94NGXDVWR7E 200 in 6ms (compile: 2ms, render: 4ms)
[Status API] RunID: wrun_01KA2PKCGZWBXAR94NGXDVWR7E
[Status API] Status: running
[Status API] Output type: undefined
[Status API] Output: undefined
[Status API] Has result: false
 GET /api/content/status/wrun_01KA2PKCGZWBXAR94NGXDVWR7E 200 in 31ms (compile: 4ms, render: 27ms)
[VideoPoll Workflow] Starting video polling for task: sora-2:task_01ka2pkbvaf67vtnc7v92hqtvc
[VideoPoll Workflow] Polling attempt 1/30
[VideoPoll Workflow] Status: pending
[VideoPoll Workflow] Polling attempt 2/30
 POST /.well-known/workflow/v1/flow 200 in 32ms (compile: 1994µs, render: 30ms)
 POST /.well-known/workflow/v1/step 200 in 688ms (compile: 1145µs, render: 687ms)
[VideoPoll Workflow] Starting video polling for task: sora-2:task_01ka2pkbvaf67vtnc7v92hqtvc
[VideoPoll Workflow] Polling attempt 1/30
[VideoPoll Workflow] Status: pending
[VideoPoll Workflow] Polling attempt 2/30
[VideoPoll Workflow] Status: pending
 POST /.well-known/workflow/v1/flow 200 in 47ms (compile: 913µs, render: 46ms)
 POST /.well-known/workflow/v1/step 200 in 31ms (compile: 1409µs, render: 30ms)
[VideoPoll Workflow] Starting video polling for task: sora-2:task_01ka2pkbvaf67vtnc7v92hqtvc
[VideoPoll Workflow] Polling attempt 1/30
[VideoPoll Workflow] Status: pending
[VideoPoll Workflow] Polling attempt 2/30
[VideoPoll Workflow] Status: pending
 POST /.well-known/workflow/v1/flow 503 in 32ms (compile: 919µs, render: 31ms)
[Status API] RunID: wrun_01KA2PKCGZWBXAR94NGXDVWR7E
[Status API] Status: running
[Status API] Output type: undefined
[Status API] Output: undefined
[Status API] Has result: false
 GET /api/content/status/wrun_01KA2PKCGZWBXAR94NGXDVWR7E 200 in 5ms (compile: 2ms, render: 2ms)
[Status API] RunID: wrun_01KA2PKCGZWBXAR94NGXDVWR7E
[Status API] Status: running
[Status API] Output type: undefined
[Status API] Output: undefined
[Status API] Has result: false
 GET /api/content/status/wrun_01KA2PKCGZWBXAR94NGXDVWR7E 200 in 6ms (compile: 2ms, render: 4ms)
[Status API] RunID: wrun_01KA2PKCGZWBXAR94NGXDVWR7E
[Status API] Status: running
[Status API] Output type: undefined
[Status API] Output: undefined
[Status API] Has result: false
 GET /api/content/status/wrun_01KA2PKCGZWBXAR94NGXDVWR7E 200 in 7ms (compile: 3ms, render: 4ms)
[Status API] RunID: wrun_01KA2PKCGZWBXAR94NGXDVWR7E
[Status API] Status: running
[Status API] Output type: undefined
[Status API] Output: undefined
[Status API] Has result: false
 GET /api/content/status/wrun_01KA2PKCGZWBXAR94NGXDVWR7E 200 in 8ms (compile: 3ms, render: 5ms)
[Status API] RunID: wrun_01KA2PKCGZWBXAR94NGXDVWR7E
[Status API] Status: running
[Status API] Output type: undefined
[Status API] Output: undefined
[Status API] Has result: false
 GET /api/content/status/wrun_01KA2PKCGZWBXAR94NGXDVWR7E 200 in 9ms (compile: 3ms, render: 6ms)
[Status API] RunID: wrun_01KA2PKCGZWBXAR94NGXDVWR7E
[Status API] Status: running
[Status API] Output type: undefined
[Status API] Output: undefined
[Status API] Has result: false
 GET /api/content/status/wrun_01KA2PKCGZWBXAR94NGXDVWR7E 200 in 6ms (compile: 2ms, render: 4ms)
[Status API] RunID: wrun_01KA2PKCGZWBXAR94NGXDVWR7E
[Status API] Status: running
[Status API] Output type: undefined
[Status API] Output: undefined
[Status API] Has result: false
 GET /api/content/status/wrun_01KA2PKCGZWBXAR94NGXDVWR7E 200 in 6ms (compile: 2ms, render: 4ms)
[Status API] RunID: wrun_01KA2PKCGZWBXAR94NGXDVWR7E
[Status API] Status: running
[Status API] Output type: undefined
[Status API] Output: undefined
[Status API] Has result: false
 GET /api/content/status/wrun_01KA2PKCGZWBXAR94NGXDVWR7E 200 in 6ms (compile: 2ms, render: 4ms)
[Status API] RunID: wrun_01KA2PKCGZWBXAR94NGXDVWR7E
[Status API] Status: running
[Status API] Output type: undefined
[Status API] Output: undefined
[Status API] Has result: false
 GET /api/content/status/wrun_01KA2PKCGZWBXAR94NGXDVWR7E 200 in 7ms (compile: 3ms, render: 4ms)
[Status API] RunID: wrun_01KA2PKCGZWBXAR94NGXDVWR7E
[Status API] Status: running
[Status API] Output type: undefined
[Status API] Output: undefined
[Status API] Has result: false
 GET /api/content/status/wrun_01KA2PKCGZWBXAR94NGXDVWR7E 200 in 6ms (compile: 3ms, render: 4ms)
[VideoPoll Workflow] Starting video polling for task: sora-2:task_01ka2pkbvaf67vtnc7v92hqtvc
[VideoPoll Workflow] Polling attempt 1/30
[VideoPoll Workflow] Status: pending
[VideoPoll Workflow] Polling attempt 2/30
[VideoPoll Workflow] Status: pending
[VideoPoll Workflow] Polling attempt 3/30
 POST /.well-known/workflow/v1/flow 200 in 51ms (compile: 1186µs, render: 50ms)
 POST /.well-known/workflow/v1/step 200 in 948ms (compile: 1537µs, render: 946ms)
[VideoPoll Workflow] Starting video polling for task: sora-2:task_01ka2pkbvaf67vtnc7v92hqtvc
[VideoPoll Workflow] Polling attempt 1/30
[VideoPoll Workflow] Status: pending
[VideoPoll Workflow] Polling attempt 2/30
[VideoPoll Workflow] Status: pending
[VideoPoll Workflow] Polling attempt 3/30
[VideoPoll Workflow] Status: running
 POST /.well-known/workflow/v1/flow 200 in 41ms (compile: 792µs, render: 40ms)
 POST /.well-known/workflow/v1/step 200 in 18ms (compile: 728µs, render: 17ms)
[VideoPoll Workflow] Starting video polling for task: sora-2:task_01ka2pkbvaf67vtnc7v92hqtvc
[VideoPoll Workflow] Polling attempt 1/30
[VideoPoll Workflow] Status: pending
[VideoPoll Workflow] Polling attempt 2/30
[VideoPoll Workflow] Status: pending
[VideoPoll Workflow] Polling attempt 3/30
[VideoPoll Workflow] Status: running
 POST /.well-known/workflow/v1/flow 503 in 40ms (compile: 746µs, render: 39ms)
[Status API] RunID: wrun_01KA2PKCGZWBXAR94NGXDVWR7E
[Status API] Status: running
[Status API] Output type: undefined
[Status API] Output: undefined
[Status API] Has result: false
 GET /api/content/status/wrun_01KA2PKCGZWBXAR94NGXDVWR7E 200 in 5ms (compile: 2ms, render: 3ms)
[Status API] RunID: wrun_01KA2PKCGZWBXAR94NGXDVWR7E
[Status API] Status: running
[Status API] Output type: undefined
[Status API] Output: undefined
[Status API] Has result: false
 GET /api/content/status/wrun_01KA2PKCGZWBXAR94NGXDVWR7E 200 in 5ms (compile: 2ms, render: 3ms)
[Status API] RunID: wrun_01KA2PKCGZWBXAR94NGXDVWR7E
[Status API] Status: running
[Status API] Output type: undefined
[Status API] Output: undefined
[Status API] Has result: false
 GET /api/content/status/wrun_01KA2PKCGZWBXAR94NGXDVWR7E 200 in 6ms (compile: 2ms, render: 4ms)
[Status API] RunID: wrun_01KA2PKCGZWBXAR94NGXDVWR7E
[Status API] Status: running
[Status API] Output type: undefined
[Status API] Output: undefined
[Status API] Has result: false
 GET /api/content/status/wrun_01KA2PKCGZWBXAR94NGXDVWR7E 200 in 8ms (compile: 3ms, render: 5ms)
[Status API] RunID: wrun_01KA2PKCGZWBXAR94NGXDVWR7E
[Status API] Status: running
[Status API] Output type: undefined
[Status API] Output: undefined
[Status API] Has result: false
 GET /api/content/status/wrun_01KA2PKCGZWBXAR94NGXDVWR7E 200 in 7ms (compile: 3ms, render: 4ms)
[Status API] RunID: wrun_01KA2PKCGZWBXAR94NGXDVWR7E
[Status API] Status: running
[Status API] Output type: undefined
[Status API] Output: undefined
[Status API] Has result: false
 GET /api/content/status/wrun_01KA2PKCGZWBXAR94NGXDVWR7E 200 in 7ms (compile: 3ms, render: 4ms)
[Status API] RunID: wrun_01KA2PKCGZWBXAR94NGXDVWR7E
[Status API] Status: running
[Status API] Output type: undefined
[Status API] Output: undefined
[Status API] Has result: false
 GET /api/content/status/wrun_01KA2PKCGZWBXAR94NGXDVWR7E 200 in 6ms (compile: 2ms, render: 4ms)
[Status API] RunID: wrun_01KA2PKCGZWBXAR94NGXDVWR7E
[Status API] Status: running
[Status API] Output type: undefined
[Status API] Output: undefined
[Status API] Has result: false
 GET /api/content/status/wrun_01KA2PKCGZWBXAR94NGXDVWR7E 200 in 7ms (compile: 3ms, render: 5ms)
[Status API] RunID: wrun_01KA2PKCGZWBXAR94NGXDVWR7E
[Status API] Status: running
[Status API] Output type: undefined
[Status API] Output: undefined
[Status API] Has result: false
 GET /api/content/status/wrun_01KA2PKCGZWBXAR94NGXDVWR7E 200 in 5ms (compile: 1944µs, render: 3ms)
[Status API] RunID: wrun_01KA2PKCGZWBXAR94NGXDVWR7E
[Status API] Status: running
[Status API] Output type: undefined
[Status API] Output: undefined
[Status API] Has result: false
 GET /api/content/status/wrun_01KA2PKCGZWBXAR94NGXDVWR7E 200 in 6ms (compile: 3ms, render: 4ms)
[Status API] RunID: wrun_01KA2PKCGZWBXAR94NGXDVWR7E
[Status API] Status: running
[Status API] Output type: undefined
[Status API] Output: undefined
[Status API] Has result: false
 GET /api/content/status/wrun_01KA2PKCGZWBXAR94NGXDVWR7E 200 in 6ms (compile: 2ms, render: 4ms)
[Status API] RunID: wrun_01KA2PKCGZWBXAR94NGXDVWR7E
[Status API] Status: running
[Status API] Output type: undefined
[Status API] Output: undefined
[Status API] Has result: false
 GET /api/content/status/wrun_01KA2PKCGZWBXAR94NGXDVWR7E 200 in 6ms (compile: 2ms, render: 4ms)
[VideoPoll Workflow] Starting video polling for task: sora-2:task_01ka2pkbvaf67vtnc7v92hqtvc
[VideoPoll Workflow] Polling attempt 1/30
[VideoPoll Workflow] Status: pending
[VideoPoll Workflow] Polling attempt 2/30
[VideoPoll Workflow] Status: pending
[VideoPoll Workflow] Polling attempt 3/30
[VideoPoll Workflow] Status: running
[VideoPoll Workflow] Polling attempt 4/30
 POST /.well-known/workflow/v1/flow 200 in 43ms (compile: 1696µs, render: 41ms)
 POST /.well-known/workflow/v1/step 200 in 652ms (compile: 1392µs, render: 651ms)
[VideoPoll Workflow] Starting video polling for task: sora-2:task_01ka2pkbvaf67vtnc7v92hqtvc
[VideoPoll Workflow] Polling attempt 1/30
[VideoPoll Workflow] Status: pending
[VideoPoll Workflow] Polling attempt 2/30
[VideoPoll Workflow] Status: pending
[VideoPoll Workflow] Polling attempt 3/30
[VideoPoll Workflow] Status: running
[VideoPoll Workflow] Polling attempt 4/30
[VideoPoll Workflow] Status: running
 POST /.well-known/workflow/v1/flow 200 in 37ms (compile: 915µs, render: 36ms)
 POST /.well-known/workflow/v1/step 200 in 54ms (compile: 1207µs, render: 53ms)
[Status API] RunID: wrun_01KA2PKCGZWBXAR94NGXDVWR7E
[Status API] Status: running
[Status API] Output type: undefined
[Status API] Output: undefined
[Status API] Has result: false
 GET /api/content/status/wrun_01KA2PKCGZWBXAR94NGXDVWR7E 200 in 5ms (compile: 3ms, render: 3ms)
[VideoPoll Workflow] Starting video polling for task: sora-2:task_01ka2pkbvaf67vtnc7v92hqtvc
[VideoPoll Workflow] Polling attempt 1/30
[VideoPoll Workflow] Status: pending
[VideoPoll Workflow] Polling attempt 2/30
[VideoPoll Workflow] Status: pending
[VideoPoll Workflow] Polling attempt 3/30
[VideoPoll Workflow] Status: running
[VideoPoll Workflow] Polling attempt 4/30
[VideoPoll Workflow] Status: running
 POST /.well-known/workflow/v1/flow 503 in 53ms (compile: 1143µs, render: 52ms)
[Status API] RunID: wrun_01KA2PKCGZWBXAR94NGXDVWR7E
[Status API] Status: running
[Status API] Output type: undefined
[Status API] Output: undefined
[Status API] Has result: false
 GET /api/content/status/wrun_01KA2PKCGZWBXAR94NGXDVWR7E 200 in 6ms (compile: 3ms, render: 4ms)
[Status API] RunID: wrun_01KA2PKCGZWBXAR94NGXDVWR7E
[Status API] Status: running
[Status API] Output type: undefined
[Status API] Output: undefined
[Status API] Has result: false
 GET /api/content/status/wrun_01KA2PKCGZWBXAR94NGXDVWR7E 200 in 7ms (compile: 2ms, render: 5ms)
[Status API] RunID: wrun_01KA2PKCGZWBXAR94NGXDVWR7E
[Status API] Status: running
[Status API] Output type: undefined
[Status API] Output: undefined
[Status API] Has result: false
 GET /api/content/status/wrun_01KA2PKCGZWBXAR94NGXDVWR7E 200 in 6ms (compile: 2ms, render: 3ms)
[Status API] RunID: wrun_01KA2PKCGZWBXAR94NGXDVWR7E
[Status API] Status: running
[Status API] Output type: undefined
[Status API] Output: undefined
[Status API] Has result: false
 GET /api/content/status/wrun_01KA2PKCGZWBXAR94NGXDVWR7E 200 in 6ms (compile: 2ms, render: 4ms)
[Status API] RunID: wrun_01KA2PKCGZWBXAR94NGXDVWR7E
[Status API] Status: running
[Status API] Output type: undefined
[Status API] Output: undefined
[Status API] Has result: false
 GET /api/content/status/wrun_01KA2PKCGZWBXAR94NGXDVWR7E 200 in 5ms (compile: 2ms, render: 3ms)
[Status API] RunID: wrun_01KA2PKCGZWBXAR94NGXDVWR7E
[Status API] Status: running
[Status API] Output type: undefined
[Status API] Output: undefined
[Status API] Has result: false
 GET /api/content/status/wrun_01KA2PKCGZWBXAR94NGXDVWR7E 200 in 7ms (compile: 3ms, render: 5ms)
[Status API] RunID: wrun_01KA2PKCGZWBXAR94NGXDVWR7E
[Status API] Status: running
[Status API] Output type: undefined
[Status API] Output: undefined
[Status API] Has result: false
 GET /api/content/status/wrun_01KA2PKCGZWBXAR94NGXDVWR7E 200 in 6ms (compile: 2ms, render: 4ms)
[Status API] RunID: wrun_01KA2PKCGZWBXAR94NGXDVWR7E
[Status API] Status: running
[Status API] Output type: undefined
[Status API] Output: undefined
[Status API] Has result: false
 GET /api/content/status/wrun_01KA2PKCGZWBXAR94NGXDVWR7E 200 in 5ms (compile: 2ms, render: 3ms)
[Status API] RunID: wrun_01KA2PKCGZWBXAR94NGXDVWR7E
[Status API] Status: running
[Status API] Output type: undefined
[Status API] Output: undefined
[Status API] Has result: false
 GET /api/content/status/wrun_01KA2PKCGZWBXAR94NGXDVWR7E 200 in 5ms (compile: 1948µs, render: 3ms)
[Status API] RunID: wrun_01KA2PKCGZWBXAR94NGXDVWR7E
[Status API] Status: running
[Status API] Output type: undefined
[Status API] Output: undefined
[Status API] Has result: false
 GET /api/content/status/wrun_01KA2PKCGZWBXAR94NGXDVWR7E 200 in 5ms (compile: 2ms, render: 3ms)
[VideoPoll Workflow] Starting video polling for task: sora-2:task_01ka2pkbvaf67vtnc7v92hqtvc
[VideoPoll Workflow] Polling attempt 1/30
[VideoPoll Workflow] Status: pending
[VideoPoll Workflow] Polling attempt 2/30
[VideoPoll Workflow] Status: pending
[VideoPoll Workflow] Polling attempt 3/30
[VideoPoll Workflow] Status: running
[VideoPoll Workflow] Polling attempt 4/30
[VideoPoll Workflow] Status: running
[VideoPoll Workflow] Polling attempt 5/30
 POST /.well-known/workflow/v1/flow 200 in 56ms (compile: 1626µs, render: 54ms)
 POST /.well-known/workflow/v1/step 200 in 744ms (compile: 1226µs, render: 743ms)
[VideoPoll Workflow] Starting video polling for task: sora-2:task_01ka2pkbvaf67vtnc7v92hqtvc
[VideoPoll Workflow] Polling attempt 1/30
[VideoPoll Workflow] Status: pending
[VideoPoll Workflow] Polling attempt 2/30
[VideoPoll Workflow] Status: pending
[VideoPoll Workflow] Polling attempt 3/30
[VideoPoll Workflow] Status: running
[VideoPoll Workflow] Polling attempt 4/30
[VideoPoll Workflow] Status: running
[VideoPoll Workflow] Polling attempt 5/30
[VideoPoll Workflow] Status: running
 POST /.well-known/workflow/v1/flow 200 in 42ms (compile: 648µs, render: 42ms)
 POST /.well-known/workflow/v1/step 200 in 19ms (compile: 773µs, render: 19ms)
[Status API] RunID: wrun_01KA2PKCGZWBXAR94NGXDVWR7E
[Status API] Status: running
[Status API] Output type: undefined
[Status API] Output: undefined
[Status API] Has result: false
 GET /api/content/status/wrun_01KA2PKCGZWBXAR94NGXDVWR7E 200 in 7ms (compile: 4ms, render: 3ms)
[VideoPoll Workflow] Starting video polling for task: sora-2:task_01ka2pkbvaf67vtnc7v92hqtvc
[VideoPoll Workflow] Polling attempt 1/30
[VideoPoll Workflow] Status: pending
[VideoPoll Workflow] Polling attempt 2/30
[VideoPoll Workflow] Status: pending
[VideoPoll Workflow] Polling attempt 3/30
[VideoPoll Workflow] Status: running
[VideoPoll Workflow] Polling attempt 4/30
[VideoPoll Workflow] Status: running
[VideoPoll Workflow] Polling attempt 5/30
[VideoPoll Workflow] Status: running
 POST /.well-known/workflow/v1/flow 503 in 83ms (compile: 999µs, render: 82ms)
[Status API] RunID: wrun_01KA2PKCGZWBXAR94NGXDVWR7E
[Status API] Status: running
[Status API] Output type: undefined
[Status API] Output: undefined
[Status API] Has result: false
 GET /api/content/status/wrun_01KA2PKCGZWBXAR94NGXDVWR7E 200 in 5ms (compile: 2ms, render: 3ms)
[Status API] RunID: wrun_01KA2PKCGZWBXAR94NGXDVWR7E
[Status API] Status: running
[Status API] Output type: undefined
[Status API] Output: undefined
[Status API] Has result: false
 GET /api/content/status/wrun_01KA2PKCGZWBXAR94NGXDVWR7E 200 in 7ms (compile: 3ms, render: 4ms)
[Status API] RunID: wrun_01KA2PKCGZWBXAR94NGXDVWR7E
[Status API] Status: running
[Status API] Output type: undefined
[Status API] Output: undefined
[Status API] Has result: false
 GET /api/content/status/wrun_01KA2PKCGZWBXAR94NGXDVWR7E 200 in 7ms (compile: 2ms, render: 4ms)
[Status API] RunID: wrun_01KA2PKCGZWBXAR94NGXDVWR7E
[Status API] Status: running
[Status API] Output type: undefined
[Status API] Output: undefined
[Status API] Has result: false
 GET /api/content/status/wrun_01KA2PKCGZWBXAR94NGXDVWR7E 200 in 6ms (compile: 3ms, render: 3ms)
[Status API] RunID: wrun_01KA2PKCGZWBXAR94NGXDVWR7E
[Status API] Status: running
[Status API] Output type: undefined
[Status API] Output: undefined
[Status API] Has result: false
 GET /api/content/status/wrun_01KA2PKCGZWBXAR94NGXDVWR7E 200 in 7ms (compile: 2ms, render: 5ms)
[Status API] RunID: wrun_01KA2PKCGZWBXAR94NGXDVWR7E
[Status API] Status: running
[Status API] Output type: undefined
[Status API] Output: undefined
[Status API] Has result: false
 GET /api/content/status/wrun_01KA2PKCGZWBXAR94NGXDVWR7E 200 in 6ms (compile: 2ms, render: 4ms)
[Status API] RunID: wrun_01KA2PKCGZWBXAR94NGXDVWR7E
[Status API] Status: running
[Status API] Output type: undefined
[Status API] Output: undefined
[Status API] Has result: false
 GET /api/content/status/wrun_01KA2PKCGZWBXAR94NGXDVWR7E 200 in 7ms (compile: 2ms, render: 4ms)
[Status API] RunID: wrun_01KA2PKCGZWBXAR94NGXDVWR7E
[Status API] Status: running
[Status API] Output type: undefined
[Status API] Output: undefined
[Status API] Has result: false
 GET /api/content/status/wrun_01KA2PKCGZWBXAR94NGXDVWR7E 200 in 7ms (compile: 2ms, render: 4ms)
[Status API] RunID: wrun_01KA2PKCGZWBXAR94NGXDVWR7E
[Status API] Status: running
[Status API] Output type: undefined
[Status API] Output: undefined
[Status API] Has result: false
 GET /api/content/status/wrun_01KA2PKCGZWBXAR94NGXDVWR7E 200 in 7ms (compile: 3ms, render: 4ms)
[Status API] RunID: wrun_01KA2PKCGZWBXAR94NGXDVWR7E
[Status API] Status: running
[Status API] Output type: undefined
[Status API] Output: undefined
[Status API] Has result: false
 GET /api/content/status/wrun_01KA2PKCGZWBXAR94NGXDVWR7E 200 in 6ms (compile: 2ms, render: 4ms)
[Status API] RunID: wrun_01KA2PKCGZWBXAR94NGXDVWR7E
[Status API] Status: running
[Status API] Output type: undefined
[Status API] Output: undefined
[Status API] Has result: false
 GET /api/content/status/wrun_01KA2PKCGZWBXAR94NGXDVWR7E 200 in 7ms (compile: 3ms, render: 4ms)
[Status API] RunID: wrun_01KA2PKCGZWBXAR94NGXDVWR7E
[Status API] Status: running
[Status API] Output type: undefined
[Status API] Output: undefined
[Status API] Has result: false
 GET /api/content/status/wrun_01KA2PKCGZWBXAR94NGXDVWR7E 200 in 7ms (compile: 2ms, render: 5ms)
[Status API] RunID: wrun_01KA2PKCGZWBXAR94NGXDVWR7E
[Status API] Status: running
[Status API] Output type: undefined
[Status API] Output: undefined
[Status API] Has result: false
 GET /api/content/status/wrun_01KA2PKCGZWBXAR94NGXDVWR7E 200 in 7ms (compile: 2ms, render: 4ms)
[VideoPoll Workflow] Starting video polling for task: sora-2:task_01ka2pkbvaf67vtnc7v92hqtvc
[VideoPoll Workflow] Polling attempt 1/30
[VideoPoll Workflow] Status: pending
[VideoPoll Workflow] Polling attempt 2/30
[VideoPoll Workflow] Status: pending
[VideoPoll Workflow] Polling attempt 3/30
[VideoPoll Workflow] Status: running
[VideoPoll Workflow] Polling attempt 4/30
[VideoPoll Workflow] Status: running
[VideoPoll Workflow] Polling attempt 5/30
[VideoPoll Workflow] Status: running
[VideoPoll Workflow] Polling attempt 6/30
 POST /.well-known/workflow/v1/flow 200 in 70ms (compile: 1573µs, render: 68ms)
 POST /.well-known/workflow/v1/step 200 in 702ms (compile: 1214µs, render: 701ms)
[VideoPoll Workflow] Starting video polling for task: sora-2:task_01ka2pkbvaf67vtnc7v92hqtvc
[VideoPoll Workflow] Polling attempt 1/30
[VideoPoll Workflow] Status: pending
[VideoPoll Workflow] Polling attempt 2/30
[VideoPoll Workflow] Status: pending
[VideoPoll Workflow] Polling attempt 3/30
[VideoPoll Workflow] Status: running
[VideoPoll Workflow] Polling attempt 4/30
[VideoPoll Workflow] Status: running
[VideoPoll Workflow] Polling attempt 5/30
[VideoPoll Workflow] Status: running
[VideoPoll Workflow] Polling attempt 6/30
[VideoPoll Workflow] Status: running
 POST /.well-known/workflow/v1/flow 200 in 58ms (compile: 709µs, render: 57ms)
 POST /.well-known/workflow/v1/step 200 in 19ms (compile: 893µs, render: 18ms)
[VideoPoll Workflow] Starting video polling for task: sora-2:task_01ka2pkbvaf67vtnc7v92hqtvc
[VideoPoll Workflow] Polling attempt 1/30
[VideoPoll Workflow] Status: pending
[VideoPoll Workflow] Polling attempt 2/30
[VideoPoll Workflow] Status: pending
[VideoPoll Workflow] Polling attempt 3/30
[VideoPoll Workflow] Status: running
[VideoPoll Workflow] Polling attempt 4/30
[VideoPoll Workflow] Status: running
[VideoPoll Workflow] Polling attempt 5/30
[VideoPoll Workflow] Status: running
[VideoPoll Workflow] Polling attempt 6/30
[VideoPoll Workflow] Status: running
 POST /.well-known/workflow/v1/flow 503 in 54ms (compile: 769µs, render: 53ms)
^C GET /api/content/stream/wrun_01KA2PKCGZWBXAR94NGXDVWR7E 200 in 3.0min (compile: 2ms, render: 3.0min)
Discovering workflow directives 1438ms
Created steps bundle 31ms
Created intermediate workflow bundle 40ms
Creating webhook route

ashnouruzi@C357PRGCH2 content-agent % 