import {createClient} from "redis"

const redis = createClient({
  url: 'redis://127.0.0.1:6379'
});

redis.on('error', err => console.error('Redis error', err));

(async () => {
  try { await redis.connect() } catch (err) { console.error(err); process.exit(1) }
})();

export default redis