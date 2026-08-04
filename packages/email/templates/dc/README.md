# Paged document templates (`.dc.html`)

Print/PDF documents — invoices, statements, receipts. These are the
**customized** versions pulled from the Claude Design project and edited for
Example Studio → Acme, kept here so they are reusable and version
controlled.

Distinct from `../src/templates/` (React Email), which renders **email** HTML.

| File | Use |
|------|-----|
| `invoice.dc.html` | Single line item, no discount, net 0 (original terms) |
| `invoice-single-service.dc.html` | One service, 20% discount, Net 15 |
| `invoice-multi-service.dc.html` | Multiple services + multi-service discount, carries previous balance |
| `statement.dc.html` | Account statement with aging buckets, settled/past-due states |
| `receipt.dc.html` | Payment receipt — invoices settled, settlement labels, payment ID |
| `runtime/` | `support.js`, `doc-page.js`, `page-numbers.js`, `logo.png` |

## Rendering

```
pnpm --filter @invoicecn/email render:pdf
```

Writes to `out/`. The script vendors React + Tailwind, serves over HTTP, and
prints via headless Chrome — all three are required:

- `support.js` expects `window.React`/`window.ReactDOM` but does not bundle them
- `file://` breaks the ES module `import('./page-numbers.js')`
- for **flowing** documents `doc-page.js` emits `@page` with no size descriptor,
  so Chrome's `--print-to-pdf-paper-*` flags and `size="a4"` are both ignored —
  the A4 rule must be appended *after* load

Full write-up: `~/.ops/runbooks/dc-html-templates-to-pdf.md`

## Editing

Data is inline in each template's `renderVals()`. To issue a new document,
copy the closest variant and edit the `src` / `rows` array, IDs, and dates.

Conventions in use:

- Invoice `INNO-YYYYMMDD` · Statement `ST-INNO-YYYY-MM` ·
  Receipt `RCT-INNO-YYYYMMDD` · Payment `PMT-INNO-YYYYMMDD`
- Density `standard` across every document — do not switch one to `compact`
  to win a page break; trim content instead
- Dates: abbreviated (`Jul 25, 2026`) in tables and totals; ordinal
  (`August 3rd, 2026`) in prose
- **Verify every render with `pdftotext`** — a PDF can be a perfectly-sized
  blank page. Check page count, page size, and expected strings.
