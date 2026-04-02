interface CacheEntry<T> {
  data: T
  timestamp: number
}

const caches = new Map<string, CacheEntry<unknown>>()

export function getCached<T>(key: string, maxAgeMs: number): T | null {
  const entry = caches.get(key) as CacheEntry<T> | undefined
  if (!entry) return null
  if (Date.now() - entry.timestamp > maxAgeMs) return null
  return entry.data
}

export function setCached<T>(key: string, data: T): void {
  caches.set(key, { data, timestamp: Date.now() })
}

export function getCachedAny<T>(key: string): T | null {
  const entry = caches.get(key) as CacheEntry<T> | undefined
  return entry ? entry.data : null
}
