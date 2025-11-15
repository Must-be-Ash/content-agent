https://router.daydreams.systems/dashboard/videos\
here's the endpoint for this 'text-to-video' model:\
POST /v1/videos/veo-3-1-preview/jobs
Use this endpoint to submit jobs to the selected model. The payload mirrors the fields available in the generator UI so 
you can orchestrate video creation directly from your backend or workflow runners.\
Key fields & headers
• prompt - descriptive text for the scene.
• resolution & aspect_ratio - e.g. 720p at 16:9.
• enable_audio - set to true to include sound.
• duration_seconds - currently 4s per render.
• webhook_url - receive status updates when the job is done.
• Authorization header - includeBearer ‹api_key> for balance billing; omit it when sending an x402 payment token.
• X-PAYMENT header - include your signed x402 payment token when paying by wallet.\
Supply the X-PAYMENT header with a signed x402 token that covers ~$1.68. The generator UI can produce the token, or you 
can mint it directly from your backend using the same wallet flow.
1. Quote your job parameters (model, duration, audio, resolution) to know the amount to sign.
2. Ask the connected wallet to sign an x402 invoice and capture the returned token string.
3. Send the token in X-PAYMENT with your request. Skip the Authorization header for pure x402 flows. Tokens are single-
use, so mint a fresh one for every job.
CURL
curl -X POST https://api-beta.daydreams.systems/v1/videos/veo-3-1-preview/jobs \
-H "Content-Type: application/json" \
-H "X-PAYMENT: <x402_payment_token>" \
-d '{
"prompt": "A surreal ocean dream",
"resolution": "720p"
"aspect_ratio": "16:9",
"enable_audio": true,
"duration_seconds": 4,
"webhook_url": "https://your-app. com/video-callback",
"mode": "text-to-video"\
\
Node + x402-fetch:\
import { config } from "dotenv";
import {
  decodeXPaymentResponse,
  wrapFetchWithPayment,
  createSigner,
  type Hex,
} from "x402-fetch";

config();

const privateKey = process.env.PRIVATE_KEY as Hex | string;
const baseURL =
  process.env.RESOURCE_SERVER_URL ?? "https://api-beta.daydreams.systems";
const endpointPath = process.env.ENDPOINT_PATH ?? "/v1/videos/veo-3-1-preview/jobs";
const url = `${baseURL}${endpointPath}`;

if (!baseURL || !privateKey || !endpointPath) {
  console.error("Missing required environment variables");
  process.exit(1);
}

async function main(): Promise&lt;void&gt; {
  const signer = await createSigner("base-sepolia", privateKey);
  const fetchWithPayment = wrapFetchWithPayment(fetch, signer);

  const response = await fetchWithPayment(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
  "prompt": "A surreal ocean dream",
  "resolution": "720p",
  "aspect_ratio": "16:9",
  "enable_audio": true,
  "duration_seconds": 4,
  "webhook_url": "https://your-app.com/video-callback",
  "mode": "text-to-video"
}),
  });

  const body = await response.json();
  console.log(body);

  const paymentReceipt = decodeXPaymentResponse(
    response.headers.get("x-payment-response")!
  );
  console.log(paymentReceipt);
}

main().catch(error =&gt; {
  console.error(error?.response?.data?.error ?? error);
  process.exit(1);
});\
Webhook response
We send the job_id, final status, and any generated asset URLs to your webhook. Use GET /v1/videos/veo-3-1-
preview/jobs/<job_id> to poll for additional metadata or download links. 