import { createLocalStorageAdapter } from "./persistence/adapter";
import { DOCS_CODEC, PROFILE_CODEC } from "./persistence/codecs";
import { readVersioned, writeVersioned } from "./persistence/versioning";
import type { CompanyProfile, Doc } from "./types";

/**
 * The one place a backend is chosen. Swapping this for a SQLite or hub-backed
 * adapter is the whole point of the seam; nothing below this line knows where
 * the bytes live.
 */
const adapter = createLocalStorageAdapter();

/** Parses unknown JSON into a profile, falling back to defaults on bad data. */
export function parseProfile(raw: unknown): CompanyProfile {
  return PROFILE_CODEC.parse(raw) ?? PROFILE_CODEC.fallback;
}

/** Parses unknown JSON into a doc list, dropping entries that fail validation. */
export function parseDocs(raw: unknown): Doc[] {
  return DOCS_CODEC.parse(raw) ?? DOCS_CODEC.fallback;
}

/**
 * In-memory mirror of the persisted state. Snapshots keep stable references
 * between writes so useSyncExternalStore can compare them cheaply; every write
 * below replaces the cache immutably and notifies subscribers.
 */
let docsCache: Doc[] | null = null;
let profileCache: CompanyProfile | null = null;
const listeners = new Set<() => void>();

function notify(): void {
  for (const listener of listeners) listener();
}

export function subscribeToStore(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function getDocsSnapshot(): Doc[] {
  docsCache ??= readVersioned(adapter, DOCS_CODEC);
  return docsCache;
}

export function getProfileSnapshot(): CompanyProfile {
  profileCache ??= readVersioned(adapter, PROFILE_CODEC);
  return profileCache;
}

export function loadProfile(): CompanyProfile {
  return getProfileSnapshot();
}

export function getDoc(id: string): Doc | null {
  return getDocsSnapshot().find((doc) => doc.id === id) ?? null;
}

export function saveProfile(profile: CompanyProfile): void {
  profileCache = profile;
  writeVersioned(adapter, PROFILE_CODEC, profile);
  notify();
}

/** Inserts or replaces a doc, keeping the list sorted by most recently updated. */
export function upsertDoc(doc: Doc): void {
  const others = getDocsSnapshot().filter((existing) => existing.id !== doc.id);
  docsCache = [doc, ...others];
  writeVersioned(adapter, DOCS_CODEC, docsCache);
  notify();
}

export function deleteDoc(id: string): void {
  docsCache = getDocsSnapshot().filter((doc) => doc.id !== id);
  writeVersioned(adapter, DOCS_CODEC, docsCache);
  notify();
}
