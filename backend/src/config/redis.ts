import { createClient } from 'redis';
import { env } from './env';

export const redisClient = createClient({
  url: env.REDIS_URL,
  socket: {
    reconnectStrategy: (retries) => {
      if (retries > 5) {
        console.warn('⚠️ Redis max reconnect attempts reached. Operating in memory-fallback mode.');
        return new Error('Redis max retries reached');
      }
      return Math.min(retries * 100, 3000);
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

// Self-executing connection test (non-blocking)
(async () => {
  try {
    await redisClient.connect();
  } catch (err) {
    console.warn('⚠️ Could not establish Redis connection. Fallbacks active.');
  }
})();
