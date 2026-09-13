# Open-network phases

Working contract for identity, payment, and settlement. Inference stays in [`Trusted Swarm.md`](Trusted%20Swarm.md) §8–9 and §13. This file does not rewrite the runtime.

Credits here become **HBAR out** on paid jobs when Ledger payouts run (worker transfers only; host already received x402). Oversized payouts are blocked.

## Now — Hedera testnet

Paid surface is only the localhost OpenAI bridge: `POST /v1/chat/completions` on [`runtime/serve.mjs`](runtime/serve.mjs). No Hedera env → the bridge stays free. Env present → HTTP 402, Blocky402 (`https://api.testnet.blocky402.com`), flat `X402_PRICE_HBAR` per completion.

[`/market`](apps/web/src/pages/Market.tsx) posting stays free (cooperative). Credits mint only when a client actually paid.

After a paid job:

- Success → HCS receipt + credits.
- Failure → HCS receipt, **no** credits.
- Host tab shows HashScan on that job via the existing bridge WebSocket.

Split (compute provided):

- **Solo** (host is the only pledged GB): 100% to the host.
- **With workers:** `HOST_CUT_BPS` (default 1000 = 10%) to the host/coordinator; remainder to workers by pledged GB; observer (0 GB) gets nothing.

Env: `HEDERA_ACCOUNT_ID` (enables the gate), `HEDERA_PRIVATE_KEY` + `HCS_TOPIC_ID` (submit receipt), `X402_PRICE_HBAR`, `HOST_CUT_BPS`, `X402_FACILITATOR`.

See [`runtime/API.md`](runtime/API.md). Spec: §9.1, Phase 6.

## Now — ENSv2 admission

Hedera on ⇒ ENS on. Paste a `*.$ENS_PARENT` subname on [`/onboard`](apps/web/src/pages/Onboard.tsx) (default parent `trustedswarm.eth`). Skip = join, no credits.

`serve.mjs` resolves Sepolia `hedera` text via the Universal Resolver (`ENS_RPC`, default public Sepolia). Host tab sends the name string only.

- Unpaid `/v1` → **402**.
- Paid retry, host tab missing → **503**, no settle.
- Host name missing, not under parent, RPC fail, or `hedera` ≠ `payTo` → **403**, no settle.
- Workers: valid `hedera` text → credits; else 0 credits, still compute.

Register names on [app.ens.dev](https://app.ens.dev/) (ENSv2). Not [sepolia.app.ens.domains](https://sepolia.app.ens.domains/) (legacy v1). Parent owner sets the `hedera` text records.

Env: `ENS_PARENT`, `ENS_RPC`. Spec: §9.2, Phase 5.

## Now — Ledger payouts

After a successful paid job, credits become HBAR out of the operator account.

- Host/operator credit is **skipped** (they already received x402).
- Worker credit ≤ 0.10 ℏ (`LEDGER_AUTO_TINYBAR`, default 10_000_000) → automatic `TransferTransaction`.
- Over that, or daily > 10 ℏ → **no send** (`approve` / `block`). Device confirmation is the next USB step.
- Signing key from `HEDERA_PRIVATE_KEY`, or `wallet-cli ring decrypt` when `LEDGER_RING_FILE` is set. The agent must not print that key.

Spec: §9.3, Phase 7. Track: [Ledger × ETHOnline](https://developers.ledger.com/ethonline) Key Ring CLI.

## Optional — Arc

USDC settlement after Hedera, not before. Spec: §9 Arc.

## Later evidence (not this slice)

Disconnect-without-pay: drop a worker mid-run, show no credit. Token metering. Reputation.

## Out

Public Vercel inference API. Intellune-style marketing restyle. Paying contributors on free `/market` jobs.
