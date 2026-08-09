import type { StorageAdapter } from "./adapter";

/** Upgrades a payload from version N to version N+1. */
export type Migration = (data: unknown) => unknown;

export interface VersionedCodec<T> {
  /** Key the current build reads from and writes to. */
  key: string;
  /** Schema version this build writes. */
  version: number;
  /** `migrations[n]` upgrades a version-`n` payload to version `n + 1`. */
  migrations: Readonly<Record<number, Migration>>;
  /** Validates a migrated payload. Returns null when it is unusable. */
  parse: (raw: unknown) => T | null;
  /** Returned whenever the stored payload is absent, corrupt, or unusable. */
  fallback: T;
  /** Older keys to read from, newest first, when `key` holds nothing. */
  legacyKeys?: readonly string[];
}

interface Envelope {
  version: number;
  data: unknown;
}

/**
 * Payloads written before versioning existed are bare values under their own
 * key, so they are read as version 1 and migrated forward from there.
 */
const LEGACY_VERSION = 1;

function isEnvelope(value: unknown): value is Envelope {
  return (
    typeof value === "object" &&
    value !== null &&
    typeof (value as Partial<Envelope>).version === "number" &&
    "data" in value
  );
}

function parseJson(raw: string): { ok: true; value: unknown } | { ok: false } {
  try {
    return { ok: true, value: JSON.parse(raw) };
  } catch {
    return { ok: false };
  }
}

function readEnvelope<T>(
  adapter: StorageAdapter,
  codec: VersionedCodec<T>,
): Envelope | null {
  const keys = [codec.key, ...(codec.legacyKeys ?? [])];

  for (const key of keys) {
    const raw = adapter.read(key);
    if (raw === null) continue;

    const parsed = parseJson(raw);
    if (!parsed.ok) return null;

    return isEnvelope(parsed.value)
      ? parsed.value
      : { version: LEGACY_VERSION, data: parsed.value };
  }

  return null;
}

/**
 * Collects the migration chain before running any of it, so a gap mid-chain
 * fails cleanly instead of leaving the payload half-upgraded.
 */
function migrate<T>(
  envelope: Envelope,
  codec: VersionedCodec<T>,
): { ok: true; data: unknown } | { ok: false } {
  const steps: Migration[] = [];

  for (let version = envelope.version; version < codec.version; version += 1) {
    const step = codec.migrations[version];
    if (!step) return { ok: false };
    steps.push(step);
  }

  return {
    ok: true,
    data: steps.reduce<unknown>((data, step) => step(data), envelope.data),
  };
}

/**
 * Reads, migrates, and validates a stored payload. Any failure along the way
 * yields the codec's fallback rather than throwing — persisted data is
 * untrusted input, and losing it should never take the app down with it.
 *
 * A payload written by a newer build (stored version above the current one) is
 * parsed as-is: this build cannot know how to downgrade it, but the shape is
 * often still readable, and the fallback covers it when it is not.
 */
export function readVersioned<T>(
  adapter: StorageAdapter,
  codec: VersionedCodec<T>,
): T {
  const envelope = readEnvelope(adapter, codec);
  if (!envelope) return codec.fallback;

  const migrated = migrate(envelope, codec);
  if (!migrated.ok) return codec.fallback;

  return codec.parse(migrated.data) ?? codec.fallback;
}

/**
 * Writes to the codec's current key only. Legacy keys are left untouched so a
 * rollback to an older build still finds its data.
 */
export function writeVersioned<T>(
  adapter: StorageAdapter,
  codec: VersionedCodec<T>,
  value: T,
): void {
  const envelope: Envelope = { version: codec.version, data: value };
  adapter.write(codec.key, JSON.stringify(envelope));
}
