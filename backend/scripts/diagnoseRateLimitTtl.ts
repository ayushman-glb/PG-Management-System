/**
 * scripts/diagnoseRateLimitTtl.ts
 *
 * DIAGNOSTIC SCRIPT: Scans all 'rl:*' rate-limit keys in Redis and reports
 * any keys that have TTL == -1 (no expiration).
 *
 * Usage:
 *   cd backend
 *   npx ts-node -r tsconfig-paths/register scripts/diagnoseRateLimitTtl.ts
 */

import { createClient } from "redis";
import dotenv from "dotenv";
import path from "path";
import fs from "fs";

// Load environment variables
const envFile = path.resolve(process.cwd(), ".env.development");
const fallback = path.resolve(process.cwd(), ".env");
if (fs.existsSync(envFile)) dotenv.config({ path: envFile });
if (fs.existsSync(fallback)) dotenv.config({ path: fallback, override: false });

const redisUrl = process.env.REDIS_URL || `redis://${process.env.REDIS_HOST || "localhost"}:${process.env.REDIS_PORT || "6379"}`;

async function main() {
  console.log("🔍 Rate-Limit Key TTL Diagnostic — Starting");
  console.log("   Connecting to Redis:", redisUrl.replace(/:\/\/[^@]+@/, "://<credentials>@"));

  const client = createClient({ url: redisUrl });
  client.on("error", (err) => console.error("Redis Error:", err.message));

  await client.connect();
  console.log("✓ Connected to Redis");

  let totalKeys = 0;
  const noTtlKeys: Array<{ key: string; value: string | null }> = [];
  const validTtlKeys: Array<{ key: string; ttl: number }> = [];

  for await (const key of client.scanIterator({ MATCH: "rl:*", COUNT: 100 })) {
    totalKeys++;
    const ttl = await client.ttl(key);
    if (ttl === -1) {
      const val = await client.get(key);
      noTtlKeys.push({ key, value: val });
    } else {
      validTtlKeys.push({ key, ttl });
    }
  }

  console.log("");
  console.log(`📊 Scan Results:`);
  console.log(`   Total rate-limit keys scanned: ${totalKeys}`);
  console.log(`   Keys with valid TTL (> 0):     ${validTtlKeys.length}`);
  console.log(`   ⚠️ Keys with NO TTL (-1):       ${noTtlKeys.length}`);

  if (noTtlKeys.length > 0) {
    console.log("\n⚠️ Found un-expiring rate limit keys (signature of old race condition bug):");
    for (const item of noTtlKeys) {
      console.log(`   - Key: ${item.key} | Value: ${item.value}`);
    }
  } else {
    console.log("\n✅ All rate-limit keys have valid expirations. No permanent lockouts detected.");
  }

  await client.disconnect();
  console.log("\n✓ Diagnostic completed successfully.");
}

main().catch((err) => {
  console.error("❌ Diagnostic error:", err.message);
  process.exit(1);
});
