# Prompt: add a research-backed "Deck" template to Documake

Paste everything below this line into a Claude Code session opened in `~/documake`.

---

You are working in the Documake repo (Next.js 16.3, React 19.2, TypeScript, Zod 4, Tailwind 4, Vitest; local-first, documents persist as versioned envelopes behind a `StorageAdapter`; brand profiles carry `accentColor` and `fontFamily`; PDF templates live in `src/components/pdf/`, forms in `src/components/forms/`, schemas in `src/lib/types.ts`, and `POST /api/render` renders stateless documents). Read `AGENTS.md`, `README.md`, and the Next.js guides in `node_modules/next/dist/docs/` before writing code.

## Goal

Turn an existing hand-built presentation into a Documake template family called **Deck**, then add a research pipeline that fills a deck from a one-paragraph brief. Three parts:

1. **Template extraction.** A pure renderer: `deck.json` + `theme.json` → one self-contained HTML file. Colors, fonts, labels, icons and card counts become hot-swappable data.
2. **Documake integration.** A "Deck" document type with the usual form-left, live-preview-right editor, autosave, brand-profile defaults, HTML export, and a `type: "deck"` branch in the render API.
3. **Research pipeline.** Multi-agent, parallel, time-boxed research over a pre-selected allowlist of credible sources. Every number on a slide carries a source and an as-of date. Nothing unverified ships silently.

## The reference deck

- File: `/Users/artembaranovski/presentations/american-airlines/index.html` (single file, about 58 KB, zero runtime dependencies). Its `README.md` in the same folder documents shortcuts, deployment, and the sources behind every figure. Live copy: https://four-moments-aa.vercel.app
- Structure: a cover plus four sections ("Exciters", "Enragers", "So-whats", "Complementaries"), each with an eyebrow, a headline with one emphasized phrase, a lede, a left-column hero widget, a 2×2 grid of icon cards, a takeaway strip, and a tiny sources line. Per-section accent colors drive the ambient orbs, icon badges, progress bar and dots.
- Hero widgets in use: **ladder** (tier bars with counting numbers), **board** (departure rows with a cycling status chip and a big stat), **gauge** (a value against a threshold), **receipt** (line items with an animated total). These four become the widget vocabulary of the template.
- Engine behavior to preserve exactly: keyboard, wheel and touch navigation; hash links (`#3`); `?` shortcuts overlay; `F` full screen; `?still=1&chrome=0` mode for screenshots; print to one landscape page per slide; `prefers-reduced-motion`; viewport fit at 1920×1080, 1280×720, 768×1024 and 667×375, with scrolling allowed only in phone portrait (375×667).

Read the whole file first. Do not rewrite the CSS/JS engine; lift it into the renderer and replace the hard-coded content and colors with template slots.

## Part 1: template extraction

Create `src/lib/deck/` with:

- `schema.ts`: Zod schemas `DeckSchema` and `DeckThemeSchema`, exported types, and `parseDeck` / `parseTheme` helpers that fail with readable messages.
- `render.ts`: `renderDeck(deck, theme): string`. Pure, synchronous, no React, no DOM. HTML-escape every text field. Allow `**bold**` in card bodies (render as `<strong>`) and a single `_emphasis_` span in headlines (render as the gradient `<em>`). No other markup passes through.
- `themes.ts`: built-in presets. Ship at least: `midnight-steel` (the reference palette), `cognac` (warm amber and copper), `cobalt`, `forest`, `graphite` (near-monochrome). A theme is: `bg`, `text`, `glass` (0 to 1, maps to blur and alpha), `radius`, `fontStack`, `grain` (bool), and `accents` with one hex per role: `cover` plus one per section. Derive the tint (`accent-2`) and the RGB triplet in code so a user picks exactly one color per section.
- `contrast.ts`: WCAG contrast helper. Tests must assert body text ≥ 4.5:1 on the ground and every derived tint ≥ 3:1 on the ground, for every preset.
- `icons.ts`: the fixed icon set from the reference file (Lucide paths, ISC license) keyed by name. Cards choose icons by name; unknown names fail validation.

Content model (`DeckSchema`), keep it this shape unless the code forces a change:

```
deck
  meta: { title, description, lang, noindex, canonicalUrl?, ogImageUrl? }
  brand: { name, tagline }                      // top-left pill
  cover: { eyebrow, headline, lede, stats[4]: { value, label, count?: { prefix, suffix, decimals } },
           agenda: derived from sections, hint, disclaimer, sourcesLine }
  sections[3..5]: {
    id, number, label, accentRole,
    eyebrow, headline, lede,
    hero: { kind: "ladder" | "board" | "gauge" | "receipt", ...kind-specific fields },
    cards[3..4]: { icon, title, body, claimIds?: string[] },
    takeaway: { icon, lead, text },
    sources: string
  }
  claims: ClaimLedger                            // see Part 3; every number in copy references a claim id
```

Quick adjustments the schema must make trivial: company name and tagline, section labels and their spelling (for example "Complementaries" vs "Complimentaries"), one accent per section, preset switch, card count 3 or 4, icon per card, cover stats, show or hide the sources lines, `noindex`, and whether the shortcuts button is shown.

Tests (Vitest): schema round-trips; renderer snapshot for the reference content must reproduce the reference deck's DOM structure (same element tree, same class names, same data attributes); contrast test across presets; escaping test with hostile strings; a test that every `claimId` referenced in copy exists in the ledger.

## Part 2: Documake integration

- Add document type `deck` (template `four-moments`) next to invoice, quote, SOW, NDA and questionnaire: dashboard card, `/new/deck`, editor at `/documents/[id]` with the form on the left and a live preview on the right (an `iframe` fed by `srcdoc` from `renderDeck`). Debounce re-render; the preview must keep the current slide across edits (read and re-apply the hash).
- Persist through the existing store and envelope versioning; add the migration step; Zod at the boundary; corrupt data falls back to a default deck, never throws.
- Defaults from the active brand profile: `brand.name` from the company name, cover accent from `accentColor`. Deck theme overrides live on the document.
- Exports: download the HTML file; "Copy share link" is out of scope (no server). Print-to-PDF stays a browser action, documented in the editor's help.
- Render API: `POST /api/render` with `type: "deck"` returns `text/html`. Validate input with the same schemas. Add a test.
- Keep the invoice pipeline untouched. New files under 400 lines; split by feature.

## Part 3: research pipeline

Input: a brief (company, framework sections with one-line definitions, audience, tone, optional must-include facts, optional year). Output: `deck.json` and `claims.json`.

### Source allowlist (pre-selected, tiered)

Encode this as data in `src/lib/deck/research/sources.ts` with a category per entry and known fetch fallbacks. Researchers may only cite hosts on this list; anything else is a lead, not a source.

- **Tier 1, primary.** Company newsroom and press releases; company policy pages (fees, loyalty terms, service plans); investor relations and SEC EDGAR filings (10-K, 8-K, earnings releases); U.S. government data and rules (transportation.gov, bts.gov, ecfr.gov, federalregister.gov, sec.gov); fortune.com for rankings.
- **Tier 2, reputable press.** Reuters, AP, Bloomberg, CNBC, WSJ, FT, the company's hometown paper, Skift for travel.
- **Tier 3, specialist.** Use to locate a Tier 1 or 2 source, or when the brief allows it: The Points Guy, View from the Wing, One Mile at a Time, AwardWallet, NerdWallet, Simple Flying, Moodie Davitt Report (travel retail), Cirium (on-time data).
- **Blocked.** Content farms, AI-summary sites, social posts, forums (forums may supply leads only).
- **Known fetch blockers, with fallbacks.** transportation.gov briefing pages, aa.com and news.aa.com returned 403 to plain fetchers on 2026-09-03. Fallbacks: bts.gov mirrors the DOT consumer reports; globenewswire.com, nasdaq.com and SEC EDGAR mirror press releases and financials; search-result snippets count only as leads until a fetchable page confirms the figure.

### Agents and flow

Run these as separate model calls with explicit budgets. Use the Vercel AI SDK; check the installed versions and current docs before coding; take model IDs from the `claude-api` skill, never from memory. Keys come from env; research runs server-side in a route handler or a script, and nothing is stored remotely.

1. **Planner.** Turns the brief into a claim list per slide (cap 30): claim text, data category, preferred sources, why it matters to the slide.
2. **Researchers.** One per data category, in parallel. Budget: 8 searches and 6 fetches each, 5 minutes wall-clock. Each returns `{ id, claim, value, unit, asOf, sourceUrl, sourceTier, quote (25 words max), confidence, method }`. Missing data returns `status: "unverified"` with what was found instead. Never guess a number.
3. **Verifier.** Cross-checks every Tier 2 or 3 claim against Tier 1 where possible. Records conflicts with their methodologies (example from the reference deck: a 1.82% versus 2.36% cancellation rate from different windows) and either picks the primary-sourced figure or drops the claim. Maintains a watch-outs list: features that belong to competitors, discontinued programs, stale years.
4. **Writer.** Composes copy from verified claims only. Every number in copy carries a `claimId`. Respects the density limits of the template (four cards of about 35 words, one lede of about 25 words).
5. **Builder.** `renderDeck`.
6. **QA.** Renders at the five sizes with the headless browser already available in the environment (Playwright is installed under `~/Library/Caches/ms-playwright`; Chrome is at `/Applications/Google Chrome.app`). Fails on console errors, on any overflow outside phone portrait, and on any `claimId` that does not resolve.
7. **Packager.** Writes the HTML, an `og.png` from `?still=1&chrome=0#1` at 1200×630, a PDF from print mode, and a README listing every claim with its source and as-of date.

Rules that hold across agents: state as-of dates; prefer the latest full year; record the method next to the number when methods differ; render unverified claims with a visible "verify" marker (dotted underline and a title tooltip) so they cannot ship unnoticed; target 15 minutes end-to-end and degrade gracefully by shipping fewer, verified claims rather than more, weaker ones.

## Acceptance criteria

- `renderDeck(referenceContent, midnightSteel)` reproduces the reference deck's structure (snapshot test passes) and the output file runs with zero dependencies.
- Switching a preset or one section accent changes every derived color in one place, and all presets pass the contrast test.
- The editor shows a live preview, autosaves, survives a reload, and exports an HTML file that opens from disk.
- The render API returns a deck as `text/html` for a valid body and a readable 400 for an invalid one.
- A research run on the brief "American Airlines through Exciters, Enragers, So-whats, Complementaries" reproduces the reference deck's figures with sources, or flags them as unverified. No invented numbers.
- `npm run lint`, `npm run test`, and `npm run build` are green.

## Process

Write a short plan to `docs/plans/` first (files, schemas, milestones, risks). Then work test-first, milestone by milestone: renderer and themes, then editor and API, then the research pipeline. Commit on a feature branch after each green milestone. Out of scope for this round: a light theme, non-English decks, multi-company comparison decks.
