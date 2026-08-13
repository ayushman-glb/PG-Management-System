import { createClient } from 'redis';
import { env } from './env';

export const redisClient = createClient({
  url: env.REDIS_URL,
  socket: {
    reconnectStrategy: (retries) => {
      if (retries > 10) {
        console.warn('⚠️ Redis max reconnect attempts reached. Operating in memory-fallback mode.');
        return false;
      }
      return Math.min(retries * 200, 3000);
    },
  },
});

redisClient.on('error', (err) => {
  // Silent error log to prevent crashing if Redis is offline locally
  console.warn('⚠️ Redis Client Error:', err.message);
});

redisClient.on('connect', () => {
  console.log('✅ Redis Cloud Connected');
});

// Self-executing connection attempt — non-blocking, idempotent
// Guards against duplicate connect() calls if module is re-evaluated (skipped in test mode)
if (env.NODE_ENV !== 'test') {
  (async () => {
    try {
      if (!redisClient.isOpen && !redisClient.isReady) {
        await redisClient.connect();
      }
    } catch (err: any) {
      console.warn('⚠️ Could not establish Redis connection. Fallbacks active.', err?.message ?? '');
    }
  })();
}
