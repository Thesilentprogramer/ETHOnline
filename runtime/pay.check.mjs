import assert from "node:assert/strict";
import {
  payConfig,
  paymentRequirements,
  x402Challenge,
  parsePaymentHeader,
  splitCredits,
  makeReceipt,
  hashscanTx,
  hashscanTopic,
} from "./pay.js";

assert.equal(payConfig({}), null);
const cfg = payConfig({ HEDERA_ACCOUNT_ID: "0.0.8011510", X402_PRICE_HBAR: "0.001", HOST_CUT_BPS: "1000" });
assert.equal(cfg.accountId, "0.0.8011510");
assert.equal(cfg.amountTinybar, 100000);
assert.equal(cfg.hostCutBps, 1000);

const req = paymentRequirements(cfg, "0.0.7162784");
assert.equal(req.scheme, "exact");
assert.equal(req.network, "hedera:testnet");
assert.equal(req.amount, "100000");
assert.equal(req.extra.feePayer, "0.0.7162784");

const body = x402Challenge(req);
assert.equal(body.x402Version, 2);
assert.equal(body.accepts[0].payTo, "0.0.8011510");

const payload = { x402Version: 2, scheme: "exact", network: "hedera:testnet", payload: { transaction: "abc" } };
const hdr = Buffer.from(JSON.stringify(payload)).toString("base64");
assert.equal(parsePaymentHeader(hdr).scheme, "exact");
assert.equal(parsePaymentHeader("nope"), null);
assert.equal(parsePaymentHeader(""), null);

const solo = splitCredits(100000, 1000, [{ id: "h1", gb: 8, host: true }]);
assert.equal(solo.length, 1);
assert.equal(solo[0].tinybar, 100000);
assert.equal(solo[0].role, "host");
assert.equal(solo[0].ens, "");

const named = splitCredits(100000, 1000, [{ id: "h1", gb: 8, host: true, ens: "coordinator.trustedswarm.eth" }]);
assert.equal(named[0].ens, "coordinator.trustedswarm.eth");

const withZeroWorker = splitCredits(100000, 1000, [
  { id: "h1", gb: 8, host: true },
  { id: "obs", gb: 0, host: false },
]);
assert.equal(withZeroWorker[0].tinybar, 100000);

const split = splitCredits(100000, 1000, [
  { id: "h1", gb: 8, host: true },
  { id: "w1", gb: 2, host: false },
  { id: "w2", gb: 6, host: false },
]);
assert.equal(split[0].role, "host");
assert.equal(split[0].tinybar, 10000);
assert.equal(split[1].id, "w1");
assert.equal(split[1].tinybar, 22500);
assert.equal(split[2].tinybar, 67500);
assert.equal(split.reduce((s, c) => s + c.tinybar, 0), 100000);

const fail = makeReceipt({
  jobId: "j1",
  model: "qwen3-0.6b",
  status: "failed",
  amountTinybar: 100000,
  credits: split,
  network: "hedera:testnet",
  topicId: "0.0.1",
  payTx: "0.0.2@1",
});
assert.equal(fail.credits.length, 0);
assert.ok(fail.payScan.includes("hashscan.io/testnet/transaction"));
assert.equal(hashscanTopic("hedera:testnet", "0.0.99"), "https://hashscan.io/testnet/topic/0.0.99");
assert.equal(hashscanTx("hedera:mainnet", "x"), "https://hashscan.io/mainnet/transaction/x");

console.log("pay split ok");
