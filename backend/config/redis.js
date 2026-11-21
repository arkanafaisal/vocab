import { createClient } from "redis"

// Konfigurasi Redis lokal lama (di-comment):
// const redis = createClient({
//   url: process.env.REDIS_URL,
//   socket: {
//     reconnectStrategy: (retries) => Math.min(retries * 100, 3000)
//   }
// });

// redis.on('error', err => console.error('Redis error', err));

// (async () => {
//   try { await redis.connect() } catch (err) { console.error(err); process.exit(1) }
// })();

// Konfigurasi Redis Cloud:
const redis = createClient({
  url: process.env.REDIS_URL,
  socket: {
    reconnectStrategy: (retries) => Math.min(retries * 100, 3000)
  }
});

redis.on('error', err => console.error('Redis error:', err));

(async () => {
  try {
    await redis.connect();
  } catch (err) {
    console.error('Redis connection error:', err);
    process.exit(1);
  }
})();

export default redis;
