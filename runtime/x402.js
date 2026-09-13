// Blocky402 facilitator: verify + settle an x402 v2 PaymentPayload (HTTP only).

export async function loadFeePayer(facilitator, network, fetchFn = fetch) {
  try {
    const r = await fetchFn(`${facilitator}/supported`);
    if (!r.ok) return "";
    const s = await r.json();
    const kind = (s.kinds || []).find((k) => k.network === network);
    return kind?.extra?.feePayer || s.signers?.["hedera:*"]?.[0] || "";
  } catch {
    return "";
  }
}

export async function settlePayment({ facilitator, requirements, paymentPayload, fetchFn = fetch }) {
  const body = JSON.stringify({
    x402Version: 2,
    paymentPayload,
    paymentRequirements: requirements,
  });
  const headers = { "content-type": "application/json" };
  let v;
  try {
    const vr = await fetchFn(`${facilitator}/verify`, { method: "POST", headers, body });
    v = await vr.json();
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "verify failed" };
  }
  if (!v?.isValid) return { ok: false, error: v?.invalidMessage || v?.invalidReason || "invalid payment" };
  let s;
  try {
    const sr = await fetchFn(`${facilitator}/settle`, { method: "POST", headers, body });
    s = await sr.json();
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "settle failed" };
  }
  if (!s?.success) return { ok: false, error: s?.errorMessage || s?.errorReason || "settle failed" };
  return { ok: true, payer: s.payer || v.payer || "", transaction: s.transaction || "" };
}
