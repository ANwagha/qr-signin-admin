# Musterpass

**Scan in. Clock in. Proven on site.** Musterpass is a QR clock-in and clock-out app for teams. Staff, contractors and visitors scan the poster at the entrance, take a selfie, pass a one-time location check, answer any forms the company has added, and are clocked in. Managers see who is in, hours worked, and anything flagged.

**Live demo:** https://musterpass.vercel.app (deploys automatically from `main`).

The product vision, privacy plan and roadmap live in the founding document: [`docs/Musterpass-Founding-Document.pdf`](docs/Musterpass-Founding-Document.pdf) (source: [`docs/founding/`](docs/founding/)).

## Forms

Each company builds its own clock-in and clock-out forms on the Forms page (`lib/forms.ts`, `components/FormEditor.tsx`), or turns them all off for a plain time clock. Question types: yes/no, pick one, pick any, short answer, number (with a +/− button for negative readings) and photo. Any question can be required and can alert the supervisor on certain answers. A library of ready-made forms (Fit for work, End of shift, PPE check, Hazard assessment, Equipment check, Temperature log) gives a head start; new companies start with Fit for work and End of shift.

## Status

The whole user journey works. The app runs in one of two modes:

- **Prototype mode**, when no Supabase keys are set: companies, people, clock-ins and photos are kept in that browser's `localStorage` (`lib/store.ts`). One company per browser, nothing shared between devices.
- **Supabase mode**, once the keys below are set: companies sign up and log in with email and password, workers' clock-ins go to the database from any phone, photos go to private storage, and the dashboard updates live. See [Supabase](#supabase).

The demo company (Northshore Builders) always stays in the browser, in both modes.

| Page | What it does |
|---|---|
| `/` | Landing page (Log in and Billing links in the header, Try it out menu) |
| `/signup` | Company sign-up: company and owner → first site → invite team → ready (poster) |
| `/s/[site]` | Clock-in on a phone: who are you + consent → selfie → location check → the company's clock-in forms (signature if a form asks for one), or a visitor form. Scan again to clock out and answer any clock-out forms |
| `/admin` | Dashboard: clocked in now, hours worked today, review queue (selfie review, countersign), flagged answers, printable emergency list |
| `/admin/sites` | Sites, boundaries and printable gate posters |
| `/admin/people` | Everyone who has checked in, subcontractor companies, dashboard invites |
| `/admin/forms` | Form builder: create, edit, reorder, turn on or off, or add from the library |
| `/admin/records` | Every clock-in with hours, forms, photos (with hashes) and signatures; CSV export for payroll; print |
| `/admin/billing` | Per-company plans and trial (and **Reset demo** for browser-only data) |
| `/login`, `/login/company`, `/login/reset` | Choose company or admin login; email and password log in; choose a new password from a reset email |

**Try it fast:** open `/signup` and click **Explore the demo instead** to load Northshore Builders, a made-up company with clock-ins already in it. Then clock in yourself at `/s/lonsdale-tower`.

### Limits for now
- In prototype mode: one company per browser; data isn't shared between devices.
- On a phone over plain `http://` (your computer's network address), the camera works but **location and photo hashing don't**: browsers only allow them on `https` or `localhost`. The demo offers "Prototype: simulate being on site"; real companies don't get that button, and the server marks any simulated location as flagged. For real phone testing, use the HTTPS Vercel URL.
- Invites are listed but no invite email is sent yet; billing doesn't charge. One login per company (the owner) for now.
- The phone's location check runs on the phone, so a determined worker could fake it. Checking it on the server comes with the trust step.

## Run it locally

```bash
npm install
npm run dev
```

Then open http://localhost:3000. Without a `.env.local` it runs in prototype mode. To use Supabase locally, put the three Supabase variables below in `.env.local` (it is git-ignored; never commit it).

## Supabase

One-time setup, done by whoever owns the Musterpass accounts:

1. **Create the project** at supabase.com → New project. Region: **Canada (Central)**. Save the database password in a password manager; the app doesn't need it.
2. **Create the tables and security rules:** SQL Editor → New query → paste all of [`supabase/schema.sql`](supabase/schema.sql) → Run. It's safe to run again after it changes.
3. **Sign-in links:** Authentication → URL Configuration. Site URL: `https://musterpass.vercel.app`. Redirect URLs: add `https://musterpass.vercel.app/**` and `http://localhost:3000/**`.
4. **Email confirmation** (Authentication → Sign In / Providers → Email → Confirm email) can stay on. New owners then get a link, and their company is created when they open it on the same device. Supabase's built-in email sender only allows a few emails an hour; set up custom SMTP (Authentication → Emails) before real customers sign up.
5. **Add the keys to Vercel** (Project → Settings → Environment Variables, all environments), then redeploy:

| Variable | Where to find it | Secret? |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Project Settings → API → Project URL | No (it ships to browsers) |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Project Settings → API keys → Publishable key (the older `NEXT_PUBLIC_SUPABASE_ANON_KEY` also works) | No; the security rules protect the data |
| `SUPABASE_SECRET_KEY` | Project Settings → API keys → Secret key (the older `SUPABASE_SERVICE_ROLE_KEY` also works) | **Yes.** Server only, full access. Never put it in a `NEXT_PUBLIC_` variable or in the code |

How it fits together:

- **Tables:** `companies`, `members` (which login belongs to which company), `sites`, `people`, `invites`, `forms`, `check_ins`. Row level security lets a signed-in user see and change only their own company. Clock-in times, photos and answers can't be edited from the dashboard, only reviewed and countersigned.
- **Workers never sign in.** The phone talks to `app/api/clock/site`, `/in` and `/out`, which use the secret key and check every request: the poster link must exist, photos must be real JPEG/PNG/WebP images, and only the phone that clocked someone in (it keeps a random key; the database keeps only its hash) can clock them out.
- **Photos** go to the private `photos` bucket as `{company}/{clock-in}/{photo}.jpg`. The dashboard gets links that expire after two hours.
- **The dashboard** keeps a copy of the company in the browser (`lib/cloud/sync.ts`), refreshes it when a clock-in arrives (Supabase Realtime) or the tab comes back into focus, and sends each change to the database.
- Poster links are unique across all companies; `lonsdale-tower` and `brentwood-yard` stay reserved for the demo.

## Stack

Next.js 16 (App Router, `cacheComponents`), React 19, Tailwind CSS 4, TypeScript, Supabase (`@supabase/supabase-js`: auth, Postgres, storage, realtime), `qrcode.react`. Fonts: Space Grotesk and Inter. Hosted on Vercel. Planned: Stripe.

## Light and dark mode

The app follows the device's light or dark setting, and a sun/moon switch in the header (Auto, Light, Dark) overrides it per browser. Pages use theme roles defined in `app/globals.css` as Tailwind classes: `bg`, `surface`, `raised`, `fg`, `muted`, `line`, `alert` and `accent-fg`. Each has a light and a dark value, all at 4.5:1 contrast or better. Printing always uses light colours. The black top bar, posters and the lime and pink buttons keep their fixed brand colours.

## Company branding

Admin → Branding sets a company's logo, brand colour and a short welcome message. Workers see them on the clock-in screens and the gate posters; the admin dashboard stays in Musterpass colours. The main button text switches to black or white automatically, whichever is easier to read, and the page warns when a colour would blend into the light or dark background. The logo is shrunk to a PNG of at most 320 px and kept with the company (in this browser until Supabase).

## Command center

Log in → Admin login opens `/command`, for the Musterpass team. The whole page stays locked until the command key (`COMMAND_KEY`, below) is entered; it is kept only in that browser tab until it closes or **Lock** is pressed.

- **Versions:** every production deploy from Vercel, which one is live, and **Roll back** (puts the live site back to an earlier version for everyone). After a rollback Vercel stops releasing new pushes until you press **Undo** (or **Make live** on a newer version). On Vercel's Hobby plan you can only roll back one version.
- **Tester bot:** clocks a worker in and out inside an on-page phone frame, then checks the dashboard and records. It runs on the demo company and restores this browser's data afterwards.
- **Companies:** with Supabase connected, every company with its plan or trial days left, sites, people, clock-ins, how many are on site now and the last clock-in. Unlock with the command key first. Without Supabase, this browser's company.

Versions and rollback need these environment variables in Vercel (Project → Settings → Environment Variables). Never commit them:

| Variable | What it is |
|---|---|
| `COMMAND_KEY` | A long secret phrase that unlocks Versions. |
| `VERCEL_TOKEN` | A Vercel access token that can manage this project. |
| `VERCEL_PROJECT_ID` | Project → Settings → General → Project ID. |
| `VERCEL_TEAM_ID` | Only if the project belongs to a Vercel team. |

## Brand tokens

Defined in `app/globals.css` as Tailwind classes (`bg-ink`, `text-volt`, …): `ink` #141414, `volt` #C6F432 (the one primary action per screen; ink text on it), `bone` #F5F5F0, `pop` #CA2A30 (alert red: flags, clock-out, alert borders; white text on it), `pop-deep` #CA2A30 (red text on light backgrounds; #FF6369 in dark mode), `graphite` #2A2A2A, `smoke` #8A8A85, `line` #DDDCD3.
