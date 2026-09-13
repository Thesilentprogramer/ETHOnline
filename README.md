# Trusted Swarm

Browser P2P WebGPU inference. Post a chat-completion task into a room; offer a device you already own to drain it. Not a job board across strangers’ rooms. Not a public Vercel GPU.

## Post vs offer

- **Post a task** opens `/market` as host. The host mints a room code and parks a `model` + `messages` job.
- **Offer this device** joins **that** room as a worker. You need the host’s code. Onboarding keeps `?code=` so the worker never mints a different room.

Same queue the localhost `/v1` bridge uses.

## Run the web app

Homebrew’s newer Node can fail (`libllhttp`). Use Node 20:

```bash
PATH="/usr/local/bin:$PATH" npm run dev --prefix apps/web
```

Usually [http://127.0.0.1:5180](http://127.0.0.1:5180).

## Local OpenAI bridge

```bash
PATH="/usr/local/bin:$PATH" node runtime/serve.mjs
```

- Paid surface is only `POST /v1/chat/completions` (HTTP 402 when Hedera is on).
- A **GET** of that path is **404**, not 402. Clients must POST JSON.
- `/market` posting stays free.
- Hedera / ENS / HCS: copy [`runtime/.env.example`](runtime/.env.example) → `runtime/.env`.
- No public Vercel inference API. The live site is the PWA; inference is local tabs plus this process.

See [`PRODUCT.md`](PRODUCT.md) and [`Trusted Swarm.md`](Trusted%20Swarm.md).
