# Decisions — 2026-08-09 (daytime session)

One line per judgment call: what, why, and what it costs to reverse.

## Phase 0

- **Branch in place (`feat/2026-08-09`) rather than a separate worktree.** The
  overnight plan's worktree existed so Artem would wake to a pristine tree; with
  him at the keyboard, `git switch main` does the same job without splitting the
  editor and dev server across two paths. *Reverse: free — `git worktree add` any
  time.*
- **Baseline committed with the plan docs included.** They describe the work the
  branch does, so they belong in history rather than sitting untracked.
  *Reverse: free.*
- **Dev server port 3000 → 4310** in `.claude/launch.json`, and dropped
  `autoPort`. 3000 is held by another node process; a fixed known port means
  Artem can open the app any time without asking. *Reverse: free.*

## T1 — storage repository seam

- **The adapter interface is synchronous.** `useSyncExternalStore` requires a
  synchronous snapshot, so an async adapter would force a rewrite of the whole
  reactive store — far outside T1's box. An async backend (SQLite, hub API) still
  fits: it hydrates the in-memory cache asynchronously and keeps serving
  snapshots from the cache. *Reverse: moderate — the async variant is a new
  interface plus a hydration path, not a change to this one.*
- **Scoped to adapter + versioned codec; no generic `Repository<T>`.** Doc-level
  CRUD already exists in `storage.ts`, and swapping backends now means swapping
  one adapter. A parallel repository abstraction would add ceremony without a
  second consumer to justify it. *Reverse: cheap — add it when a second backend
  or a second entity type actually arrives.*
- **Moved to unversioned keys (`documake.profile`, `documake.docs`) with the old
  `*.v1` keys kept as a read fallback.** The version now lives in the envelope, so
  a version in the key name would be a second source of truth that immediately
  goes stale when T2 bumps the profile to v2. *Reverse: cheap — the legacy keys
  are still populated.*
- **Legacy keys are never written to and never deleted.** A rollback to an older
  build still finds its data. Costs a few stale bytes in localStorage.
  *Reverse: free.*
- **The read path is pure — it does not write forward after reading a legacy
  key.** Side effects in a read path are hard to reason about, and the next save
  writes the new key anyway. A profile that is never edited keeps reading the
  legacy key indefinitely, which is harmless. *Reverse: free.*
- **The migration chain is collected before any of it runs.** A gap mid-chain
  fails cleanly to the fallback instead of leaving a half-upgraded payload.
  *Reverse: free.*
- **A payload written by a newer build is parsed as-is, not migrated.** This
  build cannot know how to downgrade, but the shape is often still readable, and
  the fallback covers it when it is not. *Reverse: free.*
- **Persisted data never throws.** Every failure — absent, corrupt JSON, failed
  validation, missing migration — yields the codec's fallback. Stored data is
  untrusted input; losing it should not take the app down with it.
  *Reverse: free.*

## T5 — render API

- **Built T5 before T2/T3/T4** because it was the only remaining task with no
  open CP0 question. Its one coupling to T2 is the `profile` field, and a
  stateless endpoint takes a single profile object regardless of how many
  profiles the app stores. *Reverse: n/a.*
- **Logic lives in `src/lib/render-request.ts`; the route handler is a thin
  adapter.** Keeps the handler readable and lets validation, auth, and filename
  rules be unit-tested without constructing HTTP traffic. *Reverse: free.*
- **Auth is checked before JSON parsing and validation.** An unauthenticated
  caller learns nothing about the payload shape and cannot spend server CPU on
  a render. *Reverse: free.*
- **Bearer comparison is constant-time over SHA-256 digests.** Hashing first
  means both sides are always 32 bytes, which `timingSafeEqual` requires, and
  avoids leaking the secret's length. *Reverse: free.*
- **Endpoint is open when `DOCUMAKE_RENDER_SECRET` is unset**, following the
  hub's `CRON_SECRET` pattern. Local development needs no setup; anywhere the
  app is reachable by others, the variable must be set. Documented in
  `.env.example` and the README. *Reverse: free — but note the failure mode is
  open-by-default, so deployment needs to set it.*
- **Filenames are rejected, not sanitized,** when they fall outside
  `[A-Za-z0-9 ._-]`. The value lands in a `Content-Disposition` header where a
  quote or newline is header injection; a clear 400 beats silently mangling the
  caller's input. *Reverse: free.*
- **Errors use the house JSON envelope; success returns raw PDF bytes.** A
  binary endpoint cannot wrap its success payload in JSON, so the envelope
  applies to the failure path only. *Reverse: free.*
- **Render failures return a generic 500.** The payload already validated, so a
  throw here is a template or renderer fault; the detail belongs in the server
  log, not the response body. *Reverse: free.*
- **Added `vitest.config.mts`** for the `@/` path alias, so tests can import
  application modules the way the application does. `.mts` rather than `.ts`
  because Vite's native config loader warns on ESM-in-CJS. *Reverse: free.*
- **Added `!.env.example` to `.gitignore`.** The existing `.env*` rule would
  otherwise have swallowed the one env file that is meant to be committed.
  *Reverse: free.*
