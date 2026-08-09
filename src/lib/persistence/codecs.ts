import { DEFAULT_PROFILE_STORE } from "../profile-defaults";
import { migrateProfileV1ToV2, normalizeStore } from "../profile-store";
import type { Doc, ProfileStore } from "../types";
import { DocSchema, ProfileStoreSchema } from "../types";
import type { VersionedCodec } from "./versioning";

/**
 * Bump a version whenever the persisted shape changes, and add the matching
 * migration alongside it — `readVersioned` refuses to guess across a gap.
 *
 * Profile v2 replaced the single company profile with a list plus an active id.
 */
export const PROFILE_VERSION = 2;
export const DOCS_VERSION = 1;

/**
 * Pre-versioning builds stored bare payloads under `*.v1` keys. Those keys are
 * read as a fallback and never written to again, so rolling back to an older
 * build still finds its data.
 */
const LEGACY_PROFILE_KEY = "documake.profile.v1";
const LEGACY_DOCS_KEY = "documake.docs.v1";

export const PROFILE_CODEC: VersionedCodec<ProfileStore> = {
  key: "documake.profile",
  version: PROFILE_VERSION,
  migrations: { 1: migrateProfileV1ToV2 },
  legacyKeys: [LEGACY_PROFILE_KEY],
  fallback: DEFAULT_PROFILE_STORE,
  parse: (raw) => {
    const result = ProfileStoreSchema.safeParse(raw);
    return result.success ? normalizeStore(result.data) : null;
  },
};

export const DOCS_CODEC: VersionedCodec<Doc[]> = {
  key: "documake.docs",
  version: DOCS_VERSION,
  migrations: {},
  legacyKeys: [LEGACY_DOCS_KEY],
  fallback: [],
  /** Individually invalid documents are dropped rather than failing the list. */
  parse: (raw) =>
    Array.isArray(raw)
      ? raw
          .map((entry) => DocSchema.safeParse(entry))
          .filter((result) => result.success)
          .map((result) => result.data)
      : null,
};
