# Local OpenAI API

The swarm only runs in a browser room. This process does not infer — it forwards `POST /v1/chat/completions` to the **host tab** over WebSocket. The tab connects *out* to `ws://127.0.0.1:11435/bridge`; nothing punches into the browser.

## Run

Keep `/market` (or `/runtime/p2p.html?host=1`) open as host, start the model when pledged GB is enough, then:

```bash
node runtime/serve.mjs
```

The process prints `OPENAI_API_KEY`. Requests without that bearer are rejected. Bound to `127.0.0.1` only.

```bash
export OPENAI_API_KEY=…   # from the serve banner
curl http://127.0.0.1:11435/v1/chat/completions \
  -H "Authorization: Bearer $OPENAI_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"model":"qwen3-0.6b","messages":[{"role":"user","content":"hello"}]}'
```

Stream:

```bash
curl http://127.0.0.1:11435/v1/chat/completions \
  -H "Authorization: Bearer $OPENAI_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"model":"qwen3-0.6b","stream":true,"messages":[{"role":"user","content":"hello"}]}'
```

Jobs join the same host queue as the marketplace UI (one generation at a time). The room toasts “a local client asked…”.

## `baseURL` swap

Anything that already speaks OpenAI chat completions:

```js
import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: "http://127.0.0.1:11435/v1",
});

const r = await client.chat.completions.create({
  model: "qwen3-0.6b",
  messages: [{ role: "user", content: "hello" }],
});
```

`GET /v1/models` lists the room catalogue. The loaded room model is what actually runs; `model` is echoed on the response.

There is no public hosted inference URL. Vercel cannot run WebGPU.
