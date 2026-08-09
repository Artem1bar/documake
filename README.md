# Documake

Company documents, minus the busywork. Pick a template — invoice, quote,
statement of work, NDA, or questionnaire — fill in a form, and download a
polished PDF. Your company details are entered once in Settings and pre-filled
everywhere.

Everything is stored locally in your browser (localStorage). No accounts, no
server, no data leaves your machine.

## Run it

```bash
npm run dev
```

Then open the printed localhost URL. Production build: `npm run build && npm start`.

## How it works

- **Settings** (`/settings`) — one or more brand profiles. Each keeps its own
  company details (name, address, tax ID), invoicing defaults (currency,
  auto-incrementing invoice numbers, payment terms, tax rate), governing law,
  and branding. New documents use whichever profile is active.
- **Branding** — an accent colour and a typeface per profile, applied to the
  document heading and rules. Typefaces are the standard PDF families
  (Helvetica, Times, Courier), so nothing is downloaded or embedded and
  documents render identically anywhere.
- **Dashboard** (`/`) — template cards plus your recent documents.
- **Editor** (`/documents/[id]`) — form on the left, live PDF preview on the
  right, download button. Every change autosaves locally.

## Architecture

| Layer | Where | Notes |
| --- | --- | --- |
| Schemas & types | `src/lib/types.ts` | Zod-validated at every storage boundary |
| Persistence primitives | `src/lib/persistence/` | Swappable storage adapter, versioned envelopes, migrations |
| Store | `src/lib/storage.ts` | In-memory cache with subscriptions, over an adapter |
| React bindings | `src/lib/store-hooks.ts` | `useSyncExternalStore`-based hooks |
| Invoice math | `src/lib/invoice-math.ts` | Integer-cents arithmetic, tested |
| Profiles | `src/lib/profile-store.ts` | Pure operations over the profile list |
| PDF templates | `src/components/pdf/` | `@react-pdf/renderer`, per-profile theme |
| Forms | `src/components/forms/` | One per document type |
| Render API | `src/app/api/render/route.ts` | Stateless PDF rendering for other services |

### Storage

Documents and the company profile persist as versioned envelopes
(`{ version, data }`) behind a `StorageAdapter` — a small synchronous
key-value contract. Today the only implementation is localStorage; swapping in
SQLite or a server backend means writing one adapter and changing one line in
`storage.ts`.

Payloads written by older builds are read as version 1 and migrated forward
through a declared chain. Stored data is treated as untrusted input: anything
absent, corrupt, invalid, or un-migratable falls back to a default rather than
throwing.

## Render API

`POST /api/render` turns a document into a PDF without storing anything, so
other services can generate documents without going through the browser app.

```bash
curl -X POST http://localhost:3000/api/render \
  -H 'Content-Type: application/json' \
  -o invoice.pdf \
  -d '{
    "type": "invoice",
    "filename": "acme-invoice",
    "profile": { "name": "Weblux AI LLC", "currency": "USD" },
    "data": {
      "invoiceNumber": "INV-0042",
      "issueDate": "2026-08-09",
      "billToName": "Acme Corp",
      "items": [{ "id": "1", "description": "Design work", "quantity": 2, "unitPrice": 500 }]
    }
  }'
```

`type` is `invoice`, `quote`, `sow`, `nda`, or `questionnaire`, and `data` is
validated against that type's schema. `profile` and `filename` are optional. Success returns the
PDF; any failure returns `{ success, data, error }` with a 400, 401, or 500.

**Authentication** is off until you configure it. Set
`DOCUMAKE_RENDER_SECRET` (see `.env.example`) and callers must then send
`Authorization: Bearer <that value>`. Leaving it unset is fine locally, where
only your own machine can reach the endpoint — set it anywhere else.

## Tests

```bash
npm test
```

Vitest covers the money arithmetic (rounding, clamping, float safety), schema
parsing and factories, storage migrations, profile operations, PDF theming, and
the render API end to end.

`scripts/render-samples.tsx` renders a sample of each template, plus one
invoice per brand preset, for visual inspection:

```bash
npx tsx scripts/render-samples.tsx out/
```

## Notes

- The NDA and SOW are general templates, not legal advice — have a lawyer
  review them before relying on them. Neither ships with pre-written terms:
  scope, assumptions, and change control are yours to write.
- Documents live only in the browser that created them. Clearing site data
  deletes them; export anything you need as PDF.

## Roadmap ideas

- Company logo on invoices
- Embedded brand fonts alongside the standard PDF families
- More templates (receipt, employment offer)
- DOCX export alongside PDF
- Cloud sync / multi-device (would need a backend)
- E-signature flow for NDAs
