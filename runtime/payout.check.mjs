import assert from "node:assert/strict";
import { payoutDecision, settleCredits, AUTO_TINYBAR, DAILY_TINYBAR } from "./payout.js";

assert.equal(payoutDecision({ tinybar: 100000, account: "0.0.1", operator: "0.0.1" }).action, "skip");
assert.equal(payoutDecision({ tinybar: 100000, account: "0.0.2", operator: "0.0.1" }).action, "auto");
assert.equal(payoutDecision({ tinybar: AUTO_TINYBAR + 1, account: "0.0.2", operator: "0.0.1" }).action, "approve");
assert.equal(payoutDecision({ tinybar: 100000, account: "0.0.2", operator: "0.0.1", daySpent: DAILY_TINYBAR }).action, "block");
assert.equal(payoutDecision({ tinybar: 1, account: "", operator: "0.0.1" }).action, "block");

const calls = [];
const out = await settleCredits({
  credits: [
    { id: "h", role: "host", account: "0.0.1", tinybar: 90000 },
    { id: "w", role: "worker", account: "0.0.2", tinybar: 10000 },
    { id: "big", role: "worker", account: "0.0.3", tinybar: AUTO_TINYBAR + 5 },
  ],
  operator: "0.0.1",
  privateKey: "k",
  autoMax: AUTO_TINYBAR,
  dailyMax: DAILY_TINYBAR,
  daySpent: 0,
  transfer: async (a) => { calls.push(a.to); return { ok: true, transactionId: "0.0.1@1" }; },
});
assert.equal(out.payouts[0].action, "skip");
assert.equal(out.payouts[1].action, "auto");
assert.equal(out.payouts[1].tx, "0.0.1@1");
assert.equal(out.payouts[2].action, "approve");
assert.deepEqual(calls, ["0.0.2"]);
assert.equal(out.spent, 10000);

console.log("payout policy ok");
