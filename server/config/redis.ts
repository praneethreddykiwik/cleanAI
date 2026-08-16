import { createClient, RedisClientType } from 'redis';
import { logger } from './logger';

class RedisService {
  private client: RedisClientType | null = null;
  private isConnected = false;
  private fallbackCache = new Map<string, { value: any; expiry: number }>();

  constructor() {
    const redisUrl = process.env.REDIS_URL || 'redis://127.0.0.1:6379';
    logger.info(`Initializing Redis Connection with URL: ${redisUrl}`);
    
    this.client = createClient({
      url: redisUrl,
      socket: {
        reconnectStrategy: (retries) => {
          if (retries >= 5) {
            logger.warn('Redis reconnect strategy exhausted. Operating in fallback mode.');
            return false; // Stop reconnecting, rely on fallback cache
          }
          return Math.min(retries * 500, 2000);
        }
      }
    }) as RedisClientType;

    this.client.on('error', (err) => {
      logger.error('Redis client experienced connection error:', err);
      this.isConnected = false;
    });

    this.client.on('connect', () => {
      logger.info('Connecting to Redis instance...');
    });

    this.client.on('ready', () => {
      logger.info('Redis connection established successfully.');
      this.isConnected = true;
    });

    this.client.connect().catch((err) => {
      logger.error('Failed to initialize Redis connection:', err);
      this.isConnected = false;
    });
  }

  public get isReady(): boolean {
    return this.isConnected;
  }

  public async get<T>(key: string): Promise<T | null> {
    if (this.isConnected && this.client) {
      try {
        const val = await this.client.get(key);
        return val ? (JSON.parse(val) as T) : null;
      } catch (err) {
        logger.error(`Redis GET error for key ${key}:`, err);
      }
    }

    const fallback = this.fallbackCache.get(key);
    if (fallback) {
      if (Date.now() < fallback.expiry) {
        return fallback.value as T;
      }
      this.fallbackCache.delete(key);
    }
    return null;
  }

  public async set(key: string, value: any, ttlSeconds = 300): Promise<void> {
    const stringValue = JSON.stringify(value);
    if (this.isConnected && this.client) {
      try {
        await this.client.set(key, stringValue, { EX: ttlSeconds });
        return;
      } catch (err) {
        logger.error(`Redis SET error for key ${key}:`, err);
      }
    }

    this.fallbackCache.set(key, {
      value,
      expiry: Date.now() + ttlSeconds * 1000,
    });
  }

  public async del(key: string): Promise<void> {
    if (this.isConnected && this.client) {
      try {
        await this.client.del(key);
        return;
      } catch (err) {
        logger.error(`Redis DEL error for key ${key}:`, err);
      }
    }
    this.fallbackCache.delete(key);
  }

  public async ping(): Promise<boolean> {
    if (this.isConnected && this.client) {
      try {
        const pong = await this.client.ping();
        return pong === 'PONG';
      } catch {
        return false;
      }
    }
    return false;
  }
}

export const redisService = new RedisService();
