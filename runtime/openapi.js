// OpenAPI 3.1 for Bazantic gateway add --spec-url.
// Completions stay on the host tab; this file only describes the local bridge.

export function openApiSpec({ port = 11435 } = {}) {
  return {
    openapi: "3.1.0",
    info: {
      title: "Trusted Swarm inference",
      version: "0.2.0",
      description:
        "Browser WebGPU inference behind an OpenAI-compatible local bridge. " +
        "POST /v1/chat/completions may return HTTP 402 (Hedera x402 / Blocky402). " +
        "Keep a host tab open on /market. Public spec: https://trusted-swarm.vercel.app/openapi.json",
    },
    servers: [
      { url: `http://127.0.0.1:${port}`, description: "Host-tab inference" },
      { url: "https://trusted-swarm.vercel.app", description: "Public spec and quote" },
    ],
    security: [{ bearerAuth: [] }],
    components: {
      securitySchemes: {
        bearerAuth: { type: "http", scheme: "bearer" },
      },
    },
    paths: {
      "/openapi.json": {
        get: {
          security: [],
          summary: "This document",
          operationId: "getOpenApi",
          responses: { 200: { description: "OpenAPI 3.1" } },
        },
      },
      "/v1/price": {
        get: {
          security: [],
          summary: "Quote the Hedera x402 price without settling",
          operationId: "estimateComputePrice",
          responses: { 200: { description: "paid:false when ungated; else tinybar + payTo" } },
        },
      },
      "/v1/models": {
        get: {
          summary: "List catalogue ids (room model is what actually runs)",
          operationId: "listModels",
          responses: { 200: { description: "OpenAI model list" }, 401: { description: "bad bearer" } },
        },
      },
      "/v1/chat/completions": {
        post: {
          summary: "Run a chat completion on the host-tab swarm",
          operationId: "submitInferenceTask",
          description:
            "Requires a connected host tab. Unpaid when Hedera is on → 402 with accepts[]. " +
            "Retry with X-PAYMENT. Paid retry with no host → 503 (no settle). Bad host ENS → 403 (no settle).",
          responses: {
            200: { description: "chat.completion or SSE stream" },
            402: { description: "x402 v2 PaymentRequired" },
            403: { description: "host ENS hedera text ≠ payTo" },
            503: { description: "host tab missing" },
          },
        },
      },
    },
  };
}
