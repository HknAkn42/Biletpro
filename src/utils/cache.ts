// Advanced Caching System
interface CacheItem<T> {
  data: T;
  timestamp: number;
  ttl: number;
  hits: number;
}

class MemoryCache {
  private cache = new Map<string, CacheItem<any>>();
  private maxSize = 1000;
  private cleanupInterval = 5 * 60 * 1000; // 5 minutes

  constructor() {
    // Auto cleanup expired items
    setInterval(() => this.cleanup(), this.cleanupInterval);
  }

  set<T>(key: string, data: T, ttl: number = 300000): void { // 5 minutes default TTL
    // Remove oldest items if cache is full
    if (this.cache.size >= this.maxSize) {
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey) this.cache.delete(oldestKey);
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
      hits: 0
    });
  }

  get<T>(key: string): T | null {
    const item = this.cache.get(key);
    if (!item) return null;

    // Check if expired
    if (Date.now() - item.timestamp > item.ttl) {
      this.cache.delete(key);
      return null;
    }

    // Increment hit counter
    item.hits++;
    return item.data;
  }

  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [key, item] of this.cache.entries()) {
      if (now - item.timestamp > item.ttl) {
        this.cache.delete(key);
      }
    }
  }

  getStats(): { size: number; hitRate: number } {
    let totalHits = 0;
    for (const item of this.cache.values()) {
      totalHits += item.hits;
    }
    return {
      size: this.cache.size,
      hitRate: totalHits > 0 ? totalHits / this.cache.size : 0
    };
  }
}

// Global cache instance
export const cache = new MemoryCache();

// Cache decorators for API calls
export const cached = (ttl: number = 300000) => {
  return (target: any, propertyName: string, descriptor: PropertyDescriptor) => {
    const method = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const cacheKey = `${propertyName}_${JSON.stringify(args)}`;
      
      // Try to get from cache
      const cachedResult = cache.get(cacheKey);
      if (cachedResult !== null) {
        return cachedResult;
      }

      // Execute method and cache result
      const result = await method.apply(this, args);
      cache.set(cacheKey, result, ttl);
      return result;
    };

    return descriptor;
  };
};

// LocalStorage with expiration
export const storage = {
  set<T>(key: string, data: T, ttl: number = 86400000): void { // 24 hours default
    const item = {
      data,
      timestamp: Date.now(),
      ttl
    };
    localStorage.setItem(key, JSON.stringify(item));
  },

  get<T>(key: string): T | null {
    try {
      const item = localStorage.getItem(key);
      if (!item) return null;

      const parsed = JSON.parse(item);
      if (Date.now() - parsed.timestamp > parsed.ttl) {
        localStorage.removeItem(key);
        return null;
      }

      return parsed.data;
    } catch {
      return null;
    }
  },

  remove(key: string): void {
    localStorage.removeItem(key);
  },

  clear(): void {
    localStorage.clear();
  }
};

// IndexedDB for larger datasets
export class IndexedDBCache {
  private dbName = 'BiletProCache';
  private version = 1;
  private db: IDBDatabase | null = null;

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains('cache')) {
          db.createObjectStore('cache', { keyPath: 'key' });
        }
      };
    });
  }

  async set<T>(key: string, data: T, ttl: number = 300000): Promise<void> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['cache'], 'readwrite');
      const store = transaction.objectStore('cache');

      const item = {
        key,
        data,
        timestamp: Date.now(),
        ttl
      };

      const request = store.put(item);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async get<T>(key: string): Promise<T | null> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['cache'], 'readonly');
      const store = transaction.objectStore('cache');

      const request = store.get(key);
      request.onsuccess = () => {
        const item = request.result;
        if (!item) return resolve(null);

        if (Date.now() - item.timestamp > item.ttl) {
          this.delete(key);
          return resolve(null);
        }

        resolve(item.data);
      };
      request.onerror = () => reject(request.error);
    });
  }

  async delete(key: string): Promise<void> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['cache'], 'readwrite');
      const store = transaction.objectStore('cache');

      const request = store.delete(key);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }
}

// Export singleton instance
export const indexedDBCache = new IndexedDBCache();
