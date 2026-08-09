/**
 * Minimal key-value contract that every persistence backend implements.
 *
 * Deliberately synchronous. `useSyncExternalStore` needs a synchronous
 * snapshot, and the reactive store reads through this interface on that path.
 * An async backend (SQLite, a hub API) still fits the seam: it hydrates the
 * in-memory cache asynchronously and keeps serving snapshots from the cache,
 * which is the usual cache-in-front arrangement.
 */
export interface StorageAdapter {
  read(key: string): string | null;
  write(key: string, value: string): void;
  remove(key: string): void;
}

/** In-process adapter. Used by tests, and by any non-browser caller. */
export function createMemoryAdapter(
  seed: Readonly<Record<string, string>> = {},
): StorageAdapter {
  const store = new Map(Object.entries(seed));

  return {
    read: (key) => store.get(key) ?? null,
    write: (key, value) => {
      store.set(key, value);
    },
    remove: (key) => {
      store.delete(key);
    },
  };
}

/**
 * Browser adapter. Every method is a no-op without a `window`, so the same
 * code path is safe during server rendering, and write failures (quota
 * exceeded, storage disabled) are swallowed — the in-memory state still works.
 */
export function createLocalStorageAdapter(): StorageAdapter {
  return {
    read(key) {
      if (typeof window === "undefined") return null;
      try {
        return window.localStorage.getItem(key);
      } catch {
        return null;
      }
    },
    write(key, value) {
      if (typeof window === "undefined") return;
      try {
        window.localStorage.setItem(key, value);
      } catch {
        // Storage full or unavailable; the in-memory cache stays authoritative.
      }
    },
    remove(key) {
      if (typeof window === "undefined") return;
      try {
        window.localStorage.removeItem(key);
      } catch {
        // Nothing useful to do here.
      }
    },
  };
}
