import {
  DEFAULT_BRAND_PROFILE,
  DEFAULT_PROFILE_ID,
  DEFAULT_PROFILE_STORE,
} from "./profile-defaults";
import type { BrandProfile, ProfileStore } from "./types";
import { BrandProfileSchema } from "./types";

/**
 * Pure operations over the profile store. Every one returns a new store rather
 * than editing the one it was given, so the reactive cache in `storage.ts` can
 * compare snapshots by reference.
 */

export function makeProfile(
  label: string,
  overrides: Partial<BrandProfile> = {},
): BrandProfile {
  return BrandProfileSchema.parse({
    ...overrides,
    id: crypto.randomUUID(),
    label,
  });
}

/** Guarantees the invariants the rest of the app relies on: at least one
 *  profile, and an active id that actually points at one of them. */
export function normalizeStore(store: ProfileStore): ProfileStore {
  if (store.profiles.length === 0) return DEFAULT_PROFILE_STORE;

  const hasActive = store.profiles.some(
    (profile) => profile.id === store.activeProfileId,
  );

  return hasActive ? store : { ...store, activeProfileId: store.profiles[0].id };
}

export function activeProfile(store: ProfileStore): BrandProfile {
  return (
    store.profiles.find((profile) => profile.id === store.activeProfileId) ??
    store.profiles[0] ??
    DEFAULT_BRAND_PROFILE
  );
}

/** Replaces a profile by id, keeping list order. Appends if the id is new. */
export function upsertProfile(
  store: ProfileStore,
  profile: BrandProfile,
): ProfileStore {
  const exists = store.profiles.some((existing) => existing.id === profile.id);

  return {
    ...store,
    profiles: exists
      ? store.profiles.map((existing) =>
          existing.id === profile.id ? profile : existing,
        )
      : [...store.profiles, profile],
  };
}

/** Appends a profile and switches to it, which is what adding one is for. */
export function addProfile(
  store: ProfileStore,
  profile: BrandProfile,
): ProfileStore {
  return {
    profiles: [...store.profiles, profile],
    activeProfileId: profile.id,
  };
}

/** Removing the last profile would leave nothing to fall back to, so it is
 *  refused; the caller keeps the store it had. */
export function removeProfile(store: ProfileStore, id: string): ProfileStore {
  if (store.profiles.length <= 1) return store;

  const profiles = store.profiles.filter((profile) => profile.id !== id);
  if (profiles.length === store.profiles.length) return store;

  return normalizeStore({ ...store, profiles });
}

export function activateProfile(store: ProfileStore, id: string): ProfileStore {
  const exists = store.profiles.some((profile) => profile.id === id);
  return exists ? { ...store, activeProfileId: id } : store;
}

/**
 * Upgrades a pre-multi-profile payload: the single company profile becomes the
 * one profile in the store, and the active one. Missing fields are left for
 * the schema to fill, so a partial legacy payload still survives.
 */
export function migrateProfileV1ToV2(data: unknown): unknown {
  const legacy =
    typeof data === "object" && data !== null
      ? (data as Record<string, unknown>)
      : {};
  const name = typeof legacy.name === "string" ? legacy.name.trim() : "";

  return {
    profiles: [{ ...legacy, id: DEFAULT_PROFILE_ID, label: name || "My company" }],
    activeProfileId: DEFAULT_PROFILE_ID,
  };
}
