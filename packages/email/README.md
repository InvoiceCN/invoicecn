# @invoicecn/email

Email and paged-document templates for invoicecn, built on
[emailcn](https://emailcn.run) (shadcn-format registry of React Email
components).

> ### ⚠️ Wrong repo — see tlc **T-0100**
>
> This package is committed to **`InvoiceCN/website`** (the marketing site),
> because that is the repo checked out at `~/.w/ideacrafterslabs/invoicecn`.
> It belongs in the **invoicecn product repo**, and should move there once that
> exists locally.
>
> Move the whole `packages/email/` directory with history
> (`git filter-repo` or `git subtree split`), not a plain copy. Nothing outside
> this directory depends on it — `apps/landing` does not import it — so the
> move is self-contained. Remember to drop the `packages/*` entry from
> `pnpm-workspace.yaml` here if no other package remains.

## Layout

```
src/components/email/   installed FROM emailcn (theme, fonts, primitives)
src/templates/          invoicecn's React Email templates
src/data/               per-document data, separate from presentation
templates/dc/           paged .dc.html documents + runtime → PDF
scripts/                render-email (tsx) · render-pdf (headless Chrome)
assets/logo.png         inline CID logo for email
```

## Commands

```
pnpm render:email    # → out/<receipt>.html + .txt
pnpm render:pdf      # templates/dc/*.dc.html → out/*.pdf (A4)
```

## emailcn

Registry is wired in `components.json`:

```json
{ "registries": { "@emailcn": "https://emailcn.run/r/{name}.json" } }
```

```
npx shadcn@latest add @emailcn/react-email/<item>
```

Everything under `src/components/email/` came from there and is upstream code —
prefer re-pulling over editing it. invoicecn's own work lives in
`src/templates/`.

**Note on `block-receipt-default`:** it is installed but not used. The block
renders its own complete `<Html>` document and voids every prop except
order/items/totals (`void _productName`), so the payment method — the one fact
a receipt must state — cannot be passed through it. `src/templates/
payment-receipt.tsx` composes emailcn's primitives and `theme-default`
directly instead, keeping the same design tokens.

## Email conventions

- Always render **both** HTML and a plain-text alternative
- Logo ships as an **inline CID attachment** (`LOGO_CID`), never a hosted URL —
  remote images are blocked by default in most clients. emailcn's
  `emailAsset()` resolves logos to `placehold.co`; do not use it for real mail
- Send with real MIME (`multipart/mixed` → `alternative` → `related`).
  himalaya 2.x dropped MML — see `~/.agents/guides/tools/himalaya.md`
- **Verify the Sent copy**, never a draft

Document conventions (IDs, density, dates) are in `templates/dc/README.md`.
