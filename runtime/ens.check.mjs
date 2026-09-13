import assert from "node:assert/strict";
import { ensConfig, normalizeEns, underParent, isAccountId, readHederaText } from "./ens.js";

assert.equal(ensConfig({}).parent, "trustedswarm.eth");
assert.equal(ensConfig({ ENS_PARENT: "demo.eth" }).parent, "demo.eth");
assert.equal(normalizeEns(" Coordinator.TrustedSwarm.eth. "), "coordinator.trustedswarm.eth");
assert.equal(underParent("coordinator.trustedswarm.eth", "trustedswarm.eth"), true);
assert.equal(underParent("trustedswarm.eth", "trustedswarm.eth"), true);
assert.equal(underParent("node-01.trustedswarm.eth", "trustedswarm.eth"), true);
assert.equal(underParent("alice.eth", "trustedswarm.eth"), false);
assert.equal(underParent("trustedswarm.eth.evil.eth", "trustedswarm.eth"), false);
assert.equal(isAccountId("0.0.10499107"), true);
assert.equal(isAccountId("0xabc"), false);

const cfg = ensConfig({ ENS_PARENT: "trustedswarm.eth" });
const host = await readHederaText("coordinator.trustedswarm.eth", cfg, async () => "0.0.10499107");
assert.equal(host.ok, true);
assert.equal(host.account, "0.0.10499107");

const badParent = await readHederaText("alice.eth", cfg, async () => "0.0.1");
assert.equal(badParent.ok, false);

const empty = await readHederaText("node-01.trustedswarm.eth", cfg, async () => null);
assert.equal(empty.ok, false);

const boom = await readHederaText("node-01.trustedswarm.eth", cfg, async () => { throw new Error("rpc down"); });
assert.equal(boom.ok, false);
assert.equal(boom.error, "rpc down");

console.log("ens resolve ok");
