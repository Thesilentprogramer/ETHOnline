# Recipe: paid browser inference (Trusted Swarm + Hedera x402)

Paste this into a Bazantic Recipe. It is the only material difference vs raw OpenAPI.

## When to use

An agent needs a chat completion run on a live WebGPU swarm (not a hosted GPU API). The user has `serve.mjs` running and a host tab open on `/market`.

Do not use this for image gen, embeddings, or a public URL. There is none.

## What you need

- Spec / quote: `https://trusted-swarm.vercel.app` (`GET /openapi.json`, `GET /v1/price`).
- Completions: `http://127.0.0.1:11435` with a host tab on `/market`, bearer from the serve banner.
- For paid mode: a Hedera testnet x402 payload the 402 `accepts[]` describes (Blocky402, asset HBAR).

## Flow (two services, one job)

1. **Quote (Trusted Swarm)** — `GET /v1/price` (no bearer).
   - `paid: false` → skip to step 3, local free completions.
   - `paid: true` → note `amountTinybar`, `payTo`, `network`.
2. **Pay (Hedera / Blocky402)** — build the x402 v2 `X-PAYMENT` header for that quote. Do not send HBAR until a host tab exists; a paid retry with no host is 503 and must not settle.
3. **Infer (Trusted Swarm)** — `POST /v1/chat/completions` with bearer, JSON `{ model, messages }`. On 402, retry once with `X-PAYMENT`. On 403, the host ENS `hedera` text does not match `payTo`.
4. **Verify (Hedera HashScan)** — the host tab / `/market` job shows `hcsScan` / `payScan`. Open that URL. Success receipt has credits; failed generation has no credits.

Neither step alone is the product: the quote+pay is Hedera; the tokens come from the swarm.

## Result

Assistant text in the OpenAI chat.completion (or SSE). Settlement proof is the HashScan link, not a second model call.
