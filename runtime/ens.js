// Sepolia ENSv2: parent suffix + `hedera` text. Resolve is injected so checks stay offline.

export function ensConfig(env = process.env) {
  return {
    parent: String(env.ENS_PARENT || "trustedswarm.eth").trim().toLowerCase(),
    rpc: String(env.ENS_RPC || "https://ethereum-sepolia-rpc.publicnode.com").trim(),
    key: "hedera",
  };
}

export function normalizeEns(name) {
  return String(name || "").trim().toLowerCase().replace(/\.+$/, "");
}

export function underParent(name, parent) {
  const n = normalizeEns(name);
  const p = normalizeEns(parent);
  if (!n || !p) return false;
  return n === p || n.endsWith("." + p);
}

export function isAccountId(s) {
  return /^0\.0\.\d+$/.test(String(s || "").trim());
}

export async function readHederaText(name, cfg, getText) {
  const n = normalizeEns(name);
  if (!underParent(n, cfg.parent)) return { ok: false, error: "name not under parent" };
  let text;
  try {
    text = await getText(n, cfg);
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "resolve failed" };
  }
  const account = String(text || "").trim();
  if (!isAccountId(account)) return { ok: false, error: "missing hedera text" };
  return { ok: true, account };
}

let _rpc = "";
let _client = null;

export async function sepoliaGetText(name, cfg) {
  const { createPublicClient, http } = await import("viem");
  const { sepolia } = await import("viem/chains");
  const { normalize } = await import("viem/ens");
  if (!_client || _rpc !== cfg.rpc) {
    _rpc = cfg.rpc;
    _client = createPublicClient({ chain: sepolia, transport: http(cfg.rpc) });
  }
  return _client.getEnsText({ name: normalize(name), key: cfg.key || "hedera" });
}
