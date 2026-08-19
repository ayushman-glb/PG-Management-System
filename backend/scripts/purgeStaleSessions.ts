/**
 * scripts/purgeStaleSessions.ts
 *
 * ONE-TIME MIGRATION — Run manually ONCE after JWT secrets are rotated.
 * DO NOT include in server boot or CI pipelines.
 *
 * What this does:
 *   1. Marks ALL non-revoked RefreshToken records as revoked.
 *      Reason: After a JWT secret rotation, every previously issued refresh token
 *      will fail jwt.verify() (signature mismatch). The session records are stale.
 *      Users will simply need to log in again — POST /api/v1/auth/login creates fresh sessions.
 *   2. Deletes expired / already-verified OtpToken records (bonus cleanup).
 *
 * How to run:
 *   cd backend
 *   npx ts-node -r tsconfig-paths/register scripts/purgeStaleSessions.ts
 *
 * Requirements: DATABASE_URL must be in .env / .env.development
 */

import { PrismaClient } from "@prisma/client";
import dotenv from "dotenv";
import path from "path";
import fs from "fs";

// Load env
const envFile = path.resolve(process.cwd(), ".env.development");
const fallback = path.resolve(process.cwd(), ".env");
if (fs.existsSync(envFile)) dotenv.config({ path: envFile });
if (fs.existsSync(fallback)) dotenv.config({ path: fallback, override: false });

if (!process.env.DATABASE_URL) {
  console.error("❌ DATABASE_URL is not set. Cannot connect to database.");
  process.exit(1);
}

const prisma = new PrismaClient();

async function main() {
  console.log("🔒 Session Purge Migration — Starting");
  console.log("   Connected to:", process.env.DATABASE_URL?.replace(/:\/\/[^@]+@/, "://<credentials>@"));
  console.log("");

  // ── 1. Revoke all active refresh token sessions ──────────────────────────
  const now = new Date();

  const revokeResult = await prisma.refreshToken.updateMany({
    where: { revokedAt: null },
    data: { revokedAt: now },
  });

  console.log(`✅ RefreshToken: ${revokeResult.count} active session(s) marked as revoked.`);

  // ── 2. Clean up expired/stale OTP records ─────────────────────────────────
  const otpDeleteResult = await prisma.otpToken.deleteMany({
    where: {
      OR: [
        { expiresAt: { lt: now } },   // already expired
        { verified: true },            // already used
      ],
    },
  });

  console.log(`✅ OtpToken:     ${otpDeleteResult.count} expired/used OTP record(s) deleted.`);

  console.log("");
  console.log("✅ Migration complete. All users must log in again to receive new sessions.");
  console.log("   Their accounts, passwords, and profile data are NOT affected.");
}

main()
  .catch((err) => {
    console.error("❌ Migration failed:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
