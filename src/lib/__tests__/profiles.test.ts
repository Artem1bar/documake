import { describe, expect, it } from "vitest";
import { createMemoryAdapter } from "../persistence/adapter";
import { PROFILE_CODEC } from "../persistence/codecs";
import { readVersioned } from "../persistence/versioning";
import {
  activateProfile,
  activeProfile,
  addProfile,
  makeProfile,
  normalizeStore,
  removeProfile,
  upsertProfile,
} from "../profile-store";
import { DEFAULT_BRANDING, DEFAULT_PROFILE_STORE } from "../profile-defaults";
import type { ProfileStore } from "../types";
import { BrandProfileSchema } from "../types";

const legacyProfile = {
  name: "Legacy Co",
  address: "1 Old Key Lane",
  email: "legacy@example.com",
  currency: "EUR",
  invoicePrefix: "LEG-",
  nextInvoiceNumber: 42,
  paymentTermsDays: 30,
  defaultTaxRate: 19,
  defaultGoverningLaw: "Texas",
};

function storeWith(...labels: string[]): ProfileStore {
  const profiles = labels.map((label) => makeProfile(label));
  return { profiles, activeProfileId: profiles[0].id };
}

describe("BrandProfileSchema", () => {
  it("fills branding with defaults when absent", () => {
    const parsed = BrandProfileSchema.parse({ id: "a", label: "Acme" });
    expect(parsed.branding).toEqual(DEFAULT_BRANDING);
  });

  it("rejects an accent colour that is not a six-digit hex", () => {
    for (const accentColor of ["red", "#fff", "002b72", "#00zz72"]) {
      const result = BrandProfileSchema.safeParse({
        id: "a",
        label: "Acme",
        branding: { accentColor, fontFamily: "helvetica" },
      });
      expect(result.success, `expected ${accentColor} to be rejected`).toBe(false);
    }
  });

  it("rejects a font family outside the standard set", () => {
    const result = BrandProfileSchema.safeParse({
      id: "a",
      label: "Acme",
      branding: { accentColor: "#002b72", fontFamily: "Comic Sans" },
    });
    expect(result.success).toBe(false);
  });

  it("carries the company fields it inherits", () => {
    const parsed = BrandProfileSchema.parse({ id: "a", label: "Acme", name: "Acme Inc" });
    expect(parsed.name).toBe("Acme Inc");
    expect(parsed.currency).toBe("USD");
    expect(parsed.nextInvoiceNumber).toBe(1);
  });
});

describe("makeProfile", () => {
  it("gives every profile a distinct id", () => {
    expect(makeProfile("A").id).not.toBe(makeProfile("A").id);
  });

  it("applies the label and default branding", () => {
    const profile = makeProfile("Weblux");
    expect(profile.label).toBe("Weblux");
    expect(profile.branding).toEqual(DEFAULT_BRANDING);
  });
});

describe("normalizeStore", () => {
  it("repoints an active id that matches no profile", () => {
    const store = storeWith("A", "B");
    const broken = { ...store, activeProfileId: "gone" };

    expect(normalizeStore(broken).activeProfileId).toBe(store.profiles[0].id);
  });

  it("falls back to a default store when there are no profiles", () => {
    const normalized = normalizeStore({ profiles: [], activeProfileId: "" });

    expect(normalized.profiles).toHaveLength(1);
    expect(normalized.activeProfileId).toBe(normalized.profiles[0].id);
  });

  it("leaves a consistent store untouched", () => {
    const store = storeWith("A", "B");
    expect(normalizeStore(store)).toEqual(store);
  });
});

describe("profile operations", () => {
  it("returns the active profile", () => {
    const store = storeWith("A", "B");
    expect(activeProfile(store).label).toBe("A");
    expect(activeProfile(activateProfile(store, store.profiles[1].id)).label).toBe("B");
  });

  it("ignores activation of an unknown id", () => {
    const store = storeWith("A", "B");
    expect(activateProfile(store, "nope")).toEqual(store);
  });

  it("adds a profile and makes it active", () => {
    const store = storeWith("A");
    const profile = makeProfile("B");
    const next = addProfile(store, profile);

    expect(next.profiles).toHaveLength(2);
    expect(next.activeProfileId).toBe(profile.id);
  });

  it("replaces a profile in place, preserving order", () => {
    const store = storeWith("A", "B", "C");
    const renamed = { ...store.profiles[1], label: "B renamed" };
    const next = upsertProfile(store, renamed);

    expect(next.profiles.map((p) => p.label)).toEqual(["A", "B renamed", "C"]);
  });

  it("does not mutate the store it was given", () => {
    const store = storeWith("A", "B");
    const snapshot = JSON.stringify(store);

    upsertProfile(store, { ...store.profiles[0], label: "changed" });
    addProfile(store, makeProfile("C"));
    removeProfile(store, store.profiles[1].id);
    activateProfile(store, store.profiles[1].id);

    expect(JSON.stringify(store)).toBe(snapshot);
  });

  it("removes a profile", () => {
    const store = storeWith("A", "B");
    const next = removeProfile(store, store.profiles[1].id);

    expect(next.profiles.map((p) => p.label)).toEqual(["A"]);
  });

  it("moves the active pointer when the active profile is removed", () => {
    const store = storeWith("A", "B");
    const withBActive = activateProfile(store, store.profiles[1].id);
    const next = removeProfile(withBActive, store.profiles[1].id);

    expect(next.activeProfileId).toBe(store.profiles[0].id);
  });

  it("ignores removal of an unknown id", () => {
    const store = storeWith("A", "B");
    expect(removeProfile(store, "nope")).toEqual(store);
  });

  it("refuses to remove the last profile", () => {
    const store = storeWith("only");
    expect(removeProfile(store, store.profiles[0].id)).toEqual(store);
  });
});

describe("profile storage migration v1 -> v2", () => {
  it("wraps a legacy bare profile into a single-profile store", () => {
    const adapter = createMemoryAdapter({
      "documake.profile.v1": JSON.stringify(legacyProfile),
    });
    const store = readVersioned(adapter, PROFILE_CODEC);

    expect(store.profiles).toHaveLength(1);
    expect(store.activeProfileId).toBe(store.profiles[0].id);
    expect(store.profiles[0].name).toBe("Legacy Co");
    expect(store.profiles[0].currency).toBe("EUR");
    expect(store.profiles[0].nextInvoiceNumber).toBe(42);
  });

  it("labels the migrated profile from its company name", () => {
    const adapter = createMemoryAdapter({
      "documake.profile.v1": JSON.stringify(legacyProfile),
    });

    expect(readVersioned(adapter, PROFILE_CODEC).profiles[0].label).toBe("Legacy Co");
  });

  it("labels an unnamed migrated profile with a neutral fallback", () => {
    const adapter = createMemoryAdapter({
      "documake.profile.v1": JSON.stringify({ ...legacyProfile, name: "" }),
    });

    expect(readVersioned(adapter, PROFILE_CODEC).profiles[0].label).toBe("My company");
  });

  it("gives the migrated profile default branding", () => {
    const adapter = createMemoryAdapter({
      "documake.profile.v1": JSON.stringify(legacyProfile),
    });

    expect(readVersioned(adapter, PROFILE_CODEC).profiles[0].branding).toEqual(DEFAULT_BRANDING);
  });

  it("migrates a v1 envelope as well as a bare legacy payload", () => {
    const adapter = createMemoryAdapter({
      "documake.profile": JSON.stringify({ version: 1, data: legacyProfile }),
    });

    expect(readVersioned(adapter, PROFILE_CODEC).profiles[0].name).toBe("Legacy Co");
  });

  it("fills gaps in a partial legacy profile with defaults", () => {
    const adapter = createMemoryAdapter({
      "documake.profile.v1": JSON.stringify({ name: "Sparse Co" }),
    });
    const profile = readVersioned(adapter, PROFILE_CODEC).profiles[0];

    expect(profile.name).toBe("Sparse Co");
    expect(profile.currency).toBe("USD");
    expect(profile.branding).toEqual(DEFAULT_BRANDING);
  });

  it("reads back a v2 store it wrote itself", () => {
    const adapter = createMemoryAdapter({
      "documake.profile": JSON.stringify({ version: 2, data: storeWith("A", "B") }),
    });
    const store = readVersioned(adapter, PROFILE_CODEC);

    expect(store.profiles.map((p) => p.label)).toEqual(["A", "B"]);
  });

  it("falls back to a usable store when nothing is stored", () => {
    expect(readVersioned(createMemoryAdapter(), PROFILE_CODEC)).toEqual(DEFAULT_PROFILE_STORE);
  });

  it("normalizes a stored store whose active id dangles", () => {
    const store = storeWith("A", "B");
    const adapter = createMemoryAdapter({
      "documake.profile": JSON.stringify({
        version: 2,
        data: { ...store, activeProfileId: "dangling" },
      }),
    });

    expect(readVersioned(adapter, PROFILE_CODEC).activeProfileId).toBe(store.profiles[0].id);
  });
});
