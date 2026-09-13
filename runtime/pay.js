// x402 v2 helpers + credit split. No network. Tinybars are integers.

const TINYBAR = 100_000_000;

export function payConfig(env = process.env) {
  const accountId = String(env.HEDERA_ACCOUNT_ID || "").trim();
  if (!accountId) return null;
  const hbar = Number(env.X402_PRICE_HBAR || "0.001");
  const amountTinybar = Math.max(1, Math.round((Number.isFinite(hbar) ? hbar : 0.001) * TINYBAR));
  const hostCutBps = Math.min(10_000, Math.max(0, Number(env.HOST_CUT_BPS || "1000") || 0));
  return {
    accountId,
    privateKey: String(env.HEDERA_PRIVATE_KEY || "").trim(),
    topicId: String(env.HCS_TOPIC_ID || "").trim(),
    facilitator: String(env.X402_FACILITATOR || "https://api.testnet.blocky402.com").replace(/\/$/, ""),
    network: String(env.HEDERA_NETWORK || "hedera:testnet"),
    amountTinybar,
    hostCutBps,
  };
}

export function paymentRequirements(cfg, feePayer = "") {
  const extra = feePayer ? { feePayer } : {};
  return {
    scheme: "exact",
    network: cfg.network,
    amount: String(cfg.amountTinybar),
    payTo: cfg.accountId,
    maxTimeoutSeconds: 300,
    asset: "0.0.0",
    extra,
  };
}

export function x402Challenge(requirements) {
  return {
    x402Version: 2,
    error: "X-PAYMENT header required",
    accepts: [requirements],
  };
}

export function parsePaymentHeader(header) {
  if (!header || typeof header !== "string") return null;
  try {
    const json = Buffer.from(header.trim(), "base64").toString("utf8");
    const obj = JSON.parse(json);
    if (!obj || obj.x402Version !== 2) return null;
    return obj;
  } catch {
    return null;
  }
}

export function hashscanNetwork(network) {
  return String(network || "").includes("mainnet") ? "mainnet" : "testnet";
}

export function hashscanTx(network, tx) {
  if (!tx) return "";
  return `https://hashscan.io/${hashscanNetwork(network)}/transaction/${encodeURIComponent(tx)}`;
}

export function hashscanTopic(network, topicId) {
  if (!topicId) return "";
  return `https://hashscan.io/${hashscanNetwork(network)}/topic/${topicId}`;
}

/**
 * peers: { id, gb, host?, observer? }[]
 * Solo (no other device with gb > 0) → 100% host.
 * Else host cut in bps, remainder to non-host workers by pledged GB. observer / 0 GB skipped.
 */
export function splitCredits(amountTinybar, hostCutBps, peers) {
  const amount = Math.max(0, Math.floor(Number(amountTinybar) || 0));
  const list = Array.isArray(peers) ? peers : [];
  const host = list.find((p) => p.host) || list[0] || { id: "host", gb: 0, host: true };
  const workers = list.filter((p) => !p.host && !p.observer && Number(p.gb) > 0);
  if (amount === 0) return [];
  if (workers.length === 0) {
    return [{ id: String(host.id || "host"), role: "host", gb: Number(host.gb) || 0, tinybar: amount, ens: String(host.ens || ""), account: String(host.account || "") }];
  }
  const bps = Math.min(10_000, Math.max(0, Math.floor(Number(hostCutBps) || 0)));
  const cut = Math.floor((amount * bps) / 10_000);
  const rest = amount - cut;
  const totalGb = workers.reduce((s, p) => s + Number(p.gb), 0);
  const credits = [{ id: String(host.id || "host"), role: "host", gb: Number(host.gb) || 0, tinybar: cut, ens: String(host.ens || ""), account: String(host.account || "") }];
  let used = 0;
  workers.forEach((p, i) => {
    const last = i === workers.length - 1;
    const share = last ? rest - used : Math.floor((rest * Number(p.gb)) / totalGb);
    used += share;
    credits.push({ id: String(p.id), role: "worker", gb: Number(p.gb), tinybar: share, ens: String(p.ens || ""), account: String(p.account || "") });
  });
  return credits;
}

export function makeReceipt({
  jobId,
  model,
  status,
  payer,
  payTo,
  amountTinybar,
  payTx,
  network,
  topicId,
  hcsTx,
  credits,
  payouts,
}) {
  const failed = status !== "done";
  return {
    jobId,
    model,
    status: failed ? "failed" : "done",
    payer: payer || "",
    payTo: payTo || "",
    amountTinybar,
    payTx: payTx || "",
    payScan: hashscanTx(network, payTx),
    topicId: topicId || "",
    hcsTx: hcsTx || "",
    hcsScan: hashscanTopic(network, topicId),
    credits: failed ? [] : credits || [],
    payouts: failed ? [] : payouts || [],
  };
}
