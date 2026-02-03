const Redis = require('ioredis');

let redis = null;

// Redis connection (mandatory by design, enabled via env)
if (process.env.CACHE_URL) {
    redis = new Redis(process.env.CACHE_URL, {
        retryStrategy(times) {
            return Math.min(times * 100, 2000);
        }
    });

    redis.on('connect', () => {
        console.log('✅ Redis connected');
    });

    redis.on('error', (err) => {
        console.error('❌ Redis error:', err.message);
    });
} else {
    console.warn('⚠️ Redis disabled (CACHE_URL not set)');
}

// Cache API used by server.js
const cache = {
    async get(key) {
        if (!redis) return null;
        try {
            const value = await redis.get(key);
            return value ? JSON.parse(value) : null;
        } catch (err) {
            console.error('[Cache] GET error:', err.message);
            return null;
        }
    },

    async set(key, value, ttlSeconds = 600) {
        if (!redis) return;
        try {
            await redis.set(key, JSON.stringify(value), 'EX', ttlSeconds);
        } catch (err) {
            console.error('[Cache] SET error:', err.message);
        }
    },

    async del(key) {
        if (!redis) return;
        try {
            await redis.del(key);
        } catch (err) {
            console.error('[Cache] DEL error:', err.message);
        }
    }
};

module.exports = { cache };
