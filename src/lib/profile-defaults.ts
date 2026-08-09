import type { Branding, BrandProfile, ProfileStore } from "./types";
import { BrandingSchema, BrandProfileSchema } from "./types";

/**
 * Stable id for the profile a first-run browser gets, and for the one a
 * pre-multi-profile install is migrated into. Fixed rather than random so the
 * migration is deterministic and testable.
 */
export const DEFAULT_PROFILE_ID = "default";

export const DEFAULT_BRANDING: Branding = BrandingSchema.parse({});

export const DEFAULT_BRAND_PROFILE: BrandProfile = BrandProfileSchema.parse({
  id: DEFAULT_PROFILE_ID,
  label: "My company",
});

export const DEFAULT_PROFILE_STORE: ProfileStore = {
  profiles: [DEFAULT_BRAND_PROFILE],
  activeProfileId: DEFAULT_PROFILE_ID,
};
