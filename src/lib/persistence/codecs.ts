import { DEFAULT_PROFILE } from "../factories";
import type { CompanyProfile, Doc } from "../types";
import { CompanyProfileSchema, DocSchema } from "../types";
import type { VersionedCodec } from "./versioning";

/**
 * Bump a version whenever the persisted shape changes, and add the matching
 * migration alongside it — `readVersioned` refuses to guess across a gap.
 */
export const PROFILE_VERSION = 1;
export const DOCS_VERSION = 1;

/**
 * Pre-versioning builds stored bare payloads under `*.v1` keys. Those keys are
 * read as a fallback and never written to again, so rolling back to an older
 * build still finds its data.
 */
const LEGACY_PROFILE_KEY = "documake.profile.v1";
const LEGACY_DOCS_KEY = "documake.docs.v1";

export const PROFILE_CODEC: VersionedCodec<CompanyProfile> = {
  key: "documake.profile",
  version: PROFILE_VERSION,
  migrations: {},
  legacyKeys: [LEGACY_PROFILE_KEY],
  fallback: DEFAULT_PROFILE,
  parse: (raw) => {
    const result = CompanyProfileSchema.safeParse(raw);
    return result.success ? result.data : null;
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
