/**
 * Redis Client
 * Simulated Redis client for development/testing.
 * In production, replace with actual Redis client (ioredis or @upstash/redis)
 */

// ============================================================================
// In-Memory Store (for development)
// ============================================================================

interface StoreEntry {
  value: string;
  expiresAt: number | null;
}

const memoryStore = new Map<string, StoreEntry>();
const setStore = new Map<string, Set<string>>();
const sortedSetStore = new Map<string, Map<string, number>>();

// Cleanup expired entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of memoryStore.entries()) {
    if (entry.expiresAt && entry.expiresAt <= now) {
      memoryStore.delete(key);
    }
  }
}, 60000); // Every minute

// ============================================================================
// Redis Client Interface
// ============================================================================

class RedisClient {
  // ==========================================================================
  // String Operations
  // ==========================================================================

  async get(key: string): Promise<string | null> {
    const entry = memoryStore.get(key);
    if (!entry) return null;
    
    if (entry.expiresAt && entry.expiresAt <= Date.now()) {
      memoryStore.delete(key);
      return null;
    }
    
    return entry.value;
  }

  async set(key: string, value: string): Promise<'OK'> {
    memoryStore.set(key, { value, expiresAt: null });
    return 'OK';
  }

  async setex(key: string, seconds: number, value: string): Promise<'OK'> {
    memoryStore.set(key, {
      value,
      expiresAt: Date.now() + seconds * 1000,
    });
    return 'OK';
  }

  async del(...keys: string[]): Promise<number> {
    let deleted = 0;
    for (const key of keys) {
      if (memoryStore.delete(key)) deleted++;
    }
    return deleted;
  }

  async exists(key: string): Promise<number> {
    const entry = memoryStore.get(key);
    if (!entry) return 0;
    
    if (entry.expiresAt && entry.expiresAt <= Date.now()) {
      memoryStore.delete(key);
      return 0;
    }
    
    return 1;
  }

  async expire(key: string, seconds: number): Promise<number> {
    const entry = memoryStore.get(key);
    if (!entry) return 0;
    
    entry.expiresAt = Date.now() + seconds * 1000;
    return 1;
  }

  async ttl(key: string): Promise<number> {
    const entry = memoryStore.get(key);
    if (!entry) return -2;
    if (!entry.expiresAt) return -1;
    
    const ttl = Math.ceil((entry.expiresAt - Date.now()) / 1000);
    return ttl > 0 ? ttl : -2;
  }

  // ==========================================================================
  // Set Operations
  // ==========================================================================

  async sadd(key: string, ...members: string[]): Promise<number> {
    let set = setStore.get(key);
    if (!set) {
      set = new Set();
      setStore.set(key, set);
    }
    
    let added = 0;
    for (const member of members) {
      if (!set.has(member)) {
        set.add(member);
        added++;
      }
    }
    return added;
  }

  async srem(key: string, ...members: string[]): Promise<number> {
    const set = setStore.get(key);
    if (!set) return 0;
    
    let removed = 0;
    for (const member of members) {
      if (set.delete(member)) removed++;
    }
    return removed;
  }

  async smembers(key: string): Promise<string[]> {
    const set = setStore.get(key);
    return set ? Array.from(set) : [];
  }

  async sismember(key: string, member: string): Promise<number> {
    const set = setStore.get(key);
    return set?.has(member) ? 1 : 0;
  }

  async scard(key: string): Promise<number> {
    const set = setStore.get(key);
    return set?.size || 0;
  }

  // ==========================================================================
  // Sorted Set Operations
  // ==========================================================================

  async zadd(key: string, ...args: (string | number)[]): Promise<number> {
    let zset = sortedSetStore.get(key);
    if (!zset) {
      zset = new Map();
      sortedSetStore.set(key, zset);
    }

    let added = 0;
    for (let i = 0; i < args.length; i += 2) {
      const score = args[i] as number;
      const member = args[i + 1] as string;
      
      if (!zset.has(member)) {
        added++;
      }
      zset.set(member, score);
    }
    return added;
  }

  async zrem(key: string, ...members: string[]): Promise<number> {
    const zset = sortedSetStore.get(key);
    if (!zset) return 0;
    
    let removed = 0;
    for (const member of members) {
      if (zset.delete(member)) removed++;
    }
    return removed;
  }

  async zrange(key: string, start: number, stop: number): Promise<string[]> {
    const zset = sortedSetStore.get(key);
    if (!zset) return [];
    
    const sorted = Array.from(zset.entries())
      .sort((a, b) => a[1] - b[1])
      .slice(start, stop >= 0 ? stop + 1 : undefined)
      .map(([member]) => member);
    
    return sorted;
  }

  async zrevrange(key: string, start: number, stop: number): Promise<string[]> {
    const zset = sortedSetStore.get(key);
    if (!zset) return [];
    
    const sorted = Array.from(zset.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(start, stop >= 0 ? stop + 1 : undefined)
      .map(([member]) => member);
    
    return sorted;
  }

  async zcard(key: string): Promise<number> {
    const zset = sortedSetStore.get(key);
    return zset?.size || 0;
  }

  // ==========================================================================
  // List Operations
  // ==========================================================================

  async lpush(key: string, ...elements: string[]): Promise<number> {
    const existing = memoryStore.get(key);
    const list = existing ? JSON.parse(existing.value) as string[] : [];
    list.unshift(...elements);
    memoryStore.set(key, { value: JSON.stringify(list), expiresAt: null });
    return list.length;
  }

  async rpush(key: string, ...elements: string[]): Promise<number> {
    const existing = memoryStore.get(key);
    const list = existing ? JSON.parse(existing.value) as string[] : [];
    list.push(...elements);
    memoryStore.set(key, { value: JSON.stringify(list), expiresAt: null });
    return list.length;
  }

  async ltrim(key: string, start: number, stop: number): Promise<'OK'> {
    const existing = memoryStore.get(key);
    if (existing) {
      const list = JSON.parse(existing.value) as string[];
      const trimmed = list.slice(start, stop + 1);
      memoryStore.set(key, { value: JSON.stringify(trimmed), expiresAt: existing.expiresAt });
    }
    return 'OK';
  }

  async lrange(key: string, start: number, stop: number): Promise<string[]> {
    const existing = memoryStore.get(key);
    if (!existing) return [];
    const list = JSON.parse(existing.value) as string[];
    return list.slice(start, stop >= 0 ? stop + 1 : undefined);
  }

  // ==========================================================================
  // Utility Operations
  // ==========================================================================

  async keys(pattern: string): Promise<string[]> {
    const regex = new RegExp('^' + pattern.replace(/\*/g, '.*').replace(/\?/g, '.') + '$');
    const matching: string[] = [];
    
    // Check all stores
    for (const key of memoryStore.keys()) {
      if (regex.test(key)) matching.push(key);
    }
    for (const key of setStore.keys()) {
      if (regex.test(key)) matching.push(key);
    }
    for (const key of sortedSetStore.keys()) {
      if (regex.test(key)) matching.push(key);
    }
    
    return [...new Set(matching)];
  }

  async flushall(): Promise<'OK'> {
    memoryStore.clear();
    setStore.clear();
    sortedSetStore.clear();
    return 'OK';
  }

  async ping(): Promise<'PONG'> {
    return 'PONG';
  }
}

// ============================================================================
// Export Singleton Instance
// ==========================================================================

export const redis = new RedisClient();

// ==========================================================================
// Production Redis Client (commented - use when deploying)
// ==========================================================================

/*
// For Upstash Redis (serverless-friendly):
import { Redis } from '@upstash/redis';

export const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

// For ioredis (traditional Redis):
import Redis from 'ioredis';

export const redis = new Redis({
  host: process.env.REDIS_HOST,
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD,
  tls: process.env.REDIS_TLS === 'true' ? {} : undefined,
});
*/

// ==========================================================================
// Helper Functions
// ==========================================================================

export async function getJson<T>(key: string): Promise<T | null> {
  const value = await redis.get(key);
  if (!value) return null;
  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
}

export async function setJson<T>(key: string, value: T, ttlSeconds?: number): Promise<'OK'> {
  const json = JSON.stringify(value);
  if (ttlSeconds) {
    return redis.setex(key, ttlSeconds, json);
  }
  return redis.set(key, json);
}
