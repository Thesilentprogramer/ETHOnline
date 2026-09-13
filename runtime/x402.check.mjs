import assert from "node:assert/strict";
import { loadFeePayer, settlePayment } from "./x402.js";

async function loadOk() {
  return {
    ok: true,
    async json() {
      return {
        kinds: [{ scheme: "exact", network: "hedera:testnet", extra: { feePayer: "0.0.9" } }],
      };
    },
  };
}
assert.equal(await loadFeePayer("http://f", "hedera:testnet", loadOk), "0.0.9");

const calls = [];
async function fakeFetch(url, opts) {
  calls.push(url);
  if (String(url).endsWith("/verify")) {
    return { ok: true, async json() { return { isValid: true, payer: "0.0.1" }; } };
  }
  if (String(url).endsWith("/settle")) {
    assert.ok(opts.body.includes("paymentPayload"));
    return { ok: true, async json() { return { success: true, transaction: "0.0.2@1", payer: "0.0.1" }; } };
  }
  throw new Error("unexpected " + url);
}

const ok = await settlePayment({
  facilitator: "http://f",
  requirements: { scheme: "exact" },
  paymentPayload: { x402Version: 2 },
  fetchFn: fakeFetch,
});
assert.equal(ok.ok, true);
assert.equal(ok.transaction, "0.0.2@1");
assert.deepEqual(calls, ["http://f/verify", "http://f/settle"]);

const bad = await settlePayment({
  facilitator: "http://f",
  requirements: {},
  paymentPayload: {},
  fetchFn: async () => ({ ok: true, async json() { return { isValid: false, invalidReason: "nope" }; } }),
});
assert.equal(bad.ok, false);
assert.equal(bad.error, "nope");

console.log("x402 facilitator ok");
