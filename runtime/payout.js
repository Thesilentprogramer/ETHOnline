// Credits → HBAR via Hedera SDK. Over-cap stays approve (no send).

export const AUTO_TINYBAR = 10_000_000; // 0.10 ℏ
export const DAILY_TINYBAR = 1_000_000_000; // 10 ℏ

export function payoutDecision({ tinybar, account, operator, autoMax = AUTO_TINYBAR, dailyMax = DAILY_TINYBAR, daySpent = 0 }) {
  const amt = Math.max(0, Math.floor(Number(tinybar) || 0));
  const to = String(account || "").trim();
  const from = String(operator || "").trim();
  if (!to) return { action: "block", reason: "no hedera account" };
  if (to === from) return { action: "skip", reason: "operator already received x402" };
  if (amt > autoMax) return { action: "approve", reason: "over auto cap" };
  if (daySpent + amt > dailyMax) return { action: "block", reason: "daily cap" };
  return { action: "auto" };
}

export async function transferHbar({ from, to, tinybar, privateKey, network }) {
  const sdk = await import("@hiero-ledger/sdk").catch(() => import("@hashgraph/sdk"));
  const { Client, TransferTransaction, PrivateKey, AccountId, Hbar } = sdk;
  const client = String(network || "").includes("mainnet") ? Client.forMainnet() : Client.forTestnet();
  const key = privateKey.startsWith("0x") || /^[0-9a-fA-F]{64}$/.test(privateKey)
    ? PrivateKey.fromStringECDSA(privateKey.replace(/^0x/, ""))
    : PrivateKey.fromString(privateKey);
  client.setOperator(AccountId.fromString(from), key);
  try {
    const tx = await new TransferTransaction()
      .addHbarTransfer(from, Hbar.fromTinybars(-tinybar))
      .addHbarTransfer(to, Hbar.fromTinybars(tinybar))
      .execute(client);
    const rec = await tx.getReceipt(client);
    return { ok: rec.status?.toString() === "SUCCESS", transactionId: tx.transactionId?.toString() || "" };
  } finally {
    try { client.close(); } catch {}
  }
}

export async function settleCredits({ credits, operator, privateKey, network, autoMax, dailyMax, daySpent, transfer }) {
  const send = transfer || transferHbar;
  let spent = daySpent || 0;
  const payouts = [];
  for (const c of credits || []) {
    const d = payoutDecision({
      tinybar: c.tinybar,
      account: c.account,
      operator,
      autoMax,
      dailyMax,
      daySpent: spent,
    });
    const row = { id: c.id, role: c.role, account: c.account || "", tinybar: c.tinybar, ...d, tx: "" };
    if (d.action === "auto" && privateKey) {
      try {
        const r = await send({ from: operator, to: c.account, tinybar: c.tinybar, privateKey, network });
        row.ok = r.ok;
        row.tx = r.transactionId || "";
        if (r.ok) spent += c.tinybar;
        else { row.action = "block"; row.reason = "transfer failed"; }
      } catch (e) {
        row.action = "block";
        row.reason = e instanceof Error ? e.message : "transfer failed";
      }
    }
    payouts.push(row);
  }
  return { payouts, spent };
}
