# Trusted Swarm

## An Open, Web-Based Marketplace for Verifiable Peer-to-Peer AI Compute

**Prepared by Manus AI**  
**Project basis:** [Nehanth/swarmllm](https://github.com/Nehanth/swarmllm)  
**Target event:** ETHOnline 2026  
**Primary format:** Web application / Progressive Web App (PWA)

---

## Executive Summary

Trusted Swarm is a browser-based peer-to-peer compute network that allows strangers to contribute device capacity to distributed artificial-intelligence inference. A laptop, desktop, tablet, or phone joins through a web application, reports its current capabilities, receives an appropriate role, performs assigned work through the SwarmLLM runtime, and receives compensation for verified useful computation.

The project builds on the existing [SwarmLLM repository](https://github.com/Nehanth/swarmllm), which demonstrates peer-to-peer large-language-model inference across browser tabs using WebGPU and WebRTC. Trusted Swarm adds the open-network layer that the runtime does not currently provide: capability-aware onboarding, public node identity, task assignment, work verification, reputation, metered service access, payments, and settlement.

The core inference system does **not** require blockchain. WebGPU, WebRTC, model partitioning, scheduling, and failure recovery can operate with ordinary software infrastructure. Blockchain becomes justified because the proposed network is open to strangers. Independent participants need a way to identify nodes, pay machines without manually creating accounts, record work receipts, and maintain an auditable history without relying entirely on one centralized operator.

The recommended first release is deliberately narrow. It should support one model, one inference task, two or three concurrent worker devices, one real Hedera-paid request, one Hedera Consensus Service receipt, one ENSv2-based node namespace, and one Ledger-protected payout path. It should demonstrate a worker disconnect and show that incomplete or unverified work is not paid.

> **Trusted Swarm turns browser devices into a verifiable AI compute network: ENS identifies nodes and their capabilities, Hedera pays for completed inference and records receipts, and Ledger protects payout authority.**

---

## 1. The Problem

### 1.1 Large models exceed the capacity of ordinary devices

A single phone, laptop, or modest desktop may not have enough memory or compute capacity to run a large language model comfortably. Several devices may collectively have sufficient resources if the model is partitioned across them.

This creates a practical opportunity for local and community-operated inference. A user could combine available devices instead of purchasing a dedicated GPU or sending every prompt to a centralized cloud provider.

### 1.2 Cloud GPU access is expensive and centralized

Cloud inference is convenient, but it introduces cost, capacity constraints, provider dependence, and data-sharing concerns. A network of independently operated devices could provide an alternative for selected workloads, especially when the devices are already available and the task is not latency-critical.

The initial product should not claim that peer-to-peer inference will always be cheaper or faster than cloud inference. The testable claim is narrower:

> **A group of capable browsers can execute a model that one participating device cannot efficiently execute alone.**

### 1.3 Open compute networks need coordination

When the network is open to strangers, the system must answer several questions:

| Coordination question | Required mechanism |
|---|---|
| Which device is available? | Live capability and availability handshake |
| What can the device run? | WebGPU detection and calibration benchmark |
| Which work was assigned? | Task ID, model version, and layer assignment |
| Did the device complete the work? | Work receipt and coordinator verification |
| What happens if it disconnects? | Heartbeats, leases, timeout, and reassignment |
| How much should it receive? | Verified work-unit accounting |
| Who owns the payout address? | Portable identity and secure key management |
| Can the history be rewritten? | Public receipts and append-only checkpoints |
| How can a machine pay another machine? | Metered service and machine-to-machine settlement |

These are real coordination problems. Blockchain does not solve all of them, but it can provide useful infrastructure at the identity, payment, and audit boundaries.

---

## 2. Product Definition

### 2.1 Product statement

Trusted Swarm is an **open web-based compute cooperative**. It allows independently owned devices to join an inference session, advertise measured capabilities, receive model work, return results, and earn rewards for verified contributions.

The system is not initially a general-purpose decentralized cloud. It is a focused service for distributed browser-based language-model inference.

### 2.2 Target users

The initial users are:

1. **Compute consumers**, such as developers or agents that need access to a model larger than their device can comfortably run.
2. **Compute contributors**, such as people with idle laptops or desktops who want to contribute capacity.
3. **Communities and teams**, which can temporarily pool devices for experiments, workshops, or private inference.
4. **Agent developers**, who need a metered compute endpoint that can be discovered and paid for programmatically.

### 2.3 What the product is not

Trusted Swarm should not initially promise:

- General-purpose Docker or arbitrary code execution.
- Fully trustless cryptographic proof of every matrix operation.
- Guaranteed privacy from every peer in the room.
- Mining-like income from phones.
- Lower cost or higher speed than every cloud provider.
- Support for every browser, model, and device.
- Per-tensor blockchain transactions.

The project should describe its verification model precisely as **attested work receipts with coordinator checks and probabilistic verification**, not as a perfect proof of computation.

---

## 3. Technical Foundation: SwarmLLM

The existing [SwarmLLM repository](https://github.com/Nehanth/swarmllm) provides the most valuable foundation for this project. It demonstrates a browser runtime that splits a model across devices and sends hidden-state activations between peers over WebRTC.

The repository describes a host that performs token embedding and final output processing while peers execute different model-layer ranges. A simplified flow is:

```text
Host: embed the input token
  ↓ hidden state over WebRTC
Peer A: execute layers 0–21
  ↓ hidden state over WebRTC
Peer B: execute layers 22–42
  ↓ hidden state over WebRTC
Peer C: execute layers 43–63
  ↓ hidden state over WebRTC
Host: final normalization, language-model head, and sampling
```

The existing system uses WebGPU for device-side inference and WebRTC for peer communication. It supports browser tabs as participants and is designed for model partitioning across devices.

Trusted Swarm should preserve this work rather than rebuild the inference engine. New work should be clearly separated from the existing repository history:

| Existing SwarmLLM capability | New Trusted Swarm capability |
|---|---|
| WebGPU model execution | Capability discovery and calibration |
| WebRTC peer communication | Open node registration and admission |
| Layer-sliced inference | Dynamic task assignment |
| Room-based participation | Paid compute service |
| Model execution | Work receipts and verification |
| Browser peers | ENSv2 node identities |
| No settlement layer | Hedera payment and audit receipts |
| No protected treasury | Ledger-secured payout authority |

---

## 4. Web and PWA Strategy

### 4.1 Build a web application first

A web application is the correct initial format because the project depends on cross-device access. A user should be able to open the same URL on a laptop, desktop, tablet, Android phone, or iPhone and receive an appropriate role.

The application should be installable as a Progressive Web App where supported. Installation is useful for returning users, but the core experience must work without installation.

```text
https://trusted-swarm.example

[Create Swarm]  [Join as Worker]  [View Capability]  [View Earnings]
```

### 4.2 Device roles

Not every device should be treated as a full worker.

| Role | Typical device | Function |
|---|---|---|
| Heavy worker | Desktop with capable GPU | Executes larger layer ranges |
| Standard worker | Modern laptop | Executes normal layer ranges |
| Light worker | Phone or tablet | Executes small tasks or light verification |
| Verifier | Any stable device | Runs spot-check tasks or redundant computation |
| Coordinator | Host laptop or service | Assigns work and aggregates the session |
| Observer | Unsupported device | Views the session without receiving paid work |

Phones should not be promised full model participation. Mobile browsers may suspend tabs, throttle GPU work, reload under memory pressure, or overheat. The onboarding benchmark must determine the role.

### 4.3 Privacy-respecting onboarding

The system should collect only information necessary for scheduling and payment. It should avoid persistent hardware fingerprinting.

Do not collect or publish:

- MAC addresses
- Device serial numbers
- Installed application lists
- Unrelated browser data
- Precise location
- Raw hardware fingerprints

Use a generated node identity or wallet/ENS identity. Keep detailed measurements offchain and publish only a capability class or commitment when necessary.

---

## 5. Capability-Aware Onboarding

Capability analysis should be a core product feature. It connects device onboarding to task assignment and fair compensation.

### 5.1 Fast capability handshake

The first screen should complete in a few seconds and check:

- WebGPU availability
- Browser compatibility
- Approximate memory headroom
- WebRTC support
- Direct peer connectivity
- Basic network latency
- Device availability preferences

Example capability record:

```json
{
  "node_id": "generated-node-id",
  "runtime_version": "0.3.0",
  "webgpu": true,
  "browser": "Chrome",
  "supported_models": ["Qwen3.8-27B"],
  "available_memory_gb": 5.5,
  "network_rtt_ms": 24,
  "role_recommendation": "standard-worker"
}
```

### 5.2 Calibration benchmark

The system should then run a short representative test rather than a long benchmark. It can measure:

- Layer execution time
- Activation transfer latency
- Packet loss and jitter
- Memory pressure
- Stability over a short interval
- WebGPU buffer limits

Example result:

```json
{
  "layer_latency_ms": 42.7,
  "activation_rtt_ms": 31,
  "memory_headroom_gb": 2.1,
  "stability": 0.96,
  "estimated_tokens_per_second": 8.4
}
```

### 5.3 Capability score

The score should be transparent rather than an opaque AI judgment.

```text
Capability score =
  35% compute capacity
+ 25% network quality
+ 20% memory headroom
+ 10% stability
+ 10% verified contribution history
```

The interface should explain the result:

```text
Recommended role: Standard worker
Estimated layer capacity: 18 layers
Network quality: Excellent
Memory headroom: 3.1 GB
Estimated reward: 0.08 HBAR per verified work batch
```

### 5.4 User controls

A contributor should be able to choose:

- Maximum session duration
- Maximum memory usage
- Maximum battery usage
- Whether to accept relay connections
- Minimum payout threshold
- Whether the device may work while the tab is unfocused
- Whether the device can receive paid tasks

These controls are important for user trust and reduce the perception that the product is hidden browser mining.

---

## 6. Open-Network Architecture

```text
                    ┌──────────────────────────┐
                    │       User / Agent       │
                    └────────────┬─────────────┘
                                 │
                                 ▼
                    ┌──────────────────────────┐
                    │       Web/PWA client     │
                    │  host, worker, observer  │
                    └────────────┬─────────────┘
                                 │
                 ┌───────────────┼────────────────┐
                 ▼               ▼                ▼
       ┌────────────────┐ ┌──────────────┐ ┌──────────────┐
       │ ENSv2 identity │ │ Coordinator  │ │ Ledger stack │
       │ and capability │ │ and policy   │ │ key ring     │
       │ manifest       │ │ engine       │ │              │
       └────────────────┘ └──────┬───────┘ └──────┬───────┘
                                  │                │
                                  ▼                ▼
                         ┌────────────────────────────┐
                         │    Hedera payment layer    │
                         │ x402, HCS, batch settlement│
                         └──────────────┬─────────────┘
                                        │
                                        ▼
                         ┌────────────────────────────┐
                         │  WebRTC / WebGPU SwarmLLM  │
                         │ model-layer execution      │
                         └────────────────────────────┘
```

### 6.1 Coordinator

The coordinator performs ordinary software functions:

- Select eligible workers
- Assign layer ranges
- Create task IDs
- Maintain leases and heartbeats
- Aggregate outputs
- Run spot checks
- Calculate work units
- Trigger reassignment
- Prepare payout batches

The coordinator may initially be centralized. The project should state that blockchain protects open-network boundaries, not that every scheduling decision is decentralized.

### 6.2 Worker

A worker:

1. Registers its capability manifest.
2. Resolves or receives its ENS identity.
3. Accepts a task lease.
4. Executes the assigned model layers.
5. Returns an activation or result commitment.
6. Signs a work receipt.
7. Receives payment only after verification.

### 6.3 Service endpoint

Create a metered compute service, for example:

```text
compute.trustedswarm.eth
```

The endpoint should accept a task request and return an HTTP `402 Payment Required` response containing the payment details. After payment, it should coordinate the swarm and return the result.

---

## 7. Work Verification and Failure Handling

### 7.1 The central trust problem

A signature proves that a key signed a message. It does not prove that a device performed correct computation. A worker could return random data, duplicate another task, disconnect after assignment, or claim a result it did not produce.

The hackathon implementation should use a layered verification model.

### 7.2 Task commitment

Each task should include:

- Session ID
- Task ID
- Model version hash
- Layer range
- Input commitment
- Nonce
- Lease expiry

The worker receipt should include:

- Task ID
- Node identity
- Model hash
- Layer range
- Output commitment
- Execution duration
- Runtime version
- Timestamp

### 7.3 Verification mechanisms

Use several practical mechanisms:

| Mechanism | Purpose |
|---|---|
| Coordinator consistency check | Detect invalid output immediately |
| Redundant small task | Compare two workers on the same verification input |
| Random spot check | Discourage dishonest workers |
| Heartbeat and lease | Detect disconnection |
| Output commitment | Bind a receipt to a specific result |
| Reputation | Reduce future work for unreliable nodes |
| Payment hold | Avoid paying before verification |

The accurate claim is:

> **Trusted Swarm verifies work probabilistically and economically rather than claiming a perfect proof of every computation.**

### 7.4 Failure flow

```text
Worker misses heartbeat
  → lease expires
  → task is reassigned
  → incomplete work receives no payout
  → failed node reputation decreases
  → HCS records the failure or checkpoint
```

This failure case should appear in the demo. It proves that the blockchain layer is connected to actual service behavior.

---

## 8. Blockchain Rationale

### 8.1 What works without blockchain

The following core functions work with ordinary infrastructure:

- Device benchmarking
- WebGPU inference
- WebRTC transport
- Model sharding
- Task scheduling
- Heartbeats
- Task reassignment
- Output aggregation
- Database accounting
- Basic node reputation

A centralized version could maintain a database of nodes, tasks, balances, and reliability. It could pay contributors through a normal payout provider.

### 8.2 Why blockchain is justified for an open network

Blockchain becomes useful because the network is intentionally open to independent participants.

| Function | Centralized implementation | Trusted Swarm implementation |
|---|---|---|
| Node identity | Platform database account | ENSv2 name and manifest |
| Capability record | Mutable database row | ENS record plus manifest hash |
| Task history | Operator-controlled database | HCS or onchain receipt checkpoint |
| Compute payment | Internal balance or payout service | Hedera x402 settlement |
| Agent payment | API key or subscription | Machine-to-machine payment |
| Payout authority | Server private key | Ledger-protected Key Ring |
| Reputation | Platform-owned score | Portable, auditable checkpoints |
| Dispute evidence | Internal logs | Signed receipts and public history |

### 8.3 What blockchain does not solve

Blockchain does not automatically solve:

- Correctness of computation
- WebRTC reliability
- GPU compatibility
- Network latency
- Battery or heat constraints
- Privacy from peers
- User adoption
- Economic sustainability
- Malicious model outputs
- Task scheduling

The project should be technically honest:

> **Blockchain is not required for distributed inference. It is used to coordinate payment, identity, and audit in a network where participants do not fully trust one central operator.**

---

## 9. Sponsor Track Strategy

### 9.1 Primary: Hedera — AI & Agentic Payments

This is the strongest sponsor fit. The track requires a live x402-gated service on Hedera testnet or mainnet, settled through the Blocky402 facilitator, and at least one real paid request.

Trusted Swarm should implement:

```text
Agent/client requests compute
  → compute service returns 402
  → client pays in HBAR
  → swarm executes the task
  → result is delivered
  → HCS records a work receipt
  → workers receive verified payout credit
```

The Hedera component can include:

- Metered inference
- Metered compute
- Agent-to-service payment
- HCS work receipts
- Batch or scheduled worker settlement

The minimum evidence is a real testnet payment, a real service response, a public repository, and a short demo.

### 9.2 Primary: ENS — Best Use of ENSv2

ENSv2 should be central to node admission and capability identity.

Recommended namespace:

```text
trustedswarm.eth
├── coordinator.trustedswarm.eth
├── node-01.trustedswarm.eth
├── node-02.trustedswarm.eth
└── model-qwen.trustedswarm.eth
```

The ENS record can bind:

- Node manifest
- Runtime version
- Model version
- Supported roles
- Payment address
- Reputation endpoint
- Revocation state

The coordinator should refuse paid work when the ENS identity is invalid, revoked, expired, or inconsistent with the payment address.

Use ENSv2 features such as hierarchical subnames, Permissioned Resolvers, Enhanced Access Control, and configurable subname lifecycles. ENS must control actual behavior rather than merely display a name.

### 9.3 Primary: Ledger — AI Agents x Ledger

Ledger should protect the coordinator treasury and payout authority through the Ledger Agent Stack, especially the Key Ring CLI (`wallet-cli ring`).

Suggested policy:

```text
Automatic payout:
- Known node
- Verified work receipt
- Payout below 0.10 HBAR
- Daily payout below 10 HBAR

Ledger approval required:
- New payout address
- Payout above 0.10 HBAR
- Treasury withdrawal
- Change to payout policy
- Change to coordinator identity
```

The demo should show a normal payout succeeding, an oversized payout being blocked, and a legitimate high-value operation requiring human/device confirmation. The agent must not receive the raw private key.

### 9.4 Strong optional: Bazantic

Expose Trusted Swarm as a reusable API and MCP service:

```text
submit_inference_task
get_task_status
discover_compute_nodes
estimate_compute_price
verify_work_receipt
```

Create a Recipe that:

1. Resolves eligible nodes.
2. Retrieves capability history.
3. Estimates price.
4. Requests the compute service.
5. Pays through x402.
6. Polls task status.
7. Verifies the receipt.
8. Returns the result.

This is a natural fit for Bazantic’s “Agentify a New API” track.

### 9.5 Strong optional: The Graph

Use The Graph to index:

- Node registrations
- Capability versions
- Tasks
- Work receipts
- Payouts
- Failed tasks
- Reputation checkpoints
- Runtime versions

Use live Graph data to select workers. For example:

```text
Find nodes that support the requested model,
are currently available,
have completed at least 95% of prior tasks,
and have a valid ENS manifest.
```

For the Graph composability track, combine at least two Graph products or use a meaningful standardized schema. Possible combinations include a Subgraph plus Subgraph MCP, or a Subgraph plus Substreams. A single static or local-only query is insufficient.

### 9.6 Optional: Arc

Arc could support USDC settlement for worker rewards. It is strategically possible but should follow Hedera, not precede it, because it adds another chain and payment system.

### 9.7 Optional: Privy

Privy could simplify embedded wallets and contributor onboarding. It is not essential to the core thesis.

### 9.8 Optional: World

World could distinguish unique human operators from automated nodes. It is useful for reputation and abuse prevention, but it is not necessary for the first release.

### 9.9 Low priority: Chainlink

Chainlink is not naturally central to peer-to-peer compute. A confidential workflow could protect sensitive task-routing or pricing data, but it should not be added solely to increase the number of sponsor tracks.

### Track priority table

| Priority | Track | Fit | Required evidence |
|---:|---|---|---|
| 1 | Hedera AI & Agentic Payments | Excellent | Real x402 payment and HCS evidence |
| 2 | ENS Best Use of ENSv2 | Excellent | Real ENSv2 namespace, permissions, and behavior |
| 3 | Ledger AI Agents x Ledger | Very strong | Real Key Ring flow and protected payout authority |
| 4 | Bazantic Agentify a New API | Strong | Live Gateway, MCP, and reusable Recipe |
| 5 | The Graph AI or Composable | Strong if implemented correctly | Live Graph data driving worker selection |
| 6 | Arc Agentic Economy | Optional | Real USDC agent payment and settlement |
| 7 | Privy | Optional | Functional Privy wallet flow |
| 8 | World | Optional | Working AgentKit or Selfie Check flow |
| 9 | Chainlink | Low priority | Real CRE confidential workflow |

---

## 10. Payment and Reward Model

### 10.1 Work-unit accounting

Do not pay for simply joining a room. Pay for verified useful work.

A preliminary model is:

```text
payout =
  completed verified work units
  × base work-unit rate
  × verification multiplier
  × reliability multiplier
```

Example:

```text
Completed work units: 120
Base rate: 0.001 HBAR
Verification multiplier: 1.0
Reliability multiplier: 0.95
Payout: 0.114 HBAR
```

### 10.2 Batch settlement

Do not create a blockchain transaction for every activation or tensor operation. Accumulate verified work and settle in batches.

```text
100 verified work units
  → one payout calculation
  → one Hedera settlement
  → one HCS checkpoint
```

### 10.3 Economic caution

The project should not promise meaningful income from phones. The initial reward is a demonstration of accountable contribution, not a mining opportunity. The interface should show estimated rewards alongside battery, memory, bandwidth, and session costs.

---

## 11. Security and Privacy Model

### 11.1 Peer trust

Peers may observe intermediate activations. The host and room participants may also observe prompts or outputs depending on the runtime design. Therefore, the system should not claim that distributed execution is automatically private.

The README should state:

> **Trusted Swarm protects payment and task accountability. It does not provide complete confidentiality from peers unless an additional privacy mechanism is introduced.**

### 11.2 Key security

- The browser worker should not receive the coordinator’s raw private key.
- Payout authority should be isolated through Ledger Key Ring.
- Payment capabilities should be scoped by amount, node, and task.
- Treasury withdrawals should require human approval.
- ENS permission changes should be restricted and auditable.

### 11.3 Web security

Implement:

- Task authentication
- Replay protection
- Unique task IDs
- Signed receipts
- Origin checks
- Rate limits
- WebRTC session authorization
- Input-size limits
- Model/version pinning
- Safe failure when a worker is untrusted

### 11.4 User consent

Onboarding must state:

- What device information is collected.
- What work the device may perform.
- How memory and battery limits are enforced.
- How long a session may run.
- How payouts are calculated.
- Whether relays are used.
- How the user can leave immediately.

---

## 12. Minimum Viable Product

The MVP should contain one complete vertical slice.

### Required components

1. **Web/PWA client** based on the existing SwarmLLM runtime.
2. **Capability onboarding** with WebGPU, memory, network, and benchmark checks.
3. **Two or three device roles** with measured task assignment.
4. **One supported model** and one text-generation task.
5. **Coordinator** with heartbeats, leases, and reassignment.
6. **Work receipts** bound to task, model, and layer commitments.
7. **One real Hedera x402 compute service.**
8. **One real HCS receipt.**
9. **One ENSv2 node namespace and permission check.**
10. **One Ledger Key Ring payout or treasury-protection flow.**
11. **One failure case** in which a disconnected or invalid worker is not paid.
12. **Public repository and clear setup instructions.**

### Explicit demo flow

```text
1. Open Trusted Swarm on a laptop.
2. Create an inference task.
3. Open the app on a second computer and phone.
4. Run capability onboarding.
5. Assign the desktop as a heavy worker.
6. Assign the laptop as a standard worker.
7. Assign the phone as a light verifier.
8. Resolve node identities through ENSv2.
9. Request the metered compute service.
10. Receive HTTP 402.
11. Pay through the Hedera testnet flow.
12. Execute the model inference across the swarm.
13. Verify work receipts.
14. Publish the HCS receipt.
15. Prepare worker payouts.
16. Approve a normal payout through Ledger Key Ring.
17. Attempt an over-limit payout and show it blocked.
18. Disconnect a worker and show reassignment or safe termination.
```

### Acceptance criteria

| Area | Acceptance criterion |
|---|---|
| Onboarding | Three devices receive measured roles |
| Inference | A task completes using multiple peers |
| Payment | At least one real Hedera-paid request succeeds |
| Audit | HCS receipt can be independently inspected |
| Identity | ENSv2 record affects node eligibility |
| Security | Ledger protects payout authority |
| Failure | Worker failure causes reassignment or no payout |
| Reproducibility | A new developer can run the demo from the README |

---

## 13. Build Plan

### Phase 1: Prove the existing runtime

Run the SwarmLLM repository without blockchain changes. Confirm that the selected model can run across the available laptop, desktop, and phone/browser combination.

Record:

- Join time
- Time to first token
- Tokens per second
- Memory usage
- WebRTC latency
- Worker disconnect behavior

### Phase 2: Add onboarding and capability records

Implement:

- WebGPU detection
- Memory and buffer checks
- Network calibration
- Short layer benchmark
- Worker classification
- Local capability manifest

### Phase 3: Add task coordination

Implement:

- Task IDs
- Layer assignments
- Heartbeats
- Leases
- Timeouts
- Reassignment
- Work-unit calculation

### Phase 4: Add verification

Implement:

- Model and runtime hashes
- Input/output commitments
- Signed work receipts
- Redundant verification tasks
- Payment hold until verification

### Phase 5: Add ENSv2

Implement:

- `trustedswarm.eth` namespace
- Node subnames
- Capability manifest records
- Permissioned resolver
- Revocation or expiry
- Admission check

### Phase 6: Add Hedera

Implement:

- x402-gated compute endpoint
- Blocky402 settlement
- One real paid request
- HCS work receipt
- Batch reward calculation

### Phase 7: Add Ledger

Implement:

- Key Ring namespace
- Scoped payout capability
- Automatic small-payout policy
- Large-payout approval
- Treasury withdrawal protection

### Phase 8: Polish and evidence

Prepare:

- Architecture diagram
- Public repository
- Setup guide
- Sponsor-specific README sections
- Explorer links
- Short demo video
- Failure-case recording
- Before/after distinction between SwarmLLM and Trusted Swarm work

---

## 14. Risks and Mitigations

| Risk | Consequence | Mitigation |
|---|---|---|
| Mobile browsers are unstable | Phone cannot remain a worker | Use phone as verifier/light worker; show role limits |
| WebRTC latency is too high | Inference becomes unusable | Start with local/nearby peers and small task scope |
| Workers return invalid data | Incorrect output or wasted payment | Redundancy, spot checks, commitments, no payment before verification |
| Hardware overheats | User trust and retention decline | Session limits, opt-in controls, temperature/battery guidance |
| Payout economics are weak | No sustainable contributor network | Frame first release as cooperative compute and testnet incentive |
| Blockchain integration becomes distracting | Core demo fails | Build and test non-blockchain inference first |
| Ledger integration is unavailable | Ledger track becomes ineligible | Treat Ledger as a real dependency and test early |
| ENSv2 integration is cosmetic | ENS track becomes weak | Make resolver state control node admission |
| Hedera payment is simulated | Hedera track becomes ineligible | Perform a real Blocky402-paid testnet request |
| Privacy claims are overstated | Security criticism | State peer visibility limits clearly |
| Existing repository classification is unclear | Track eligibility issue | Document pre-existing and new work with commit history |

---

## 15. Success Metrics

### Technical metrics

- Successful multi-device sessions
- Median join time
- Time to first token
- Tokens per second
- Worker reconnect rate
- Task reassignment success rate
- Invalid receipt detection rate
- Verification overhead
- Memory and battery consumption

### Network metrics

- Number of registered nodes
- Number of active nodes
- Completed work units
- Verified work percentage
- Failed task percentage
- Payout latency
- Average contribution per node

### Product metrics

- Percentage of new users who complete onboarding
- Percentage of users who join as workers
- Average session duration
- Percentage of sessions with multiple devices
- Number of real paid compute requests
- Number of independently verifiable receipts

The hackathon demo should emphasize **three devices, one completed task, one payment, one receipt, and one failure recovery**, not a large node count.

---

## 16. Final Positioning

### Recommended name

**Trusted Swarm** is the strongest working name because it communicates both the open network and the trust problem without implying a token or a generic cloud.

### Recommended pitch

> **Trusted Swarm is a web-based peer-to-peer AI compute network. Devices discover their capabilities, receive model work, and earn payment for verified inference. ENSv2 identifies nodes and controls capability records, Hedera settles metered compute and records work receipts, and Ledger protects payout authority.**

### Recommended sponsor sentence

> **Distributed inference works without blockchain, but an open network of strangers needs portable identity, machine-to-machine payment, and an auditable settlement layer. Trusted Swarm uses ENS for identity, Hedera for payment and receipts, and Ledger for secure payout control.**

### Final recommendation

Build the product as a web/PWA and keep the architecture layered:

```text
SwarmLLM runtime
  → capability-aware onboarding
  → open task coordination
  → verified work receipts
  → ENSv2 node identity
  → Hedera x402 payment and HCS audit
  → Ledger-protected payout authority
```

Do not start by building a global decentralized cloud. Start by proving that strangers’ browsers can join, receive measured roles, execute one distributed inference task, survive a worker failure, and receive a verifiable payment for completed work.

That is a real technical contribution, a defensible use of blockchain, and a coherent strategy for the Hedera, ENS, and Ledger tracks.

---

## References

[1]: https://github.com/Nehanth/swarmllm "Nehanth/swarmllm — peer-to-peer LLM inference across browser tabs"

[2]: https://ethglobal.com/events/ethonline2026/prizes "ETHGlobal ETHOnline 2026 prizes and sponsor-track requirements"

[3]: https://docs.ens.domains/ensv2/overview "ENSv2 overview"

[4]: https://docs.ens.domains/ensv2/permissioned-resolver "ENSv2 Permissioned Resolver"

[5]: https://developers.ledger.com/ethonline "Ledger ETHOnline 2026 track details"

[6]: https://hedera.com/developer-tooling/ "Hedera developer tooling"

[7]: https://github.com/hedera-dev/hedera-harness "Hedera Harness repository"

[8]: https://thegraph.com/docs/en/subgraphs/tooling/subgraph-mcp/introduction/ "The Graph Subgraph MCP"

[9]: https://bazantic.com/ "Bazantic agent gateways, MCP servers, and Recipes"

[10]: https://docs.arc.io/ "Arc documentation"

[11]: https://docs.world.org/agents/agent-kit/integrate "World AgentKit integration"

[12]: https://docs.chain.link/cre "Chainlink Runtime Environment documentation"

[13]: https://github.com/hedera-dev/hedera-harness "Hedera Harness and developer experience resources"

[14]: https://docs.ens.domains/ensv2/enhanced-access-control "ENSv2 Enhanced Access Control"

[15]: https://docs.ens.domains/ensv2/permissioned-registry "ENSv2 Permissioned Registry"

[16]: https://github.com/hedera-dev/hedera-code-snippets "Hedera code examples"

[17]: https://docs.bazantic.com/ "Bazantic documentation"

[18]: https://docs.chain.link/cre-templates/hello-confidential-workflows "Chainlink Confidential Workflows template"

[19]: https://github.com/streamingfast/substreams-chain-modules "Standardized Substreams chain modules"

[20]: https://github.com/pinax-network/substreams-evm "Pinax EVM Substreams modules"

[21]: https://github.com/worldcoin/agentkit "World AgentKit repository"

[22]: https://docs.privy.io/ "Privy documentation"

[23]: https://developers.uniswap.org/docs "Uniswap developer documentation"

[24]: https://github.com/graphprotocol/subgraphs-skills "The Graph Subgraph Skills"

[25]: https://github.com/streamingfast/substreams-skills "The Graph Substreams Skills"

[26]: https://www.1inch.com/ "1inch developer and protocol resources"

[27]: https://docs.x402.org/ "x402 protocol documentation"

[28]: https://github.com/hedera-dev/hedera-harness "Hedera Harness open-source repository"

[29]: https://github.com/Nehanth/swarmllm/blob/main/SECURITY.md "SwarmLLM security and privacy limitations"

[30]: https://github.com/Nehanth/swarmllm/blob/main/docs/architecture.md "SwarmLLM architecture documentation"

[31]: https://github.com/Nehanth/swarmllm/blob/main/docs/protocol.md "SwarmLLM protocol documentation"

[32]: https://github.com/Nehanth/swarmllm/blob/main/docs/bench-log.md "SwarmLLM benchmark log"

[33]: https://docs.hedera.com/hedera/core-concepts/consensus "Hedera Consensus Service concepts"

[34]: https://docs.hedera.com/hedera/core-concepts/tokens "Hedera Token Service concepts"

[35]: https://github.com/hedera-dev/hedera-harness "Hedera Harness — official repository"

[36]: https://docs.ens.domains/ensv2/tutorial-contract-developers "ENSv2 contract developer guide"

[37]: https://docs.ens.domains/building-with-ai/ "ENS building with AI resources"

[38]: https://github.com/ensdomains/ens-cli "ENS agent-native CLI"

[39]: https://developers.ledger.com/docs/ledger-agent-stack "Ledger Agent Stack documentation"

[40]: https://hedera.com/ "Hedera official website"

[41]: https://thegraph.com/ "The Graph official website"

[42]: https://ens.domains/ "ENS official website"

[43]: https://ledger.com/ "Ledger official website"

[44]: https://github.com/Nehanth/swarmllm/releases "SwarmLLM releases and demo artifacts"

[45]: https://github.com/Nehanth/swarmllm/blob/main/LICENSE "SwarmLLM license"

[46]: https://github.com/Nehanth/swarmllm/blob/main/CONTRIBUTING.md "SwarmLLM contribution guide"

[47]: https://docs.hedera.com/hedera/getting-started-sdk-developers "Hedera SDK getting started guide"

[48]: https://hedera.com/developer-tooling/ "Hedera developer tooling"

[49]: https://github.com/hashgraph/asset-tokenization-studio "Hedera Asset Tokenization Studio"

[50]: https://github.com/circlefin/agent-stack-starter-kits "Circle Agent Stack starter kits"

[51]: https://github.com/privy-io "Privy GitHub organization"

[52]: https://github.com/smartcontractkit/cre-templates/tree/main/starter-templates/confidential-workflows "Chainlink Confidential Workflow starter templates"

[53]: https://github.com/hedera-dev/hedera-skills "Hedera skills repository"

[54]: https://docs.ens.domains/ensv2/ "ENSv2 documentation"

[55]: https://docs.bazantic.com/ "Bazantic documentation"

[56]: https://docs.x402.org/ "x402 protocol documentation"

[57]: https://github.com/Nehanth/swarmllm/tree/main/engine "SwarmLLM inference engine"

[58]: https://github.com/Nehanth/swarmllm/tree/main/room "SwarmLLM browser room runtime"

[59]: https://github.com/Nehanth/swarmllm/tree/main/tests "SwarmLLM tests"

[60]: https://github.com/Nehanth/swarmllm/tree/main/roadmap "SwarmLLM roadmap"

[61]: https://github.com/Nehanth/swarmllm/blob/main/docs/models.md "SwarmLLM supported models"

[62]: https://github.com/Nehanth/swarmllm/blob/main/docs/kernels.md "SwarmLLM WebGPU kernels"

[63]: https://github.com/Nehanth/swarmllm/blob/main/docs/research.md "SwarmLLM research notes"

[64]: https://github.com/Nehanth/swarmllm/blob/main/docs/threat-model.md "SwarmLLM threat model, where available"

[65]: https://github.com/Nehanth/swarmllm/blob/main/SECURITY.md "SwarmLLM security policy"

[66]: https://github.com/Nehanth/swarmllm/blob/main/room.js "SwarmLLM room runtime"

[67]: https://github.com/Nehanth/swarmllm/blob/main/package.json "SwarmLLM package configuration"

[68]: https://ethglobal.com/events/ethonline2026/check-in "ETHOnline 2026 project check-in"
