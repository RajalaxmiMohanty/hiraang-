# Hiraang Mini

College demo of a jewelry shop app: **Customers → Inventory → Invoices → Payments / Print**.

Data is stored only in browser **localStorage** (no database, no login).

## Run

```bash
npm install
npm run dev
```

Open http://localhost:3000  
Dashboard → **Reset demo data** to restore the seed.

## Demo flow (viva)

1. **Customers** — add / search a buyer (try Odisha vs another state for GST)
2. **Inventory** — open an item; show gold + diamond + making totals
3. **Settings** — change a gold rate or making formula; save
4. **Invoices** — create invoice, add lines, **Issue** (stock drops), record **Pay**, **Print / PDF**

## Modules

| Page | What it shows |
|------|----------------|
| Dashboard | Counts + reset seed |
| Customers | CRUD + search |
| Inventory | Jewelry stock, filters, live valuation |
| Invoices | Draft/Issued, GST, discount, payments, print/PDF |
| Settings | Gold rates, tax/policy, making formula, stock-on-issue |

## Tech

Next.js (App Router), TypeScript, Tailwind, mathjs (formulas), jspdf (PDF).
