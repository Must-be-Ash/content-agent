
here are Genbase api references: 
https://www.genbase.fun/docs


Genbase - AI Video & Image Generator with x402
This guide will help you understand Genbase, an AI video and image generation platform powered by x402 open payment 
standard for programmatic payments.

This application showcases x402, the open payment standard that enables services to charge for access to their APIs 
directly over HTTP. It uses the HTTP 402 Payment Required status code to allow clients to programmatically pay for video 
generation without accounts, sessions, or credential management.

•
X (Twitter)
•
x402 Documentation
Why Use x402?
This application demonstrates how x402 addresses key limitations of existing payment systems:

Traditional payment problems:
• High fees and friction with credit cards and fiat payment processors
• Incompatibility with machine-to-machine payments
• Lack of support for micropayments
• Account creation and authentication overhead
x402 solutions:
⚡ Low fees: ~$0.001-0.01 gas fees on Base L2
🤖 Machine-friendly: AI agents can pay autonomously
💰 Micropayments: Pay $0.02-0.2 per generation (video/image)
🚫 No accounts: Just connect your Web3 wallet
Who is this for?
Developers: Learn how to integrate x402 into your own applications for programmatic payments.
Users: Generate AI videos with pay-per-use pricing - no subscriptions required.
AI Agents: Demonstrate how autonomous agents can pay for API access programmatically.
What Can You Build?
This application showcases one use case, but x402 enables many more:

✅ API services paid per request (demonstrated here with video generation)
✅ AI agents that autonomously pay for API access
✅ Paywalls for digital content
✅ Microservices monetized via microtransactions
✅ Proxy services that aggregate and resell API capabilities
In this app specifically:
🎬 Pay $0.2 USDC to generate AI videos using Sora 2
🖼️ Pay $0.02 USDC to generate AI images using Flux Pro (10x cheaper!)
🆓 Free status queries to check progress
📊 Real-time progress tracking with automatic updates
💾 Automatic history of all your generations
How Does It Work?
High-Level Flow
1. User Request
↓
2. 402 Payment Required Response
↓
3. Wallet Signs Payment
↓
4. Request with Payment Header
↓
5. Payment Verification
↓
6. Video Generation Starts
↓
7. Free Status Polling (no payment)
↓
8. Video Completed & Auto-play
⚠️ Important: Content Policy Notice
Your prompts may violate OpenAI's content policy, which could result in video generation failure. This includes prompts 
containing unsafe content such as violence, adult content, minors, etc.

If your video fails due to policy violations and you need a refund, please contact: contact@genbase.fun with your Video ID
 and wallet address.

Creating a Video with Sora 2 (Paid - $0.2 USDC)
// Frontend makes request
const response = await payingFetch("/api/video/create-sora2", {
  method: "POST",
  body: JSON.stringify({
    prompt: "A cat playing piano in a jazz club",
    model: "sora-2",
    seconds: "10",
    size: "1280x720"
  })
});

// Server middleware intercepts
// Returns: 402 Payment Required + payment info

// payingFetch automatically:
// - Signs payment with wallet
// - Retries with Authorization header
// - Returns final response
API Reference
Genbase provides three AI generation endpoints: Sora 2 (video), Veo (video), and Flux Pro (image).

🎬 POST /api/video/create-sora2
Create AI videos using OpenAI's Sora 2 model (requires payment: $0.2 USDC)

Request Body:
{
  "prompt": "A cat playing piano in a jazz club",
  "model": "sora-2",           // or "sora-2-pro"
  "seconds": "10",             // "10", "15", or "25" (pro only)
  "size": "1280x720"           // "1280x720", "720x1280", "1792x1024", "1024x1792"
}
Response (200 OK):
{
  "success": true,
  "data": {
    "id": "sora-2:task_01j9abc123xyz456def789ghi0",
    "status": "pending",           // "pending" | "processing" | "Ready" | "failed"
    "video_url": null,             // Available when status is "Ready"
    "thumbnail_url": null
  }
}
Models:
• sora-2 - Standard quality, 10-15 seconds
• sora-2-pro - Enhanced quality, up to 25 seconds
🔍 GET /api/video/query
Query video generation status (FREE - no payment required)

Request Parameters:
?id=sora-2:task_01j9abc123xyz456def789ghi0
Response:
{
  "success": true,
  "data": {
    "id": "sora-2:task_01j9abc123xyz456def789ghi0",
    "status": "Ready",
    "video_url": "https://...",
    "detail": {
      "input": {
        "prompt": "Original prompt",
        "model": "sora-2",
        "duration": "10",
        "size": "1280x720"
      }
    }
  }
}
Status Values:
• pending - Waiting to process (Progress: 20%)
• processing - Generating video (Progress: 50%)
• video_upsampling - Enhancing quality (Progress: 80%)
• Ready or completed - Ready to watch (Progress: 100%)
• failed - Generation failed
\
note that we will be using:
"model": "sora-2", "duration": "10", "size": "1280x720" and need to pay $0.2 USDC 