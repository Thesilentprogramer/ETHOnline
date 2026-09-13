# Local OpenAI API

The swarm only runs in a browser room. This process does not infer — it forwards `POST /v1/chat/completions` to the **host tab** over WebSocket. The tab connects *out* to `ws://127.0.0.1:11435/bridge`; nothing punches into the browser.

## Run

Keep `/market` (or `/runtime/p2p.html?host=1`) open as host, start the model when pledged GB is enough, then:

```bash
node runtime/serve.mjs
```

The process prints `OPENAI_API_KEY`. Requests without that bearer are rejected. Bound to `127.0.0.1` only.

```bash
export OPENAI_API_KEY=…   # from the serve banner
curl http://127.0.0.1:11435/v1/chat/completions \
  -H "Authorization: Bearer $OPENAI_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"model":"qwen3-0.6b","messages":[{"role":"user","content":"hello"}]}'
```

Stream:

```bash
curl http://127.0.0.1:11435/v1/chat/completions \
  -H "Authorization: Bearer $OPENAI_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"model":"qwen3-0.6b","stream":true,"messages":[{"role":"user","content":"hello"}]}'
```

Jobs join the same host queue as the marketplace UI (one generation at a time). The room toasts “a local client asked…”.

## `baseURL` swap

Anything that already speaks OpenAI chat completions:

```js
import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: "http://127.0.0.1:11435/v1",
});

const r = await client.chat.completions.create({
  model: "qwen3-0.6b",
  messages: [{ role: "user", content: "hello" }],
});
```

`GET /v1/models` lists the room catalogue. The loaded room model is what actually runs; `model` is echoed on the response.

There is no public hosted inference URL. Vercel cannot run WebGPU.

## Hedera x402 (optional)

If `HEDERA_ACCOUNT_ID` is set, `POST /v1/chat/completions` returns **402** until the client retries with an x402 v2 `X-PAYMENT` header (base64 JSON PaymentPayload). Settlement is Blocky402 on Hedera testnet (`X402_FACILITATOR`, default `https://api.testnet.blocky402.com`). Flat price: `X402_PRICE_HBAR` (default `0.001` → 100000 tinybars). `/market` posting stays free.

After a paid job finishes, the host tab gets a receipt over the bridge WebSocket. Credits:

- Solo host (only pledged GB): 100% to the host (**no extra HBAR send** — they already received x402).
- With workers: `HOST_CUT_BPS` (default 1000 = 10%) to the host; remainder by pledged GB. Observer / 0 GB: nothing.
- Worker credits ≤ 0.10 ℏ are transferred automatically. Larger amounts are recorded as `approve` (Ledger confirmation) and **not** sent.
- Failed generation: receipt with no credits and no payouts.

HCS submit needs `HEDERA_PRIVATE_KEY` (or `LEDGER_RING_FILE` + `wallet-cli ring decrypt`), `HCS_TOPIC_ID`, and `npm install @hiero-ledger/sdk` in `runtime/` (see [create a topic](https://docs.hedera.com/native/tutorials/consensus/create-first-topic)). HashScan links show on that job in `/market`.

## ENSv2 (when Hedera is on)

If `HEDERA_ACCOUNT_ID` is set, paid `/v1` also requires a Sepolia ENS name. The host tab sends `{ t: "ens", ens }` over `/bridge`. Serve resolves text key `hedera` (must equal `payTo`) **before** settle.

- Unpaid → **402**
- No host tab on a paid retry → **503**, no HBAR taken
- Bad / missing host name → **403**, no HBAR taken
- Worker names checked only at credit split

Paste the subname on `/onboard`. `ENS_PARENT` default `trustedswarm.eth`. `ENS_RPC` default `https://ethereum-sepolia-rpc.publicnode.com`. Register on [app.ens.dev](https://app.ens.dev/). The parent name itself is valid if you cannot create subnames yet.

## Ledger Key Ring (payouts)

`wallet-cli ring` encrypts the operator key. After `ring init` on your Ledger:

```bash
# you set WALLET_PASS in the environment; do not paste it into chat
wallet-cli ring encrypt --key trusted-swarm -i operator.hedera -o operator.hedera.enc
export LEDGER_RING_FILE=runtime/operator.hedera.enc
export LEDGER_RING_KEY=trusted-swarm
```

Then `serve.mjs` decrypts at runtime and never prints the key. Without a ring file it still uses `HEDERA_PRIVATE_KEY`.

```bash
export HEDERA_ACCOUNT_ID=0.0.x
export HEDERA_PRIVATE_KEY=…
export HCS_TOPIC_ID=0.0.x
export X402_PRICE_HBAR=0.001
node runtime/serve.mjs
# unpaid:
curl -i http://127.0.0.1:11435/v1/chat/completions \
  -H "Authorization: Bearer $OPENAI_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"model":"qwen3-0.6b","messages":[{"role":"user","content":"hello"}]}'
# expect 402; then retry with X-PAYMENT from @x402/hedera
```

See [PHASES.md](../PHASES.md) and [Blocky402](https://blocky402.com/docs/quickstart/).
