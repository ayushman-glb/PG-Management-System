#!/usr/bin/env node

const { execSync } = require('child_process');

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1500;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function runPrismaGenerate() {
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      execSync('npx prisma generate', {
        stdio: 'inherit',
        env: process.env,
      });
      return;
    } catch (error) {
      console.warn(
        `[Prisma] ⚠️ Generation attempt ${attempt}/${MAX_RETRIES} encountered an issue (e.g. temporary file lock).`
      );

      if (attempt < MAX_RETRIES) {
        console.log(`[Prisma] Retrying in ${RETRY_DELAY_MS}ms...`);
        await sleep(RETRY_DELAY_MS);
      } else {
        console.error(
          `[Prisma] ❌ Prisma Client generation failed after ${MAX_RETRIES} attempts.`
        );
        process.exit(1);
      }
    }
  }
}

runPrismaGenerate();
