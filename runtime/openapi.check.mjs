import assert from "node:assert/strict";
import { openApiSpec } from "./openapi.js";

const spec = openApiSpec({ port: 11435 });
assert.equal(spec.openapi, "3.1.0");
assert.ok(spec.paths["/openapi.json"].get);
assert.ok(spec.paths["/v1/price"].get);
assert.ok(spec.paths["/v1/models"].get);
assert.ok(spec.paths["/v1/chat/completions"].post);
assert.equal(spec.paths["/v1/chat/completions"].post.operationId, "submitInferenceTask");
assert.equal(spec.servers[0].url, "http://127.0.0.1:11435");
assert.equal(spec.servers[1].url, "https://trusted-swarm.vercel.app");
console.log("openapi spec ok");
