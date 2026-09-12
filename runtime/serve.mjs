#!/usr/bin/env node
// Local OpenAI-compatible bridge. The host tab connects out to /bridge;
// curl and other clients POST /v1/chat/completions. No extra deps.
import http from "node:http";
import crypto from "node:crypto";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { MODELS } from "./room/models.js";

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
  const pending = new Map();

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
      h["access-control-allow-headers"] = "authorization, content-type";
      h["access-control-allow-methods"] = "GET, POST, OPTIONS";
    }
    return h;
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
      if (!hostSock) {
        res.writeHead(503, jsonHead(origin));
        res.end(JSON.stringify({ error: { message: "host tab not connected. Open /market and keep it open.", type: "server_error" } }));
        return;
      }
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
      pending.set(id, { res, stream, model, origin, done: false });
      sendHost({ t: "completion", id, model, messages: body.messages, stream });
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
        const p = pending.get(d.id);
        if (!p) continue;
        if (d.t === "delta" && p.stream && d.content) {
          p.res.write(`data: ${JSON.stringify(toChunk(d.id, p.model, d.content))}\n\n`);
        }
        if (d.t === "done") {
          pending.delete(d.id);
          finish(p, { id: d.id, content: d.content || "", error: d.error || null });
        }
      }
    });
    socket.on("close", () => {
      if (hostSock === socket) { hostSock = null; failPending("host tab disconnected"); }
    });
    socket.on("error", () => socket.destroy());
  });

  server.listen(PORT, HOST, () => {
    console.log(`Trusted Swarm local API`);
    console.log(`  POST http://${HOST}:${PORT}/v1/chat/completions`);
    console.log(`  export OPENAI_API_KEY=${TOKEN}`);
    console.log(`  Keep the host tab open — it connects to ws://${HOST}:${PORT}/bridge`);
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
