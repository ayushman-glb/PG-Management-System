import cluster from 'cluster';
import * as os from 'os';
import { logger } from './utils/logger';
import { env } from './config/env';

export function runInCluster(startServerFn: () => void) {
  // Respect CLUSTER_MODE env flag (defaults to single process mode in development for stability)
  const isClusterEnabled = env.CLUSTER_MODE === 'true';
  const numCPUs = Math.min(os.cpus().length, 8); // Max 8 cluster workers

  if (isClusterEnabled && cluster.isPrimary) {
    logger.info(`⚡ [Primary Cluster Master] PID ${process.pid} is spawning ${numCPUs} worker processes...`);

    // Fork workers per CPU core
    for (let i = 0; i < numCPUs; i++) {
      cluster.fork();
    }

    cluster.on('online', (worker) => {
      logger.info(`✓ [Worker Process ${worker.id}] (PID ${worker.process.pid}) online.`);
    });

    cluster.on('exit', (worker, code, signal) => {
      logger.warn(`⚠️ [Worker Process ${worker.id}] (PID ${worker.process.pid}) died (Code: ${code}, Signal: ${signal}). Respawning...`);
      cluster.fork();
    });

    // Graceful cluster shutdown on SIGINT / SIGTERM
    const handleShutdown = () => {
      logger.info('Received shutdown signal. Stopping all cluster workers...');
      for (const id in cluster.workers) {
        cluster.workers[id]?.kill();
      }
      process.exit(0);
    };

    process.on('SIGINT', handleShutdown);
    process.on('SIGTERM', handleShutdown);
  } else {
    // Worker instance or single process mode
    startServerFn();
  }
}
