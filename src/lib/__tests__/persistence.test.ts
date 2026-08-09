import { afterEach, describe, expect, it, vi } from "vitest";
import { createLocalStorageAdapter, createMemoryAdapter } from "../persistence/adapter";
import { readVersioned, writeVersioned } from "../persistence/versioning";
import type { VersionedCodec } from "../persistence/versioning";

/** A codec whose parse only accepts `{ n: number }`, so fallbacks are observable. */
function numberCodec(
  overrides: Partial<VersionedCodec<{ n: number }>> = {},
): VersionedCodec<{ n: number }> {
  return {
    key: "test.key",
    version: 1,
    migrations: {},
    fallback: { n: -1 },
    parse: (raw) =>
      typeof raw === "object" && raw !== null && typeof (raw as { n?: unknown }).n === "number"
        ? { n: (raw as { n: number }).n }
        : null,
    ...overrides,
  };
}

describe("memory adapter", () => {
  it("returns null for a key that was never written", () => {
    expect(createMemoryAdapter().read("missing")).toBeNull();
  });

  it("round-trips a written value", () => {
    const adapter = createMemoryAdapter();
    adapter.write("k", "v");
    expect(adapter.read("k")).toBe("v");
  });

  it("removes a key", () => {
    const adapter = createMemoryAdapter();
    adapter.write("k", "v");
    adapter.remove("k");
    expect(adapter.read("k")).toBeNull();
  });

  it("accepts seed data so tests can start from a known store", () => {
    expect(createMemoryAdapter({ seeded: "yes" }).read("seeded")).toBe("yes");
  });
});

describe("localStorage adapter", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("reads null when there is no window (server rendering)", () => {
    expect(createLocalStorageAdapter().read("anything")).toBeNull();
  });

  it("does not throw when writing without a window", () => {
    expect(() => createLocalStorageAdapter().write("k", "v")).not.toThrow();
  });

  it("delegates to window.localStorage when present", () => {
    const store = new Map<string, string>();
    vi.stubGlobal("window", {
      localStorage: {
        getItem: (k: string) => store.get(k) ?? null,
        setItem: (k: string, v: string) => void store.set(k, v),
        removeItem: (k: string) => void store.delete(k),
      },
    });

    const adapter = createLocalStorageAdapter();
    adapter.write("k", "v");
    expect(adapter.read("k")).toBe("v");
    adapter.remove("k");
    expect(adapter.read("k")).toBeNull();
  });

  it("swallows quota errors so the in-memory state keeps working", () => {
    vi.stubGlobal("window", {
      localStorage: {
        getItem: () => null,
        setItem: () => {
          throw new Error("QuotaExceededError");
        },
        removeItem: () => {},
      },
    });

    expect(() => createLocalStorageAdapter().write("k", "v")).not.toThrow();
  });
});

describe("versioned persistence", () => {
  it("writes a versioned envelope rather than a bare payload", () => {
    const adapter = createMemoryAdapter();
    writeVersioned(adapter, numberCodec({ version: 3 }), { n: 7 });

    expect(JSON.parse(adapter.read("test.key") ?? "null")).toEqual({
      version: 3,
      data: { n: 7 },
    });
  });

  it("round-trips a value it wrote itself", () => {
    const adapter = createMemoryAdapter();
    const codec = numberCodec();
    writeVersioned(adapter, codec, { n: 42 });

    expect(readVersioned(adapter, codec)).toEqual({ n: 42 });
  });

  it("returns the fallback when the key is absent", () => {
    expect(readVersioned(createMemoryAdapter(), numberCodec())).toEqual({ n: -1 });
  });

  it("returns the fallback when the stored JSON is corrupt", () => {
    const adapter = createMemoryAdapter({ "test.key": "{not json" });
    expect(readVersioned(adapter, numberCodec())).toEqual({ n: -1 });
  });

  it("returns the fallback when the payload fails validation", () => {
    const adapter = createMemoryAdapter({
      "test.key": JSON.stringify({ version: 1, data: { n: "not a number" } }),
    });
    expect(readVersioned(adapter, numberCodec())).toEqual({ n: -1 });
  });

  it("adopts a legacy unversioned payload as version 1", () => {
    const adapter = createMemoryAdapter({ "test.key": JSON.stringify({ n: 5 }) });
    expect(readVersioned(adapter, numberCodec())).toEqual({ n: 5 });
  });

  it("migrates a legacy unversioned payload up to the current version", () => {
    const adapter = createMemoryAdapter({ "test.key": JSON.stringify({ n: 5 }) });
    const codec = numberCodec({
      version: 2,
      migrations: { 1: (data) => ({ n: (data as { n: number }).n * 10 }) },
    });

    expect(readVersioned(adapter, codec)).toEqual({ n: 50 });
  });

  it("runs the migration chain in ascending order", () => {
    const order: number[] = [];
    const adapter = createMemoryAdapter({
      "test.key": JSON.stringify({ version: 1, data: { n: 1 } }),
    });
    const codec = numberCodec({
      version: 4,
      migrations: {
        1: (data) => {
          order.push(1);
          return { n: (data as { n: number }).n + 1 };
        },
        2: (data) => {
          order.push(2);
          return { n: (data as { n: number }).n + 1 };
        },
        3: (data) => {
          order.push(3);
          return { n: (data as { n: number }).n + 1 };
        },
      },
    });

    expect(readVersioned(adapter, codec)).toEqual({ n: 4 });
    expect(order).toEqual([1, 2, 3]);
  });

  it("skips migrations that are already applied", () => {
    const adapter = createMemoryAdapter({
      "test.key": JSON.stringify({ version: 2, data: { n: 1 } }),
    });
    const codec = numberCodec({
      version: 3,
      migrations: {
        1: () => ({ n: 999 }),
        2: (data) => ({ n: (data as { n: number }).n + 1 }),
      },
    });

    expect(readVersioned(adapter, codec)).toEqual({ n: 2 });
  });

  it("falls back when a migration step is missing from the chain", () => {
    const adapter = createMemoryAdapter({
      "test.key": JSON.stringify({ version: 1, data: { n: 1 } }),
    });
    const codec = numberCodec({ version: 3, migrations: { 1: (data) => data } });

    expect(readVersioned(adapter, codec)).toEqual({ n: -1 });
  });

  it("parses data written by a newer app version without migrating it", () => {
    const adapter = createMemoryAdapter({
      "test.key": JSON.stringify({ version: 9, data: { n: 3 } }),
    });
    const codec = numberCodec({
      version: 2,
      migrations: {
        1: () => ({ n: 999 }),
      },
    });

    expect(readVersioned(adapter, codec)).toEqual({ n: 3 });
  });

  it("falls back to a legacy key when the current key is absent", () => {
    const adapter = createMemoryAdapter({ "old.key": JSON.stringify({ n: 11 }) });
    const codec = numberCodec({ legacyKeys: ["old.key"] });

    expect(readVersioned(adapter, codec)).toEqual({ n: 11 });
  });

  it("prefers the current key over a legacy key", () => {
    const adapter = createMemoryAdapter({
      "test.key": JSON.stringify({ version: 1, data: { n: 1 } }),
      "old.key": JSON.stringify({ n: 99 }),
    });
    const codec = numberCodec({ legacyKeys: ["old.key"] });

    expect(readVersioned(adapter, codec)).toEqual({ n: 1 });
  });

  it("leaves the legacy key untouched when writing, so a rollback keeps its data", () => {
    const adapter = createMemoryAdapter({ "old.key": JSON.stringify({ n: 11 }) });
    const codec = numberCodec({ legacyKeys: ["old.key"] });

    writeVersioned(adapter, codec, { n: 22 });

    expect(JSON.parse(adapter.read("old.key") ?? "null")).toEqual({ n: 11 });
    expect(readVersioned(adapter, codec)).toEqual({ n: 22 });
  });

  it("does not treat a payload with a non-numeric version as an envelope", () => {
    const adapter = createMemoryAdapter({
      "test.key": JSON.stringify({ version: "1.0", n: 8 }),
    });
    const codec = numberCodec({
      parse: (raw) =>
        typeof raw === "object" && raw !== null && typeof (raw as { n?: unknown }).n === "number"
          ? { n: (raw as { n: number }).n }
          : null,
    });

    expect(readVersioned(adapter, codec)).toEqual({ n: 8 });
  });
});
