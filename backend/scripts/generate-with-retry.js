#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function cleanPrismaTempFiles() {
  try {
    const prismaClientDir = path.resolve(__dirname, '../node_modules/.prisma/client');
    if (fs.existsSync(prismaClientDir)) {
      const files = fs.readdirSync(prismaClientDir);
      for (const file of files) {
        if (file.includes('.tmp') || file.endsWith('.tmp')) {
          try {
            fs.unlinkSync(path.join(prismaClientDir, file));
          } catch (e) {}
        }
      }
    }
  } catch (e) {}
}

async function runPrismaGenerate() {
  cleanPrismaTempFiles();

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

      // Clean up orphaned temp files and ports
      cleanPrismaTempFiles();
      try {
        require('./cleanup-ports');
      } catch (e) {}

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
