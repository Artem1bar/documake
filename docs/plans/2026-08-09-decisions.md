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

## CP0 — answered without Artem, on his instruction to keep going

He asked to continue rather than wait, so these are my calls under the plan's
fence. All four are cheap to reverse; say the word and they change.

- **Q1 — merge policy: not merging.** Everything stays on `feat/2026-08-09`.
  The plan says merging is his call, and continuing to build does not require
  making it. *Reverse: n/a — nothing to undo.*
- **Q2 — brand profiles: no invented client data.** The migration turns the
  existing company profile into the first profile, and that is the only real
  data in the system. Preset brands ship in T3 as *style* presets — colour and
  type only, labelled "Sample", with company identity left blank — so nothing
  fabricates an address, tax ID, or client. *Reverse: cheap.*
- **Q3 — fonts: the three standard PDF families** (Helvetica, Times, Courier)
  rather than embedded brand faces. Verified in `@react-pdf/font`: these need
  no font files, so documents render identically offline and on any machine,
  and there is nothing to license or ship. It gives real typographic contrast
  today; `FontFamilySchema` takes new members when actual font files show up.
  *Reverse: cheap — embedding is additive.*
- **Q4 — money slots stay blank/"TBD".** Fence holds; Weblux pricing is still
  an open business decision. *Reverse: n/a.*

## T2 — multi-brand profiles

- **Profile operations live in `profile-store.ts` as pure functions**;
  `storage.ts` only caches and persists. Every operation returns a new store,
  which both satisfies the immutability rule and lets `useSyncExternalStore`
  compare snapshots by reference. *Reverse: free.*
- **The migrated and first-run profile share a fixed id, `"default"`.** A
  random id would make the migration non-deterministic and untestable.
  *Reverse: free.*
- **The migrated profile is labelled from its company name**, falling back to
  "My company" when that is blank — better than "Untitled" for the one profile
  a migrating user already has. *Reverse: free.*
- **`normalizeStore` runs inside the codec's `parse`,** so a store with zero
  profiles or a dangling active id cannot escape storage into the app. The
  invariant is enforced at the boundary rather than defended at every read.
  *Reverse: free.*
- **Deleting the last profile is refused, not confirmed.** There is no sensible
  empty state — every document needs a profile to render. The button is
  disabled with a reason rather than failing on click. *Reverse: free.*
- **Adding a profile switches to it**, since that is invariably why you added
  one. *Reverse: free.*
- **Branding fields land in T2; the branding UI lands in T3.** Shipping a
  colour picker that changes nothing would put a commit below the bar, so the
  schema gains the fields (the migration needs them) and the controls arrive
  with the rendering that honours them. *Reverse: free.*
- **`parseProfile` kept its old meaning** — parse one `CompanyProfile` — while
  the codec now yields a whole store. Renaming it would have churned a tested
  helper for no gain. *Reverse: free.*

## T3 — PDF brand theming

- **Only the accent colour and the typeface vary per profile.** Ink, muted,
  faint, and hairline stay shared. A document where everything is branded reads
  as noise; the accent lands on the wordmark, the table rule, and the total
  rule, and nowhere else. *Reverse: free.*
- **Static layout stylesheets stayed static.** Layout does not depend on
  branding, so only colour and font are applied inline from the theme. Keeps
  `StyleSheet.create` out of the render path. *Reverse: free.*
- **Themes are cached by `accent|font`, capped at 32 entries.** The live
  preview re-renders on every keystroke, and a dragged colour picker would
  otherwise grow the map without bound. *Reverse: free.*
- **`RenderProfile` (company fields + branding) is now the type templates take,
  and `BrandProfile` extends it with id and label.** One type describes "enough
  to render", which both the stored profile and an API payload satisfy — so the
  render endpoint got branding support for free. *Reverse: free.*
- **Fixed the INVOICE wordmark overlap** by giving `h1` an explicit
  `lineHeight`. The page's 1.45 left a 20pt wordmark sitting on the line below
  it. Spotted in the T5 evidence, fixed here because T3 was already in these
  templates. *Reverse: free.*
- **Brand token values were verified at source, not taken from the plan.**
  `#002b72` is weblux's `--color-ink`. The plan's `#bc4b00` is not written as
  hex anywhere in dave — it is `--accent-rgb: 188 75 0` in `ember.css`, which
  is the same colour. Both are cited in `brand-presets.ts`. *Reverse: free.*
- **Presets set colour and typeface only** — never company identity — so
  applying one cannot put a name or address you did not write into a document.
  A test asserts the preset shape stays that way. *Reverse: free.*
- **A third "Sample — Plain" preset** was added as the way back to the neutral
  default after trying a brand. *Reverse: free.*
- **`render-samples.tsx` now emits one invoice per preset**, so a theming
  change can be eyeballed in seconds. *Reverse: free.*

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
