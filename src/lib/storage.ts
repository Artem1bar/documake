import { DEFAULT_PROFILE } from "./factories";
import type { CompanyProfile, Doc } from "./types";
import { CompanyProfileSchema, DocSchema } from "./types";

const PROFILE_KEY = "documake.profile.v1";
const DOCS_KEY = "documake.docs.v1";

/** Parses unknown JSON into a profile, falling back to defaults on bad data. */
export function parseProfile(raw: unknown): CompanyProfile {
  const result = CompanyProfileSchema.safeParse(raw);
  return result.success ? result.data : DEFAULT_PROFILE;
}

/** Parses unknown JSON into a doc list, dropping entries that fail validation. */
export function parseDocs(raw: unknown): Doc[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((entry) => DocSchema.safeParse(entry))
    .filter((result) => result.success)
    .map((result) => result.data);
}

function readJson(key: string): unknown {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function writeJson(key: string, value: unknown): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage full or unavailable; the in-memory state still works.
  }
}

/**
 * In-memory mirror of localStorage. Snapshots keep stable references between
 * writes so useSyncExternalStore can compare them cheaply; every write below
 * replaces the cache immutably and notifies subscribers.
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
  docsCache ??= parseDocs(readJson(DOCS_KEY));
  return docsCache;
}

export function getProfileSnapshot(): CompanyProfile {
  profileCache ??= parseProfile(readJson(PROFILE_KEY));
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
  writeJson(PROFILE_KEY, profile);
  notify();
}

/** Inserts or replaces a doc, keeping the list sorted by most recently updated. */
export function upsertDoc(doc: Doc): void {
  const others = getDocsSnapshot().filter((existing) => existing.id !== doc.id);
  docsCache = [doc, ...others];
  writeJson(DOCS_KEY, docsCache);
  notify();
}

export function deleteDoc(id: string): void {
  docsCache = getDocsSnapshot().filter((doc) => doc.id !== id);
  writeJson(DOCS_KEY, docsCache);
  notify();
}
