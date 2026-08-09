import { DEFAULT_PROFILE } from "./factories";
import { createLocalStorageAdapter } from "./persistence/adapter";
import { DOCS_CODEC, PROFILE_CODEC } from "./persistence/codecs";
import { readVersioned, writeVersioned } from "./persistence/versioning";
import {
  activateProfile,
  activeProfile,
  addProfile,
  makeProfile,
  removeProfile,
  upsertProfile,
} from "./profile-store";
import type { BrandProfile, CompanyProfile, Doc, ProfileStore } from "./types";
import { CompanyProfileSchema } from "./types";

/**
 * The one place a backend is chosen. Swapping this for a SQLite or hub-backed
 * adapter is the whole point of the seam; nothing below this line knows where
 * the bytes live.
 */
const adapter = createLocalStorageAdapter();

/** Parses unknown JSON into a company profile, falling back to defaults. */
export function parseProfile(raw: unknown): CompanyProfile {
  const result = CompanyProfileSchema.safeParse(raw);
  return result.success ? result.data : DEFAULT_PROFILE;
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
let profileStoreCache: ProfileStore | null = null;
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

export function getProfileStoreSnapshot(): ProfileStore {
  profileStoreCache ??= readVersioned(adapter, PROFILE_CODEC);
  return profileStoreCache;
}

/** The active profile. A member of the cached store, so its reference is
 *  stable until the store itself changes. */
export function getProfileSnapshot(): BrandProfile {
  return activeProfile(getProfileStoreSnapshot());
}

export function loadProfile(): BrandProfile {
  return getProfileSnapshot();
}

export function getDoc(id: string): Doc | null {
  return getDocsSnapshot().find((doc) => doc.id === id) ?? null;
}

function commitProfileStore(next: ProfileStore): void {
  profileStoreCache = next;
  writeVersioned(adapter, PROFILE_CODEC, next);
  notify();
}

export function saveProfile(profile: BrandProfile): void {
  commitProfileStore(upsertProfile(getProfileStoreSnapshot(), profile));
}

export function setActiveProfile(id: string): void {
  commitProfileStore(activateProfile(getProfileStoreSnapshot(), id));
}

/** Creates a profile, switches to it, and hands it back to the caller. */
export function createProfile(
  label: string,
  overrides: Partial<BrandProfile> = {},
): BrandProfile {
  const profile = makeProfile(label, overrides);
  commitProfileStore(addProfile(getProfileStoreSnapshot(), profile));
  return profile;
}

/** No-op when `id` is the last remaining profile. */
export function deleteProfile(id: string): void {
  commitProfileStore(removeProfile(getProfileStoreSnapshot(), id));
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
