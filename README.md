# Musterpass

**Scan in. Clock in. Proven on site.** Musterpass is a QR clock-in and clock-out app for teams. Staff, contractors and visitors scan the poster at the entrance, take a selfie, pass a one-time location check, answer any forms the company has added, and are clocked in. Managers see who is in, hours worked, and anything flagged.

**Live demo:** https://musterpass.vercel.app (deploys automatically from `main`).

The product vision, privacy plan and roadmap live in the founding document: [`docs/Musterpass-Founding-Document.pdf`](docs/Musterpass-Founding-Document.pdf) (source: [`docs/founding/`](docs/founding/)).

## Forms

Each company builds its own clock-in and clock-out forms on the Forms page (`lib/forms.ts`, `components/FormEditor.tsx`), or turns them all off for a plain time clock. Question types: yes/no, pick one, pick any, short answer, number (with a +/− button for negative readings) and photo. Any question can be required and can alert the supervisor on certain answers. A library of ready-made forms (Fit for work, End of shift, PPE check, Hazard assessment, Equipment check, Temperature log) gives a head start; new companies start with Fit for work and End of shift.

## Status: clickable prototype

The whole user journey works in the browser. There is **no backend yet**: companies, people, check-ins and photos are stored in that browser's `localStorage` (`lib/store.ts`) until Supabase is connected in step 3.

| Page | What it does |
|---|---|
| `/` | Landing page (Admin and Billing links in the header) |
| `/signup` | Company sign-up: company and owner → first site → invite team → ready (poster) |
| `/s/[site]` | Clock-in on a phone: who are you + consent → selfie → location check → the company's clock-in forms (signature if a form asks for one), or a visitor form. Scan again to clock out and answer any clock-out forms |
| `/admin` | Dashboard: clocked in now, hours worked today, review queue (selfie review, countersign), flagged answers, printable emergency list |
| `/admin/sites` | Sites, boundaries and printable gate posters |
| `/admin/people` | Everyone who has checked in, subcontractor companies, dashboard invites |
| `/admin/forms` | Form builder: create, edit, reorder, turn on or off, or add from the library |
| `/admin/records` | Every clock-in with hours, forms, photos (with hashes) and signatures; CSV export for payroll; print |
| `/admin/billing` | Per-company plans, trial, and **Reset demo** |

**Try it fast:** open `/signup` and click **Explore the demo instead** to load Northshore Builders, a made-up company with clock-ins already in it. Then clock in yourself at `/s/lonsdale-tower`.

### Prototype limits
- One company per browser; data isn't shared between devices.
- On a phone over plain `http://` (your computer's network address), the camera works but **location and photo hashing don't**: browsers only allow them on `https` or `localhost`. The site check offers "Prototype: simulate being on site". For real phone testing, use the HTTPS Vercel URL (step 2).
- No emails or SMS are sent; billing doesn't charge.

## Run it locally

```bash
npm install
npm run dev
```

Then open http://localhost:3000.

## Stack

Next.js 16 (App Router, `cacheComponents`), React 19, Tailwind CSS 4, TypeScript, `qrcode.react`. Fonts: Space Grotesk and Inter. Planned: Supabase (Canada region), Vercel, Stripe.

## Light and dark mode

The app follows the device's light or dark setting, and a sun/moon switch in the header (Auto, Light, Dark) overrides it per browser. Pages use theme roles defined in `app/globals.css` as Tailwind classes: `bg`, `surface`, `raised`, `fg`, `muted`, `line`, `alert` and `accent-fg`. Each has a light and a dark value, all at 4.5:1 contrast or better. Printing always uses light colours. The black top bar, posters and the lime and pink buttons keep their fixed brand colours.

## Company branding

Admin → Branding sets a company's logo, brand colour and a short welcome message. Workers see them on the clock-in screens and the gate posters; the admin dashboard stays in Musterpass colours. The main button text switches to black or white automatically, whichever is easier to read, and the page warns when a colour would blend into the light or dark background. The logo is shrunk to a PNG of at most 320 px and kept with the company (in this browser until Supabase).

## Brand tokens

Defined in `app/globals.css` as Tailwind classes (`bg-ink`, `text-volt`, …): `ink` #141414, `volt` #C6F432 (the one primary action per screen; ink text on it), `bone` #F5F5F0, `pop` #CA2A30 (alert red: flags, clock-out, alert borders; white text on it), `pop-deep` #CA2A30 (red text on light backgrounds; #FF6369 in dark mode), `graphite` #2A2A2A, `smoke` #8A8A85, `line` #DDDCD3.
