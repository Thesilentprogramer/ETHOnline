#!/usr/bin/env node
// Local OpenAI-compatible bridge. The host tab connects out to /bridge;
// curl and other clients POST /v1/chat/completions. Hedera x402 is env-gated.
import http from "node:http";
import crypto from "node:crypto";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { loadDotenv } from "./env.js";
import { MODELS } from "./room/models.js";
import {
  payConfig,
  paymentRequirements,
  x402Challenge,
  parsePaymentHeader,
  splitCredits,
  makeReceipt,
} from "./pay.js";
import { loadFeePayer, settlePayment } from "./x402.js";
import { submitTopicMessage } from "./hcs.mjs";
import { ensConfig, readHederaText, sepoliaGetText } from "./ens.js";
import { loadSigningKey, settleCredits, AUTO_TINYBAR, DAILY_TINYBAR } from "./payout.js";

loadDotenv();

const GUID = "258EAFA5-E914-47DA-95CA-C5AB0DC85B11";
const HOST = "127.0.0.1";
const PORT = Number(process.env.PORT || 11435);
const TOKEN = process.env.OPENAI_API_KEY || crypto.randomBytes(24).toString("hex");
const ALPH = "ABCDEFGHJKMNPQRSTVWXYZ23456789";

export function completionId() {
  const b = crypto.randomBytes(12);
  return "chatcmpl-" + [...b].map((n) => ALPH[n % ALPH.length]).join("");
}

export function toCompletion(id, model, content) {
  return {
    id,
    object: "chat.completion",
    created: Math.floor(Date.now() / 1000),
    model,
    choices: [{ index: 0, message: { role: "assistant", content }, finish_reason: "stop" }],
  };
}

export function toChunk(id, model, delta, done = false) {
  return {
    id,
    object: "chat.completion.chunk",
    created: Math.floor(Date.now() / 1000),
    model,
    choices: [{ index: 0, delta: done ? {} : { content: delta }, finish_reason: done ? "stop" : null }],
  };
}

export function checkAuth(header, token = TOKEN) {
  const h = header || "";
  const tok = h.startsWith("Bearer ") ? h.slice(7).trim() : "";
  return tok === token;
}

export function corsOrigin(origin) {
  return /^https?:\/\/(127\.0\.0\.1|localhost)(:\d+)?$/.test(origin || "") ? origin : "";
}

export function encodeFrame(opcode, payload) {
  const len = payload.length;
  let header;
  if (len < 126) {
    header = Buffer.alloc(2);
    header[0] = 0x80 | opcode;
    header[1] = len;
  } else if (len < 65536) {
    header = Buffer.alloc(4);
    header[0] = 0x80 | opcode;
    header[1] = 126;
    header.writeUInt16BE(len, 2);
  } else {
    header = Buffer.alloc(10);
    header[0] = 0x80 | opcode;
    header[1] = 127;
    header.writeBigUInt64BE(BigInt(len), 2);
  }
  return Buffer.concat([header, payload]);
}

export function decodeFrames(buf) {
  const messages = [];
  const controls = [];
  let i = 0;
  while (i + 2 <= buf.length) {
    const b0 = buf[i], b1 = buf[i + 1];
    const opcode = b0 & 0x0f;
    const masked = !!(b1 & 0x80);
    let len = b1 & 0x7f, h = 2;
    if (len === 126) {
      if (i + 4 > buf.length) break;
      len = buf.readUInt16BE(i + 2); h = 4;
    } else if (len === 127) {
      if (i + 10 > buf.length) break;
      const big = buf.readBigUInt64BE(i + 2);
      if (big > 0x100000n) return { messages, controls, rest: Buffer.alloc(0), overflow: true };
      len = Number(big); h = 10;
    }
    const mask = masked ? 4 : 0;
    if (i + h + mask + len > buf.length) break;
    let payload = buf.subarray(i + h + mask, i + h + mask + len);
    if (masked) {
      const k = buf.subarray(i + h, i + h + 4);
      const out = Buffer.alloc(len);
      for (let p = 0; p < len; p++) out[p] = payload[p] ^ k[p & 3];
      payload = out;
    }
    i += h + mask + len;
    if (opcode === 0x1) messages.push(payload.toString("utf8"));
    else if (opcode === 0x8 || opcode === 0x9 || opcode === 0xa) controls.push({ opcode, payload });
  }
  return { messages, controls, rest: buf.subarray(i) };
}

const isMain = fileURLToPath(import.meta.url) === path.resolve(process.argv[1] || "");
if (isMain) listen();

function listen() {
  let hostSock = null;
  let hostEns = "";
  const pending = new Map();
  const cfg = payConfig();
  const ens = cfg ? ensConfig() : null;
  let feePayer = "";
  let signingKey = cfg?.privateKey || "";
  let daySpent = 0;
  if (cfg) {
    loadFeePayer(cfg.facilitator, cfg.network).then((id) => { feePayer = id; }).catch(() => {});
    loadSigningKey().then((k) => { if (k) signingKey = k; }).catch((e) => {
      console.log(`  ledger ring: ${e instanceof Error ? e.message : "decrypt failed"}`);
    });
  }

  function sendHost(obj) {
    if (!hostSock) return false;
    hostSock.write(encodeFrame(0x1, Buffer.from(JSON.stringify(obj))));
    return true;
  }

  function failPending(message) {
    for (const [id, p] of pending) finish(p, { id, error: message });
    pending.clear();
  }

  function finish(p, { id, content = "", error = null }) {
    if (p.done) return;
    p.done = true;
    if (p.stream) {
      if (error) p.res.write(`data: ${JSON.stringify({ error: { message: error, type: "server_error" } })}\n\n`);
      else p.res.write(`data: ${JSON.stringify(toChunk(id, p.model, "", true))}\n\n`);
      p.res.write("data: [DONE]\n\n");
      p.res.end();
      return;
    }
    if (error) {
      p.res.writeHead(502, jsonHead(p.origin));
      p.res.end(JSON.stringify({ error: { message: error, type: "server_error" } }));
      return;
    }
    p.res.writeHead(200, jsonHead(p.origin));
    p.res.end(JSON.stringify(toCompletion(id, p.model, content)));
  }

  function jsonHead(origin) {
    const h = { "content-type": "application/json", "cache-control": "no-store" };
    const allow = corsOrigin(origin);
    if (allow) {
      h["access-control-allow-origin"] = allow;
      h["access-control-allow-headers"] = "authorization, content-type, x-payment, payment-signature";
      h["access-control-allow-methods"] = "GET, POST, OPTIONS";
      h["access-control-expose-headers"] = "payment-required";
    }
    return h;
  }

  function requirements() {
    return paymentRequirements(cfg, feePayer);
  }

  function write402(res, origin, extra = {}) {
    const challenge = { ...x402Challenge(requirements()), ...extra };
    const encoded = Buffer.from(JSON.stringify({ x402Version: 2, accepts: challenge.accepts })).toString("base64");
    res.writeHead(402, { ...jsonHead(origin), "payment-required": encoded });
    res.end(JSON.stringify(challenge));
  }

  async function assertHostIdentity() {
    if (!hostEns) throw new Error("host ens required");
    const got = await readHederaText(hostEns, ens, sepoliaGetText);
    if (!got.ok || got.account !== cfg.accountId) {
      throw new Error(got.ok ? "hedera text does not match payTo" : got.error);
    }
  }

  async function eligiblePeers(cluster) {
    const list = Array.isArray(cluster) ? cluster : [];
    const out = [];
    for (const p of list) {
      if (p.host) { out.push({ ...p, account: cfg.accountId }); continue; }
      if (p.observer || !(Number(p.gb) > 0)) continue;
      const got = await readHederaText(p.ens, ens, sepoliaGetText);
      if (got.ok) out.push({ ...p, account: got.account });
    }
    return out;
  }

  async function gatePay(req, res, origin) {
    if (!cfg) return { paid: null };
    const raw = req.headers["x-payment"] || req.headers["payment-signature"] || "";
    const payload = parsePaymentHeader(raw);
    if (!payload) {
      write402(res, origin);
      return { paid: false };
    }
    if (!hostSock) {
      res.writeHead(503, jsonHead(origin));
      res.end(JSON.stringify({ error: { message: "host tab not connected. Open /market and keep it open.", type: "server_error" } }));
      return { paid: false };
    }
    try {
      await assertHostIdentity();
    } catch (e) {
      res.writeHead(403, jsonHead(origin));
      res.end(JSON.stringify({ error: { message: e instanceof Error ? e.message : "invalid ens", type: "identity_error" } }));
      return { paid: false };
    }
    const settled = await settlePayment({
      facilitator: cfg.facilitator,
      requirements: requirements(),
      paymentPayload: payload,
    });
    if (!settled.ok) {
      write402(res, origin, { error: settled.error });
      return { paid: false };
    }
    return { paid: { payer: settled.payer, payTx: settled.transaction } };
  }

  async function finalizePaid(p, { id, error, cluster }) {
    const status = error ? "failed" : "done";
    const peers = await eligiblePeers(cluster);
    const credits = splitCredits(cfg.amountTinybar, cfg.hostCutBps, peers);
    let payouts = [];
    if (status === "done" && signingKey) {
      try {
        const out = await settleCredits({
          credits,
          operator: cfg.accountId,
          privateKey: signingKey,
          network: cfg.network,
          autoMax: AUTO_TINYBAR,
          dailyMax: DAILY_TINYBAR,
          daySpent,
        });
        payouts = out.payouts;
        daySpent = out.spent;
      } catch {}
    }
    let hcsTx = "";
    const draft = makeReceipt({
      jobId: id,
      model: p.model,
      status,
      payer: p.paid.payer,
      payTo: cfg.accountId,
      amountTinybar: cfg.amountTinybar,
      payTx: p.paid.payTx,
      network: cfg.network,
      topicId: cfg.topicId,
      credits,
      payouts,
    });
    if (cfg.topicId && signingKey) {
      const submitted = await submitTopicMessage({
        topicId: cfg.topicId,
        accountId: cfg.accountId,
        privateKey: signingKey,
        message: draft,
        network: cfg.network,
      });
      hcsTx = submitted.transactionId || "";
    }
    const receipt = makeReceipt({ ...draft, hcsTx, status, credits: draft.credits, payouts: draft.payouts });
    sendHost({ t: "receipt", id, receipt });
  }

  const server = http.createServer(async (req, res) => {
    const url = new URL(req.url || "/", `http://${HOST}`);
    const origin = req.headers.origin || "";
    if (req.method === "OPTIONS") {
      res.writeHead(204, jsonHead(origin));
      res.end();
      return;
    }
    if (url.pathname === "/v1/models" && req.method === "GET") {
      if (!checkAuth(req.headers.authorization)) return deny(res, origin);
      res.writeHead(200, jsonHead(origin));
      res.end(JSON.stringify({
        object: "list",
        data: Object.keys(MODELS).map((id) => ({ id, object: "model", owned_by: "trusted-swarm" })),
      }));
      return;
    }
    if (url.pathname === "/v1/chat/completions" && req.method === "POST") {
      if (!checkAuth(req.headers.authorization)) return deny(res, origin);
      const raw = await readBody(req, 1_000_000);
      let body;
      try { body = JSON.parse(raw || "{}"); } catch {
        res.writeHead(400, jsonHead(origin));
        res.end(JSON.stringify({ error: { message: "invalid json", type: "invalid_request_error" } }));
        return;
      }
      if (!Array.isArray(body.messages)) {
        res.writeHead(400, jsonHead(origin));
        res.end(JSON.stringify({ error: { message: "messages required", type: "invalid_request_error" } }));
        return;
      }
      const gated = await gatePay(req, res, origin);
      if (gated.paid === false) return;
      if (!hostSock) {
        res.writeHead(503, jsonHead(origin));
        res.end(JSON.stringify({ error: { message: "host tab not connected. Open /market and keep it open.", type: "server_error" } }));
        return;
      }
      const id = typeof body.id === "string" ? body.id : completionId();
      const model = String(body.model || "qwen3-0.6b");
      const stream = !!body.stream;
      if (stream) {
        res.writeHead(200, {
          ...jsonHead(origin),
          "content-type": "text/event-stream",
          "connection": "keep-alive",
        });
        res.write(`data: ${JSON.stringify({ ...toChunk(id, model, ""), choices: [{ index: 0, delta: { role: "assistant" }, finish_reason: null }] })}\n\n`);
      }
      pending.set(id, { res, stream, model, origin, done: false, paid: gated.paid });
      sendHost({ t: "completion", id, model, messages: body.messages, stream, paid: !!gated.paid });
      return;
    }
    if (url.pathname === "/" && req.method === "GET") {
      res.writeHead(200, { "content-type": "text/plain" });
      res.end("Trusted Swarm local API. POST /v1/chat/completions\n");
      return;
    }
    res.writeHead(404, jsonHead(origin));
    res.end(JSON.stringify({ error: { message: "not found", type: "invalid_request_error" } }));
  });

  server.on("upgrade", (req, socket) => {
    if ((req.url || "").split("?")[0] !== "/bridge") { socket.destroy(); return; }
    const key = req.headers["sec-websocket-key"];
    if (!key) { socket.destroy(); return; }
    const accept = crypto.createHash("sha1").update(key + GUID).digest("base64");
    socket.write(
      "HTTP/1.1 101 Switching Protocols\r\nUpgrade: websocket\r\nConnection: Upgrade\r\n" +
      `Sec-WebSocket-Accept: ${accept}\r\n\r\n`,
    );
    if (hostSock && hostSock !== socket) { try { hostSock.destroy(); } catch {} }
    hostSock = socket;
    hostEns = "";
    let buf = Buffer.alloc(0);
    socket.on("data", (chunk) => {
      buf = Buffer.concat([buf, chunk]);
      const { messages, controls, rest, overflow } = decodeFrames(buf);
      buf = rest;
      if (overflow) { socket.destroy(); return; }
      for (const c of controls) {
        if (c.opcode === 0x9) socket.write(encodeFrame(0xa, c.payload));
        if (c.opcode === 0x8) socket.end();
      }
      for (const text of messages) {
        let d;
        try { d = JSON.parse(text); } catch { continue; }
        if (d.t === "ens") { hostEns = String(d.ens || "").trim(); continue; }
        const p = pending.get(d.id);
        if (!p) continue;
        if (d.t === "delta" && p.stream && d.content) {
          p.res.write(`data: ${JSON.stringify(toChunk(d.id, p.model, d.content))}\n\n`);
        }
        if (d.t === "done") {
          pending.delete(d.id);
          void (async () => {
            if (p.paid && cfg) {
              try { await finalizePaid(p, { id: d.id, error: d.error || null, cluster: d.cluster || [] }); }
              catch {}
            }
            finish(p, { id: d.id, content: d.content || "", error: d.error || null });
          })();
        }
      }
    });
    socket.on("close", () => {
      if (hostSock === socket) { hostSock = null; hostEns = ""; failPending("host tab disconnected"); }
    });
    socket.on("error", () => socket.destroy());
  });

  server.listen(PORT, HOST, () => {
    console.log(`Trusted Swarm local API`);
    console.log(`  POST http://${HOST}:${PORT}/v1/chat/completions`);
    console.log(process.env.OPENAI_API_KEY
      ? `  Authorization: Bearer $OPENAI_API_KEY`
      : `  export OPENAI_API_KEY=${TOKEN}`);
    console.log(`  Keep the host tab open — it connects to ws://${HOST}:${PORT}/bridge`);
    if (cfg) {
      console.log(`  x402 ${cfg.network} · ${cfg.amountTinybar} tinybar · payTo ${cfg.accountId}`);
      if (cfg.topicId) console.log(`  HCS topic ${cfg.topicId}`);
      console.log(`  ens ${ens.parent} · sepolia text:hedera`);
      console.log(`  ledger payout auto ≤ ${AUTO_TINYBAR} tinybar · daily ≤ ${DAILY_TINYBAR}`);
    }
  });
}

function deny(res, origin) {
  res.writeHead(401, {
    "content-type": "application/json",
    ...(corsOrigin(origin) ? { "access-control-allow-origin": corsOrigin(origin) } : {}),
  });
  res.end(JSON.stringify({ error: { message: "invalid api key", type: "invalid_request_error" } }));
}

function readBody(req, max) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let n = 0;
    req.on("data", (c) => {
      n += c.length;
      if (n > max) { req.destroy(); reject(new Error("body too large")); return; }
      chunks.push(c);
    });
    req.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
    req.on("error", reject);
  });
}
