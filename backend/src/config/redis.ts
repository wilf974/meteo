import { createClient } from 'redis';
import { logger } from '../utils/logger';

export const redisClient = createClient({
  socket: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379')
  }
});

redisClient.on('error', (err) => {
  logger.error('Redis Client Error:', err);
});

redisClient.on('connect', () => {
  logger.info('Redis Client connecté');
});

export const cacheService = {
  async get<T>(key: string): Promise<T | null> {
    try {
      const data = await redisClient.get(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      logger.error('Redis GET error:', error);
      return null;
    }
  },

  async set(key: string, value: any, expirationInSeconds: number = 3600): Promise<void> {
    try {
      await redisClient.setEx(key, expirationInSeconds, JSON.stringify(value));
    } catch (error) {
      logger.error('Redis SET error:', error);
    }
  },

  async del(key: string): Promise<void> {
    try {
      await redisClient.del(key);
    } catch (error) {
      logger.error('Redis DEL error:', error);
    }
  },

  async clear(pattern: string = '*'): Promise<void> {
    try {
      const keys = await redisClient.keys(pattern);
      if (keys.length > 0) {
        await redisClient.del(keys);
      }
    } catch (error) {
      logger.error('Redis CLEAR error:', error);
    }
  }
};
