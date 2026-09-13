# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Compute consumers post an OpenAI-shaped chat completion and want it run on devices they already own. Compute contributors offer a laptop or phone’s WebGPU to a room. Agent/tool authors hit the same contract locally via `127.0.0.1:11435`. Inferred from `Trusted Swarm.md` and the locked grill: ETHOnline 2026 demo, local tabs first.

## Product Purpose

Trusted Swarm is a browser P2P inference room. A task is a queued `model` + `messages` completion. The host drains one job at a time once pledged GPU memory is enough. Success for this slice: post a task, form a room, run it on this machine or with invited devices.

## Positioning

The swarm only lives in a browser tab (WebGPU + WebRTC). Other projects plug in with OpenAI `POST /v1/chat/completions` through a localhost bridge; the host tab connects *out*. Not a public Vercel inference API. Not a job board across strangers’ rooms.

## Operating Context

Vite PWA at `apps/web` (port 5180). Runtime at `/runtime/p2p.html`. Local bridge: `node runtime/serve.mjs`. Phase 1 has no Hedera, ENS, or Ledger.

## Capabilities and Constraints

- Post first: landing → `/market` creates a room and parks the task.
- Offer this device: capability probe, then join that room as a worker.
- Anyone in the room (or holding the localhost bearer) can enqueue. One generation lock (`ai.busy`).
- Solo is enough when this machine fits the model.
- Android/`http://LAN` is often not a secure context for WebGPU.

## Brand Commitments

Name: Trusted Swarm. Paper editorial everywhere in the PWA (`#f2f0ec` / `#0d0c0b`, Inter Tight, dark pills). Runtime iframe stays the existing dark GPU console (`runtime/p2p.html`).

## Evidence on Hand

- Spec: `Trusted Swarm.md`
- Journal: `DEVELOPMENT.md`
- Live room UI: `runtime/p2p.html`
- Composition reference (not copy): `/Users/shubhamindulkar/Downloads/element.html`
- No customer logos, testimonials, or independent benchmarks to show. Do not invent them.

## Product Principles

- Homepage action is post a task; offering a device is secondary.
- Same OpenAI contract for UI, room chat, and localhost `/v1`.
- Measure devices, do not fingerprint them.
- Do not claim cloud-beating speed or paid work until those layers exist.

## Accessibility & Inclusion

Capability probe is scheduling-only (WebGPU, memory, WebRTC). No MAC, serial, or fingerprint. Respect `prefers-reduced-motion` on authored motion.
