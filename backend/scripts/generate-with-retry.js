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

function isPrismaClientUpToDate() {
  try {
    const schemaPath = path.resolve(__dirname, '../prisma/schema.prisma');
    const clientPath = path.resolve(__dirname, '../node_modules/.prisma/client/index.d.ts');
    
    if (!fs.existsSync(schemaPath) || !fs.existsSync(clientPath)) {
      return false;
    }

    const schemaStat = fs.statSync(schemaPath);
    const clientStat = fs.statSync(clientPath);

    return clientStat.mtimeMs >= schemaStat.mtimeMs;
  } catch (e) {
    return false;
  }
}

function killOrphanedNodeProcesses() {
  if (process.platform !== 'win32') return;

  try {
    const psCommand = `powershell -NoProfile -Command "Get-CimInstance Win32_Process -Filter \\"name = 'node.exe'\\" | Where-Object { $_.CommandLine -match 'PG-Management-System' -and $_.CommandLine -notmatch 'generate-with-retry' -and $_.CommandLine -notmatch 'cleanup-ports' } | Select-Object -ExpandProperty ProcessId"`;
    const output = execSync(psCommand, { encoding: 'utf8', stdio: ['pipe', 'pipe', 'ignore'] }).trim();

    if (output) {
      const pids = output.split(/\r?\n/).map((p) => p.trim()).filter(Boolean);
      for (const pid of pids) {
        const numPid = parseInt(pid, 10);
        if (numPid && numPid !== process.pid) {
          try {
            execSync(`taskkill /F /T /PID ${numPid}`, { stdio: 'ignore' });
          } catch (e) {}
        }
      }
    }
  } catch (e) {}
}

async function runPrismaGenerate() {
  cleanPrismaTempFiles();

  // If client is already generated and schema hasn't changed, skip to avoid Windows DLL locks
  if (isPrismaClientUpToDate() && process.env.FORCE_PRISMA_GENERATE !== 'true') {
    console.log('[Prisma] ✅ Prisma Client is up to date, skipping redundant generation.');
    return;
  }

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

      // Clean up orphaned processes and temp files
      killOrphanedNodeProcesses();
      cleanPrismaTempFiles();

      if (attempt < MAX_RETRIES) {
        console.log(`[Prisma] Retrying in ${RETRY_DELAY_MS}ms...`);
        await sleep(RETRY_DELAY_MS);
      } else {
        if (fs.existsSync(path.resolve(__dirname, '../node_modules/.prisma/client/index.d.ts'))) {
          console.warn(
            '[Prisma] ⚠️ DLL locked by background process, but existing valid Prisma Client detected. Proceeding with build.'
          );
          return;
        }
        console.error(
          `[Prisma] ❌ Prisma Client generation failed after ${MAX_RETRIES} attempts.`
        );
        process.exit(1);
      }
    }
  }
}

runPrismaGenerate();
