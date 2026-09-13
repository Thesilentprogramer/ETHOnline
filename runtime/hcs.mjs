// Optional HCS submit. Real topic message when @hashgraph/sdk + keys are present.

export async function submitTopicMessage({ topicId, accountId, privateKey, message, network }) {
  if (!topicId || !accountId || !privateKey) {
    return { ok: false, error: "HCS env missing" };
  }
  let sdk;
  try {
    sdk = await import("@hiero-ledger/sdk").catch(() => import("@hashgraph/sdk"));
  } catch {
    return { ok: false, error: "install @hiero-ledger/sdk to submit HCS" };
  }
  const { Client, TopicMessageSubmitTransaction, PrivateKey, AccountId, TopicId } = sdk;
  const client = String(network || "").includes("mainnet") ? Client.forMainnet() : Client.forTestnet();
  try {
    const key = privateKey.startsWith("0x") || privateKey.length === 64
      ? PrivateKey.fromStringECDSA(privateKey.replace(/^0x/, ""))
      : PrivateKey.fromString(privateKey);
    client.setOperator(AccountId.fromString(accountId), key);
    const tx = await new TopicMessageSubmitTransaction()
      .setTopicId(TopicId.fromString(topicId))
      .setMessage(typeof message === "string" ? message : JSON.stringify(message))
      .execute(client);
    const rec = await tx.getReceipt(client);
    return { ok: rec.status?.toString() === "SUCCESS", transactionId: tx.transactionId?.toString() || "" };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "HCS submit failed" };
  } finally {
    try { client.close(); } catch {}
  }
}
