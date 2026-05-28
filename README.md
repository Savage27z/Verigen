# VeriGen — AI Image Provenance & Tamper Detection

**Tatum x Walrus Hackathon Submission**

VeriGen is an on-chain provenance infrastructure for AI-generated images. Every image gets a SHA-256 fingerprint, stored on Walrus, registered on Sui via Tatum RPC — tamper-proof, immutable, verifiable by anyone.

## Hackathon Prizes Targeted

- **Best Use of Walrus** — Walrus is the core storage layer, not an add-on. Every certified image blob (raw pixels + metadata) lives permanently on Walrus decentralized storage.
- **Best Use of Tatum** — All Sui blockchain interactions route through Tatum's RPC gateway + MCP tooling. The AI verification agent queries the registry via Tatum MCP.

## Architecture

```
 User Prompt
      |
      v
+------------------+      +------------------+      +------------------+
|  Replicate SDXL  | ---> |   SHA-256 Hash   | ---> |   Walrus Blob    |
|  Image Gen       |      |   Fingerprint    |      |   Store (PUT)    |
+------------------+      +------------------+      +------------------+
                                                            |
                                                            v
                                                   +------------------+
                                                   |  Sui Registry    |
                                                   |  via Tatum RPC   |
                                                   |  (Move Contract) |
                                                   +------------------+
                                                            |
                                                            v
                                                   +------------------+
                                                   |  Certificate     |
                                                   |  Card + Explorer |
                                                   |  Links           |
                                                   +------------------+

 Verification Flow:
 Blob ID --> Walrus Fetch --> SHA-256 Compare --> Verdict (Authentic/Tampered)
                                    ^
                                    |
                          AI Agent (Gemini 2.0 Flash via OpenRouter + Tatum MCP Tools)
```

## How Walrus Is Core

Walrus is not an add-on — it IS the storage layer:

1. **Every certified image** is stored as a Walrus blob (raw base64 + metadata JSON)
2. **Verification** fetches the original blob from Walrus to compare SHA-256 hashes
3. **The blob ID** is the primary key linking Walrus storage to the Sui registry
4. **Tamper detection** works by re-hashing the Walrus blob and comparing against the on-chain record

## How Tatum Is Used

1. **Sui RPC Gateway** — All blockchain reads/writes go through `sui-mainnet.gateway.tatum.io` with `x-api-key` header
2. **MCP Tool Integration** — The AI agent uses Tatum MCP-compatible tools to query the Sui registry, fetch Walrus blobs, and compare hashes
3. **Transaction Signing** — Certificate registration transactions are signed and submitted via Tatum's Sui endpoint

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

```bash
cp .env.local.example .env.local
```

Fill in your keys:

| Variable | Required | Description |
|---|---|---|
| `REPLICATE_API_TOKEN` | For image gen | Get from replicate.com |
| `TATUM_API_KEY` | For blockchain | Get from tatum.io |
| `SUI_PRIVATE_KEY` | For on-chain writes | Base64 encoded Ed25519 keypair |
| `SUI_PACKAGE_ID` | For on-chain writes | Published package address from `sui client publish` |
| `SUI_REGISTRY_OBJECT_ID` | For on-chain writes | Shared Registry object ID from deployment output |
| `OPENROUTER_API_KEY` | For AI agent | Get from openrouter.ai/keys |
| `WALRUS_NETWORK` | Optional | `mainnet` (default) or `testnet` |

**Demo mode:** If no keys are set, the app runs with realistic fake data. The `x-demo-mode: true` header is added to API responses.

### 3. Deploy Move Contract (optional)

```bash
cd contracts
sui client publish --gas-budget 100000000
```

Note the shared Registry object ID from the output and set `SUI_REGISTRY_OBJECT_ID` in `.env.local`.

### 4. Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Deploy to Vercel

```bash
vercel --prod
```

Set all environment variables in the Vercel dashboard under Settings > Environment Variables.

## API Endpoints

| Endpoint | Method | Description |
|---|---|---|
| `/api/generate` | POST | Generate image + certify pipeline |
| `/api/verify` | GET | Fetch blob metadata from Walrus |
| `/api/verify` | POST | Compare uploaded hash vs on-chain |
| `/api/agent` | POST | AI agent with MCP tools |

## Explorer Links

- **SuiScan:** `https://suiscan.xyz/mainnet/tx/{txDigest}`
- **Walrus Explorer:** `https://walruscan.com/mainnet/blob/{blobId}`

## Tech Stack

- **Frontend:** Next.js 14 (App Router), React 18, TypeScript
- **Image Gen:** Replicate (Stability AI SDXL)
- **Storage:** Walrus (mainnet/testnet)
- **Blockchain:** Sui (Move contract via Tatum RPC)
- **AI Agent:** Google Gemini 2.0 Flash via OpenRouter (function calling)
- **Deploy:** Vercel

## License

MIT
