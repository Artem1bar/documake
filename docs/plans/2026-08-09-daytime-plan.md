# Documake — Daytime Development Plan

Sun 2026-08-09, from 12:00 CDT · adapted from `docs/overnight/2026-08-09-plan.md`
Framework: CONTRACT/FENCE/ISOLATE/ORIENT/REALITY/PLAN/LOOP/BAR/FLEET/WRAP

> **The overnight run never executed.** No `git init`, no worktree, no commits. The
> tree is the same v1 baseline from ~23:00 Saturday. The overnight plan stays on
> disk as a record of an unrun night; this document supersedes it.

## What changed, and why

The overnight plan was engineered around one constraint: **nobody is awake.** Every
rule below that changed, changed because that constraint is gone.

| Overnight | Daytime | Why |
|---|---|---|
| Decide–record–move-on; no decision blocks >5 min | **Ask–decide–move-on**, questions batched into 4 checkpoints | A question costs 30s now. A wrong autonomous call costs an hour. But 40 interruptions cost more than either — hence batching. |
| Hard pencils-down at T=08:00 | **No clock. A queue with a cut line.** | Daytime gets interrupted. Timelines break; ordered queues survive a 2-hour gap. |
| Nothing merges; Artem reviews the whole diff in the morning | **Merge per task**, after a live OK | Four warm 200-line diffs beat one cold 2000-line diff. |
| Dedicated worktree at `~/documake-nightly` | **Branch in place**, no worktree | The worktree existed so you'd wake to a pristine tree. You're here — `git switch main` does the same job in one second, and your editor and dev server stay pointed at one path. |
| Score = V × unattended-confidence ÷ E | **Score = V ÷ E**, with a 🔵 needs-Artem tag | Low confidence at night meant *risk*. In daylight it means *a question*. Stop taxing tasks for it. |
| Fleet: Fable orchestrator + Opus/Sonnet subagents, self-judging | **Main loop, single-threaded; you are the judge** | The fleet existed to replace a missing human reviewer. |
| Evidence archived to `docs/overnight/evidence/` | Screenshots shown inline; dev server left running | Archiving matters when nobody's looking until morning. |
| Handoff = morning script | **Resume note** at any stop point | Optimized for "back after lunch," not "back after eight hours." |

Unchanged, because these were never about the hour: the ship bar, no fake content,
no invented prices, no secrets, tests-first, other repos read-only.

## CONTRACT

- **Window:** open-ended from 12:00. No pencils-down. The plan is a queue, not a
  timeline — every task is independently shippable, so any stop point is clean.
- **Mode:** ask–decide–move-on. Open questions collect into the next checkpoint
  rather than interrupting immediately. One exception: anything that would take
  more than ~10 minutes to reverse gets asked *before* it's built, not after.
- **Decisions log** (`docs/plans/2026-08-09-decisions.md`) still gets one line per
  judgment call. Not for your benefit at 8am — for mine at 4pm, when I've forgotten
  why noon-me picked something.
- **Merging is yours.** I build, gate, show, and ask. You say merge or not.

## FENCE

Carried over unchanged:

- **No deploy, no publish.** No `vercel`, no `npm publish`. No remote exists and
  none gets added today.
- **No secrets.** Never read other projects' `.env`. The render-API bearer token is
  an optional env var documented in `.env.example` only. Secret-scan every diff
  before commit.
- **No fake content:**
  - Sample brand profiles are labeled "Sample" in both the name and the UI.
  - **No invented prices.** Weblux's own pricing is an open business decision
    (per the 2026-08-08 ecosystem research). Quote/SOW money slots default to
    blank or "TBD".
  - No new legal boilerplate beyond the existing NDA pattern. The not-legal-advice
    disclaimer stays on every legal template.
- **Other repos are read-only reference** (`central.hub`, `weblux*`, `dave`, `crm`,
  `lawai*`, `ava`). Never modified, never imported from. Brand token *values* may be
  copied with a source comment.

Relaxed for daylight:

- **New dependencies:** a question, not a prohibition. Still pinned, still logged,
  still no majors — but "task is impossible without it" was an unattended-run
  standard. You can just tell me yes or no.

New, because you're at the keyboard:

- **Don't grab the machine.** No `pkill`, no global process operations, no port
  stealing. The dev server binds one known port and stays up so you can look at it
  any time without asking me to start it.

## ISOLATE

- **Phase 0 still required** (it never ran): `git init`, `.gitignore` check, baseline
  commit of v1 on `main`. Roughly 10 minutes.
- Then `git switch -c feat/2026-08-09` and work **in place** at `~/documake`. No
  worktree — see the rationale table. `main` holds the baseline; `git switch main`
  restores it instantly if you want to compare.
- **Dev server on port 4310.** Verified just now: `:3000` is held by a node process,
  `:8000` by Python. 4310 is free. Started once, left running all session.
- Disposable data only: vitest fixtures, and browser localStorage under the `:4310`
  origin is scratch.

## ORIENT (~15 min, down from 45)

The overnight budget was 45 minutes because eight unattended hours of decisions had
to be pre-loaded. Today the context is sitting in the chair. So:

- **Up front (required):** Documake's own `src/lib/*`, `src/components/pdf/theme.ts`,
  and the three PDF templates. Plus `AGENTS.md` — this is Next.js 16 and the docs
  live in `node_modules/next/dist/docs/`; the route-handler guide gets read before
  T5, not from memory.
- **Just-in-time (only when a task needs it):** weblux `docs/onboarding/templates/map.md`
  and `04-proposal-and-agreement.md` for T4/T6/T7 section specs; weblux
  `src/app/globals.css` + weblux-hf `app/design-brief.md` for the palette; dave
  `packages/amber-ui/src/styles/ember.css` for ember tokens.
- **Verify against installed source, not memory:** `@react-pdf/renderer` v4.6
  `renderToBuffer` server-side, and the zod 4 API for any new schema work.

## REALITY (verified 11:45 CDT, this session — not carried over)

- **The overnight run did not happen.** No git, no branches, no nightly commits.
- **Baseline gates are green**, re-run just now:
  - `npm run build` ✓ — compiles in 671ms, 5 routes (`/`, `/_not-found`,
    `/documents/[id]`, `/new/[type]`, `/settings`)
  - `npx tsc --noEmit` ✓ — clean
  - `npx vitest run` ✓ — **18 tests across 2 files**, 222ms
- **Correction to the overnight plan:** its REALITY section recorded "44 tests ✓".
  The actual suite is 18 tests in `invoice-math.test.ts` and `schemas.test.ts`.
  The early-exit clause is moot — baseline is green either way — but the coverage
  picture is thinner than the plan implied, which sharpens the test-first rule below.
- **central.hub:** `feat/assistant-and-polish`, 22 dirty files, 3 worktrees. Hub
  *implementation* stays out of scope — verdict unchanged, and re-verified rather
  than assumed.
- **weblux:** `feat/animated-glass`, 22 dirty → read-only, copy values not files.
  weblux-hf clean, dave clean, crm 27 dirty.
- **No competing unattended run** is active on this machine now. The overnight
  "max 3 subagents" resource rule is obsolete; "you're using this machine" replaces it.

## PLAN — requeued for daytime

Score is now **V ÷ E**. 🔵 marks a task with an open question — it's routed to a
checkpoint, not penalized. The night column shows what the confidence tax was doing.

| # | Task | V | E | Score | (night) | Box | Gate |
|---|------|---|---|-------|---------|-----|------|
| T1 | Storage repository seam — adapter interface over localStorage, schema-versioned persistence | 6 | 1 | **6.0** | 5.7 | 40m | — |
| T2 | Multi-brand profiles — `profiles[]` + active id, tested v1→v2 migration, switcher UI, per-profile identity/branding | 9 | 3 | **3.0** | 2.6 | 90m | 🔵 Q2 |
| T3 | PDF brand theming — per-profile tokens through `theme.ts`, two labeled sample presets, font embedding w/ Helvetica fallback | 8 | 2 | **4.0** | 3.2 | 60m | 🔵 Q3 |
| T4 | Quote/Proposal template — schema + form + PDF + tests, reuses invoice-math, validity date, acceptance line | 8 | 2.5 | **3.2** | 2.9 | 75m | 🔵 Q4 |
| T5 | Stateless render API — `POST /api/render`, zod-validated, optional bearer secret, integration tests | 7 | 2 | **3.5** | 3.2 | 45m | — |
| T6 | SOW template — scope/deliverables/milestones/payment schedule (amounts TBD), assumptions, change control | 7 | 2.5 | **2.8** | 2.0 | 60m | 🔵 CP2 |
| T7 | "The Map" report template — weblux 3-table structure | 8 | 4 | **2.0** | 1.2 | 60m | 🔵 CP2 |
| T8 | ~~Hub-division integration RFC~~ → **a 15-minute conversation at CP2** | — | — | — | — | 15m | 🔵 |

**Order:** T1 → T2 → T3 → T4 → T5 → (T6 or T7). Dependency-driven: T3's per-profile
tokens need T2's profile shape; T4 and T6 reuse invoice-math from the existing code.

**Two things worth knowing about the order:**

- **T5 is nearly independent.** It needs T1's seam and the existing templates, and
  nothing from T2–T4 except the eventual shape of its `profile` field. If you want a
  demo-able win early, or something to hand another project today, T5 can jump to
  second. It's also the one task genuinely parallelizable against T4.
- **T7 is the biggest mover** (1.2 → 2.0, +67%). It scored badly overnight purely
  because "what are the three tables" was unanswerable at 3am. It's a two-minute
  conversation now. It's no longer a stretch goal — it's a real candidate.

**Cut lines against focused hours** (focused ≠ wall clock):

- T1–T3 ≈ 3.2h → multi-brand theming lands. The session is a success here.
- T1–T5 ≈ 5.2h → plus quoting and the render API. This is the ambitious-but-real target.
- Everything ≈ 7.2h → unlikely today, and that's fine.

**T8 changed character.** Overnight it was a written RFC for a future joint session,
because the decisions needed you. You're here — so it's just the conversation, and
the RFC only gets written if we decide something worth recording. Hub's tree is
still dirty, so implementation stays out either way.

## CHECKPOINTS — the batching rhythm

Four interruptions, not forty.

- **CP0 — now, ~10 min.** Four questions, one batch (below). Answering them unblocks
  T1 through T4 with no further stops.
- **CP1 — after T3.** The one checkpoint that has to be visual: we look at a themed
  PDF together in the browser. Theming is a taste call and no test catches "it looks
  wrong."
- **CP2 — after T5.** Curl the render API together. Decide T6 vs T7 vs stop, and have
  the hub conversation (T8) if there's appetite.
- **CP3 — whenever you stop.** Resume note, decisions log, `git log`.

### CP0 questions

1. **Session shape + merge policy.** Roughly how long today — and do you want each
   task merged to `main` as it passes gates, or all of it held on the branch for one
   review at the end? *(Recommendation: merge per task. Small warm diffs, and the
   gates protect `main`.)*
2. **T2 — which brands?** Weblux plus one labeled "Sample" preset, or do you want
   real client profiles seeded? The fence requires samples be labeled as such.
3. **T3 — fonts.** Do you have Instrument Serif (and any other brand faces) as local
   files? If not, T3 ships Helvetica fallback today and font embedding becomes a
   follow-up — that's a real quality difference in the output, so it's your call
   rather than mine.
4. **T4 — money slots.** Confirming the fence holds: quote/SOW amounts default blank
   or "TBD", nothing invented, since Weblux pricing is still open. Say so if you'd
   rather they carry placeholder structure instead.

## LOOP (per task)

1. **Research** — read target files and installed-package source. No memory-coding.
2. **Plan** — one line in the decisions log. Not five; you're watching.
3. **Test** — failing vitest first for all logic: migrations, math, schemas, API.
   The baseline is 18 tests, thinner than the overnight plan believed, so this step
   does not get skipped.
4. **Build** — house rules: small files, immutable updates, zod at boundaries, no
   hardcoded values.
5. **Verify** — `npx tsc --noEmit` + `npx vitest run` + `npm run build`, then a real
   browser pass on `:4310` with a clean console. Screenshot goes to you inline.
6. **Commit** — one task, one conventional commit, no AI-attribution trailer. Then
   offer the merge.

## BAR

- **"I'd ship it to a Weblux client Monday."** Monday is tomorrow, which sharpens it
  rather than changing it. Below the bar gets fixed or reverted — no WIP left on the
  branch.
- **Two strikes, then ask** (was three). A strike is a verify gate still red after a
  genuine fix attempt. The third strike existed because nobody could be consulted.
- **Never weaken or delete a test to get green.** Fix the implementation. Unchanged.
- A parked task gets its findings written down and its commits reset — same as night.

## FLEET

- **Default: main loop, single-threaded, you judging.** The overnight fleet —
  Fable orchestrating, Opus building, Sonnet sweeping, everything adversarially
  self-reviewed — existed to synthesize a reviewer who was asleep. That's expensive
  and lossy compared to just asking you.
- **This session is configured not to spawn subagents unless you ask.** If you want
  fan-out, say so and I'll use it where it actually pays: T4 form work alongside T5
  API work, or a bounded conformance sweep (immutability, file size, hardcoded
  values, secret scan) after T3 and T5.
- Every gate is run for real and every result pasted. No claimed-but-unrun output.

## WRAP (at any stop point, not a fixed hour)

- **Decisions log** — running, one line per call. The durable artifact.
- **Resume note** — where the queue stands, what's next, and the exact command to
  pick it up. Written for "back after lunch" as much as "back Tuesday."
- **No separate report doc** unless the session runs long. With conventional commits
  and small diffs, `git log --oneline main..feat/2026-08-09` is the report.
- **End state:** tree green, nothing WIP, dev server running or cleanly stopped,
  `main` either merged-to or untouched — your call from CP0.
