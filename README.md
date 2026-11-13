# Musterpass

**Scan in. Sign off. Proven on site.** Musterpass is a site check-in and safety compliance SaaS. Everyone who arrives at a work site scans the gate QR code, takes a selfie, passes a location check, completes the day's Field Level Hazard Assessment (FLHA) with photo evidence, and signs. That one scan also clocks them in.

The product vision, privacy plan and roadmap live in the founding document: [`docs/Musterpass-Founding-Document.pdf`](docs/Musterpass-Founding-Document.pdf) (source: [`docs/founding/`](docs/founding/)).

## Status: clickable prototype (step 1 of the roadmap)

The whole user journey works in the browser. There is **no backend yet**: companies, people, check-ins and photos are stored in that browser's `localStorage` (`lib/store.ts`) until Supabase is connected in step 2.

| Page | What it does |
|---|---|
| `/` | Landing page (Admin and Billing links in the header) |
| `/signup` | Company sign-up: company and owner → industry → first site → invite team → ready (poster) |
| `/s/[site]` | Check-in on a phone: who are you + consent → selfie → site check → FLHA (job, hazards with compliance photos, PPE photo) or visitor form → signature. Scan again to check out |
| `/admin` | Safety dashboard: on site now, FLHAs, review queue (selfie review, countersign), flagged check-ins, printable muster list |
| `/admin/sites` | Sites, boundaries and printable gate posters |
| `/admin/people` | Everyone who has checked in, subcontractor companies, dashboard invites |
| `/admin/forms` | The FLHA template and which hazards require a photo |
| `/admin/records` | Search every check-in, open the full record (photos, hashes, signatures), export CSV, print |
| `/admin/billing` | Per-company plans, trial, and **Reset demo** |

**Try it fast:** open `/signup` and click **Explore the demo instead** to load Northshore Builders, a made-up contractor with check-ins already in it. Then open `/s/lonsdale-tower` to check in yourself.

### Prototype limits
- One company per browser; data isn't shared between devices.
- On a phone over plain `http://` (your computer's network address), the camera works but **location and photo hashing don't**: browsers only allow them on `https` or `localhost`. The site check offers "Prototype: simulate being on site". Real phone testing comes with the Vercel preview URL (step 3).
- No emails or SMS are sent; billing doesn't charge.

## Run it locally

```bash
npm install
npm run dev
```

Then open http://localhost:3000.

## Stack

Next.js 16 (App Router, `cacheComponents`), React 19, Tailwind CSS 4, TypeScript, `qrcode.react`. Fonts: Space Grotesk and Inter. Planned: Supabase (Canada region), Vercel, Stripe.

## Brand tokens

Defined in `app/globals.css` as Tailwind classes (`bg-ink`, `text-volt`, …): `ink` #141414, `volt` #C6F432 (the one primary action per screen; ink text on it), `bone` #F5F5F0, `pop` #FF5C8A (flags, check-out), `pop-deep` #B8154F (pink text on light backgrounds), `graphite` #2A2A2A, `smoke` #8A8A85, `line` #DDDCD3.
