import IORedis from 'ioredis'

export const redisClient = new IORedis(process.env.REDIS_URL!, { maxRetriesPerRequest: null })

redisClient.on('connect', () => {
    console.log('Redis connection established');
});

redisClient.on('error', (err) => {
    console.error('Redis connection error:', err);
});