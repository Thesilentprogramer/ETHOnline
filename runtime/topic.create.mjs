#!/usr/bin/env node
// One-shot: check testnet balance, create an HCS topic, print the topic id.
import { Client, AccountId, PrivateKey, TopicCreateTransaction, AccountBalanceQuery } from "@hiero-ledger/sdk";
import { loadDotenv } from "./env.js";

loadDotenv();

const accountId = process.env.HEDERA_ACCOUNT_ID;
const privateKey = process.env.HEDERA_PRIVATE_KEY;
if (!accountId || !privateKey) {
  console.error("need HEDERA_ACCOUNT_ID and HEDERA_PRIVATE_KEY in runtime/.env");
  process.exit(1);
}

const key = privateKey.startsWith("0x") || /^[0-9a-fA-F]{64}$/.test(privateKey)
  ? PrivateKey.fromStringECDSA(privateKey.replace(/^0x/, ""))
  : PrivateKey.fromString(privateKey);

const client = Client.forTestnet().setOperator(AccountId.fromString(accountId), key);
try {
  const bal = await new AccountBalanceQuery().setAccountId(accountId).execute(client);
  console.log("operator", accountId);
  console.log("balance_hbar", bal.hbars.toString());
  const tx = await new TopicCreateTransaction()
    .setTopicMemo("Trusted Swarm paid-job receipts")
    .execute(client);
  const rec = await tx.getReceipt(client);
  console.log("topic", rec.topicId.toString());
  console.log("create_tx", tx.transactionId.toString());
} finally {
  client.close();
}
