/**
 * RoomBae Enterprise Process & Port Cleaner
 * 
 * Forcefully terminates zombie/orphaned backend Node processes associated with
 * PG-Management-System and clears ports 5000/5001 & Prisma file locks.
 */
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

function killOrphanedBackendProcesses() {
  if (process.platform !== 'win32') return;

  try {
    const psCommand = `powershell -NoProfile -Command "Get-CimInstance Win32_Process -Filter \\"name = 'node.exe'\\" | Where-Object { $_.CommandLine -match 'PG-Management-System' -and $_.CommandLine -notmatch 'cleanup-ports' } | Select-Object -ExpandProperty ProcessId"`;
    const output = execSync(psCommand, { encoding: 'utf8', stdio: ['pipe', 'pipe', 'ignore'] }).trim();

    if (output) {
      const pids = output.split(/\r?\n/).map((p) => p.trim()).filter(Boolean);
      for (const pid of pids) {
        const numPid = parseInt(pid, 10);
        if (numPid && numPid !== process.pid) {
          try {
            execSync(`taskkill /F /T /PID ${numPid}`, { stdio: 'ignore' });
            console.log(`[Cleaner] 🛑 Terminated orphaned backend Node process PID ${numPid}`);
          } catch (e) {}
        }
      }
    }
  } catch (e) {
    // Non-fatal if query fails
  }
}

function killPortsOnWindows(ports) {
  for (const port of ports) {
    try {
      const output = execSync(`netstat -ano | findstr :${port}`, { encoding: 'utf8', stdio: ['pipe', 'pipe', 'ignore'] });
      const lines = output.trim().split('\n');
      const pids = new Set();

      for (const line of lines) {
        const parts = line.trim().split(/\s+/);
        if (parts.length >= 5) {
          const pid = parts[parts.length - 1];
          if (pid && pid !== '0' && parseInt(pid, 10) !== process.pid) {
            pids.add(pid);
          }
        }
      }

      for (const pid of pids) {
        try {
          execSync(`taskkill /F /T /PID ${pid}`, { stdio: 'ignore' });
          console.log(`[Cleaner] 🛑 Terminated process PID ${pid} holding port ${port}`);
        } catch (e) {}
      }
    } catch (e) {}
  }
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
            console.log(`[Cleaner] 🧹 Removed stale temp file: ${file}`);
          } catch (e) {}
        }
      }
    }
  } catch (e) {}
}

async function main() {
  const ports = [5000, 5001];

  if (process.platform === 'win32') {
    killOrphanedBackendProcesses();
    killPortsOnWindows(ports);
  }

  try {
    const kill = require('kill-port');
    await Promise.allSettled(ports.map((p) => kill(p))).catch(() => {});
  } catch (e) {}

  cleanPrismaTempFiles();
}

main().finally(() => {
  process.exit(0);
});
