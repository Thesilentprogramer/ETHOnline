import assert from "node:assert/strict";
import {
  encodeFrame,
  decodeFrames,
  toCompletion,
  toChunk,
  checkAuth,
  corsOrigin,
  completionId,
} from "./serve.mjs";

const payload = Buffer.from('{"hello":"world"}');
const frame = encodeFrame(0x1, payload);
const round = decodeFrames(frame);
assert.equal(round.messages.length, 1);
assert.equal(round.messages[0], '{"hello":"world"}');
assert.equal(round.rest.length, 0);

const key = Buffer.from([1, 2, 3, 4]);
const maskedPay = Buffer.alloc(payload.length);
for (let i = 0; i < payload.length; i++) maskedPay[i] = payload[i] ^ key[i & 3];
const masked = Buffer.concat([Buffer.from([0x81, 0x80 | payload.length]), key, maskedPay]);
const m = decodeFrames(masked);
assert.equal(m.messages[0], '{"hello":"world"}');

const long = Buffer.alloc(200, 97);
const lf = encodeFrame(0x1, long);
assert.equal(decodeFrames(lf).messages[0].length, 200);

assert.equal(checkAuth("Bearer secret", "secret"), true);
assert.equal(checkAuth("Bearer nope", "secret"), false);
assert.equal(corsOrigin("http://127.0.0.1:5180"), "http://127.0.0.1:5180");
assert.equal(corsOrigin("https://evil.example"), "");

const id = completionId();
assert.ok(id.startsWith("chatcmpl-"));
assert.equal(toCompletion(id, "qwen3-0.6b", "ok").choices[0].message.content, "ok");
assert.equal(toChunk(id, "qwen3-0.6b", "x").choices[0].delta.content, "x");
assert.equal(toChunk(id, "qwen3-0.6b", "", true).choices[0].finish_reason, "stop");
console.log("serve bridge ok");
