# Tock

**Scan, tap, you're in.** Tock is a QR-based time clock for teams. Employees scan a poster with their phone, Tock checks they're on-site, and one tap clocks them in or out. Managers see who's in the building and get timesheets they can trust.

The product vision, brand and roadmap live in the founding document: [`docs/Musterpass-Founding-Document.pdf`](docs/Musterpass-Founding-Document.pdf) (source: [`docs/founding/`](docs/founding/)).

## Status: Phase 0 (UI prototype)

This build is the rebranded UI prototype. Everything runs in the browser with demo data:

| Page | What it does |
|---|---|
| `/` | Landing page |
| `/scan/[location]` | Employee clock-in screen. Asks for a name once, then shows a live clock and a Clock in / Clock out button |
| `/admin` | Dashboard for the made-up Daybreak Coffee: headcount, flagged clock-ins, activity, CSV export |
| `/admin/qr` | Makes a printable Tock poster for a location |

**Demo only:** the employee's name and clock events are kept in that browser's `localStorage` (`lib/demo-store.ts`), and the dashboard mixes them with sample data. Nothing is shared between devices, and there are no logins or location checks yet. Those come with Supabase in Phase 1 (see section 09 of the founding document).

## Run it locally

```bash
npm install
npm run dev
```

Then open http://localhost:3000. Try `/scan/main-street` on your phone (same Wi-Fi, using your computer's IP address) to see the clock-in screen at real size.

## Stack

Next.js 16 (App Router, `cacheComponents` on), React 19, Tailwind CSS 4, TypeScript, `qrcode.react`. Fonts: Space Grotesk (display) and Inter (UI).

## Brand tokens

Defined in `app/globals.css` and available as Tailwind classes (`bg-ink`, `text-volt`, …):

| Token | Hex | Use |
|---|---|---|
| `ink` | `#141414` | Dark background, text on light surfaces |
| `volt` | `#C6F432` | The one primary action per screen. Text on volt is always ink |
| `bone` | `#F5F5F0` | Text on ink, light backgrounds |
| `pop` | `#FF5C8A` | Clock out, alerts, flags |
| `pop-deep` | `#B8154F` | Pop-coloured text on light backgrounds |
| `graphite` | `#2A2A2A` | Raised surfaces on ink |
| `smoke` | `#8A8A85` | Secondary text |
| `line` | `#DDDCD3` | Hairlines on light backgrounds |
