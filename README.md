# Documake

Company documents, minus the busywork. Pick a template — invoice, NDA, or
questionnaire — fill in a form, and download a polished PDF. Your company
details are entered once in Settings and pre-filled everywhere.

Everything is stored locally in your browser (localStorage). No accounts, no
server, no data leaves your machine.

## Run it

```bash
npm run dev
```

Then open the printed localhost URL. Production build: `npm run build && npm start`.

## How it works

- **Settings** (`/settings`) — company profile: name, address, tax ID,
  currency, invoice numbering (auto-increments), payment terms, default tax
  rate, default governing law.
- **Dashboard** (`/`) — template cards plus your recent documents.
- **Editor** (`/documents/[id]`) — form on the left, live PDF preview on the
  right, download button. Every change autosaves locally.

## Architecture

| Layer | Where | Notes |
| --- | --- | --- |
| Schemas & types | `src/lib/types.ts` | Zod-validated at every storage boundary |
| Persistence | `src/lib/storage.ts` | localStorage + in-memory store with subscriptions |
| React bindings | `src/lib/store-hooks.ts` | `useSyncExternalStore`-based hooks |
| Invoice math | `src/lib/invoice-math.ts` | Integer-cents arithmetic, tested |
| PDF templates | `src/components/pdf/` | `@react-pdf/renderer`, shared theme |
| Forms | `src/components/forms/` | One per document type |

## Tests

```bash
npm test
```

Vitest covers the invoice math (rounding, clamping, float safety) and schema
parsing/factories. `scripts/render-samples.tsx` renders sample PDFs from all
three templates for visual inspection:

```bash
npx tsx scripts/render-samples.tsx out/
```

## Notes

- The NDA is a general template, not legal advice — have a lawyer review it
  before relying on it.
- Documents live only in the browser that created them. Clearing site data
  deletes them; export anything you need as PDF.

## Roadmap ideas

- Company logo on invoices
- More templates (proposal, receipt, employment offer)
- DOCX export alongside PDF
- Cloud sync / multi-device (would need a backend)
- E-signature flow for NDAs
