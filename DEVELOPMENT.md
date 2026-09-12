# Trusted Swarm — Development Notes

## What This App Really Does

Trusted Swarm is a **browser-based peer-to-peer AI compute network**. Independently owned devices join through a web app, advertise measured capabilities, receive a slice of a language model, run that slice on WebGPU, and (in later phases) get paid for verified work.

It is **not** a general-purpose decentralized cloud. Phase 1 is the Trusted Swarm product: capability-aware onboarding, the web/PWA UI, and the first-party inference runtime in [`runtime/`](runtime/) (WebGPU + WebRTC layer-sliced rooms). Blockchain (ENS identity, Hedera x402/HCS payments, Ledger-protected payouts) is the open-network layer and is **not** in Phase 1.

### The Core Idea

When you open the app, the flow is:

1. **Capability onboarding** — The browser is probed, not fingerprinted:
   - WebGPU availability and adapter limits
   - Approximate memory headroom
   - WebRTC support (needed later for real multi-device rooms)
   - A short calibration (adapter request + buffer budget estimate)
   - A transparent capability score (35% compute, 25% network, 20% memory, 10% stability, 10% verified history — history is 0 until later phases)
2. **Role assignment** — Four roles: **heavy-worker**, **standard-worker**, **light-worker**, **observer**. The host tab is the coordinator. Chrome/Edge desktop are first-class workers. No WebGPU → observer.
3. **Room** — Create or join a Trusted Swarm room. Extra tabs or phones on the same network join as workers.
4. **Layer-sliced inference** — default model path (Qwen 3.5 / catalogue in `runtime/room/models.js`):

```text
Host: embed the input token
  → hidden state over WebRTC
Peer A: execute an assigned layer range
  → hidden state over WebRTC
Host: final normalization, language-model head, and sampling
```

5. **Later phases (not built yet)** — Task leases, signed work receipts, ENSv2 admission, Hedera x402-gated compute + HCS receipts, Ledger Key Ring payouts, disconnect-without-pay demo.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | Vite + React + TypeScript, Tailwind, shadcn/ui, PWA |
| **Runtime** | First-party `runtime/` (WebGPU engine + WebRTC room). MIT-derived; see `runtime/NOTICE`. |
| **Signaling (upstream)** | PeerJS (public cloud by default). Phase 1 demo is local tabs. |
| **Identity (later)** | ENSv2 node namespace |
| **Payments / audit (later)** | Hedera x402, HCS receipts, batch settlement |
| **Treasury (later)** | Ledger Agent Stack / Key Ring |
| **UI Theme** | Serene-inspired: Dancing Script + Instrument Serif + Inter, liquid glass, `#0a0608` |

---

## Recent Changes (Sep 11, 2026)

### Phase 1 — Product shell + capability onboarding + local-tab inference

- **Living notes**: This `DEVELOPMENT.md` is the engineering journal. `Trusted Swarm.md` remains the architecture spec. Agent session log is a repo file: [`agent-logs/log.txt`](agent-logs/log.txt).
- **Inference runtime**: first-party tree at `runtime/` (not a git submodule). UI branded Trusted Swarm.
- **Vite React PWA** at `apps/web`: landing, `/onboard`, `/room`.
- **Capability score + four roles** implemented in-app (history term is 0).
- **Runtime wrapper**: `runtime/room.js` is HTML-coupled. We import `engine/` + `room/models.js` where possible and mount `/runtime/p2p.html` for the generation loop.
- **Local tabs only**: no new signaling service; no Hedera/ENS/Ledger.

### Serene visual restyle
- Landing is a video hero + parallax quote. Onboard/Room use liquid-glass cards. Product flow unchanged.

### LAN rooms for phone + laptop
- `npm run dev:lan` binds Vite to `0.0.0.0:5180` and serves the runtime at `/runtime/p2p.html`.
- PeerJS public cloud handles signaling. No extra signaling server.

---

## Issues We Faced During Development

*(Filled as we hit them.)*

---

## Current Known Issues

### Local tabs only vs the architecture’s 2–3 device proof

Phase 1 skipped a custom signaling server. Phone + laptop can still join via PeerJS on the same Wi-Fi using `http://<lan-ip>:5180/runtime/p2p.html`. `http://LAN` is not a secure context, so WebGPU on the phone may be unavailable (join as light worker). Laptop should use `http://localhost:5180` for WebGPU.

### Vite native binding / Node 20.16
Homebrew Node 26 is broken on this machine. Use `/usr/local/bin/node` (v20.16). Vite 8 warns it wants 20.19+. `@rolldown/binding-darwin-arm64` had to be installed explicitly.

### Phones are not the demo path

Safari/iOS may be classified as light-worker or observer. Chrome/Edge desktop are first-class workers.

### Runtime is not an npm library

`runtime/room.js` expects `p2p.html` DOM. A thin wrapper in `apps/web/src/swarm/` is the upgrade path if Vite cannot import the module graph cleanly.

---

## Features We Can Add

### High Priority (architecture Phases 3–4)

- [ ] **Task coordination** — Task IDs, layer assignments, heartbeats, leases, timeouts, reassignment, work-unit accounting.
- [ ] **Verification** — Model/runtime hashes, input/output commitments, signed receipts, redundant spot checks, payment hold.
- [ ] **Physical multi-device rooms** — Real WebRTC across machines (keep or host signaling).

### Medium Priority (architecture Phases 5–7)

- [ ] **ENSv2** — `trustedswarm.eth` namespace, node subnames, manifest records, admission check that actually blocks invalid nodes.
- [ ] **Hedera** — x402-gated compute endpoint, one real paid request, HCS work receipt, batch rewards.
- [ ] **Ledger** — Key Ring scoped payouts; over-limit payout blocked.

### Nice to Have (architecture Phase 8 + extras)

- [ ] **Polish and evidence** — Setup guide, explorer links, demo video, failure-case recording.
- [ ] **Bazantic MCP / Recipe**, **The Graph** worker selection, Privy/World/Arc — only after the Hedera+ENS+Ledger vertical slice.

### Completed Features

- [x] **Phase 1 PWA shell** — Landing, onboarding, room chrome.
- [x] **Capability onboarding + four roles**
- [x] **First-party inference runtime** (`runtime/`) + default model path
- [x] **Local-tab room (upstream runtime)**

---

*Last updated: September 11, 2026*
