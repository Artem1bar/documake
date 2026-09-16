# Report blocks, and "The Map" as the first one

**Date:** 2026-09-09 · **Status:** shipped — 174 tests green, lint clean, build green

## Why

Documake's five templates are transactional: an invoice, a quote, an SOW, an NDA, a
questionnaire. Each is a fixed set of fields with a form per field. That shape does not fit the
documents Weblux actually hand-builds per client — `~/weblux/docs/onboarding/templates/map.md`
and `access-checklist.md`, plus the same two shapes again in `~/lawai/docs/client/`. Those are
*sectioned reports*: prose, tables, checklists, a computed hours table, a verdict.

Writing one bespoke schema and one bespoke form per report would cost the same again for each of
the six remaining documents in the onboarding playbook (intake summary, Blueprint, kickoff,
handover, 30-day review). So the unit of reuse is not the report — it is the **block**.

## Shape

One new document type, `report`, whose data is a list of sections, each holding a list of typed
blocks. A template such as The Map is then a **preset** — data, not code.

```
report
  heading, subtitle, preparedFor, preparedForRole, documentDate, basedOn, closing
  templateId: "map" | "blank"        // ties sections back to their authoring hints
  sections[]: { id, key?, title, blocks[] }
```

### Block vocabulary

Seven kinds, derived from what the two source documents actually use. Small enough to hold in
your head, large enough that both documents render without a special case.

| Kind | Renders | Source it came from |
|---|---|---|
| `prose` | Paragraphs | "What we heard", the honest read |
| `quote` | Indented rule + attribution | The verbatim client quote; the access "stance" |
| `table` | Header row + rows, per-column alignment | Process flow, systems, access register, assets |
| `hours` | Computed weekly/annual with totals | "Where the time goes" |
| `list` | Bulleted or numbered, optional bold term | "What we would leave alone", the access rules |
| `checklist` | Empty tick box per item | Data handling, revoke-at-handover |
| `callout` | Bordered block in one of three tones | The verdict |

`table` columns carry a kind: `text` or `marker`. A `marker` column prints a filled dot when the
cell is non-empty — that is the map's manual-step column, which is the whole visual point of the
process-flow table, kept without hard-coding a map-specific block.

### The one piece of real arithmetic

`hours` rows are `{ step, who, perWeek, minutesEach }`. Weekly hours are `perWeek × minutesEach ÷
60`; annual is `weekly × weeksPerYear`, where `weeksPerYear` lives on the block and prints as a
stated assumption. The source document is explicit that false precision starts an argument about
the wrong thing, so the block carries its assumption rather than burying it, and the renderer
prints it under the table.

Tested the way `invoice-math.ts` and `sow.ts` are: pure functions, own test file.

### Hints are not content

`map.md` is mostly *authoring guidance* in braces — "Half a page. The business, who does what…".
That guidance is much of the template's value, so it ships as form placeholders, looked up from
the preset by section `key`. It is never persisted and never reaches the PDF, so improving the
preset improves every document already saved.

## Files

New:

- `src/lib/report/schema.ts` — block + report Zod schemas, types
- `src/lib/report/hours.ts` — hours arithmetic
- `src/lib/report/blocks.ts` — block factories, labels
- `src/lib/report/presets.ts` — `MAP_PRESET`, `BLANK_PRESET`, hint lookup
- `src/components/forms/ReportForm.tsx` — sections
- `src/components/forms/BlockFields.tsx` — the editor per block kind
- `src/components/pdf/ReportPdf.tsx` — page shell
- `src/components/pdf/ReportBlocks.tsx` — the renderer per block kind
- `src/lib/__tests__/report.test.ts`, `report-hours.test.ts`

Touched: `types.ts` (union member, `DOC_TYPES`, labels), `factories.ts` (`createReportDoc`),
`renderDocumentPdf.tsx`, `render-request.ts`, `DocBadge.tsx`, `app/page.tsx`,
`app/documents/[id]/page.tsx`, `scripts/render-samples.tsx`.

`DOCS_VERSION` stays at 1. Adding a member to a discriminated union is additive — every stored
document still parses — and a test asserts it.

## Milestones

1. Schema + hours math + presets, test-first
2. PDF renderer, verified against a rendered sample
3. Form editor, verified in the browser
4. Wiring: badge, dashboard card, render API, samples script

## Risks

- **Block sprawl.** Every new document will want an eighth block. The bar: a block earns its
  place when two documents need it, otherwise it is a `table` or a `prose`.
- **Nesting depth in the form.** Two levels (section → block) is the limit; a block containing
  blocks would make the editor unusable.
- **`wrap` behaviour.** Long tables must be allowed to break across pages while prose blocks and
  callouts stay whole. Needs checking on a 6-page sample, not assumed.

## Out of scope

Access checklist and the go-live checklist as presets (the blocks are being built to carry them,
but this round ships The Map only), markdown import, and the Deck template in
`2026-09-03-deck-template-prompt.md`.
