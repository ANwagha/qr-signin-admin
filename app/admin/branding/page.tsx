"use client";

import Link from "next/link";
import { useRef, useState, type CSSProperties } from "react";
import BrandLogo from "@/components/BrandLogo";
import { Button, Card, PageHeader } from "@/components/ui";
import Wordmark from "@/components/Wordmark";
import {
  BRAND_PRESETS,
  DEFAULT_BRAND,
  DEFAULT_BRAND_COLOR,
  WELCOME_MAX,
  brandStyle,
  checkBrandColor,
  logoToDataUrl,
  normalizeHex,
  type Brand,
} from "@/lib/brand";
import { setBrand, useStore, type Company } from "@/lib/store";

const MAX_UPLOAD = 5 * 1024 * 1024;

export default function BrandingPage() {
  const s = useStore();
  if (!s || !s.company) return null;
  return <BrandingEditor key={s.company.id} company={s.company} firstSite={s.sites[0]?.name ?? "Your site"} />;
}

function BrandingEditor({ company, firstSite }: { company: Company; firstSite: string }) {
  const saved = company.brand ?? DEFAULT_BRAND;
  const [draft, setDraft] = useState<Brand>(saved);
  const [hexText, setHexText] = useState(saved.color ?? DEFAULT_BRAND_COLOR);
  const [logoError, setLogoError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const color = draft.color ?? DEFAULT_BRAND_COLOR;
  const check = checkBrandColor(color);
  const dirty = JSON.stringify(draft) !== JSON.stringify(saved);

  const change = (patch: Partial<Brand>) => {
    setDraft((d) => ({ ...d, ...patch }));
    setSavedAt(null);
  };
  const pickColor = (hex: string) => {
    const n = normalizeHex(hex);
    setHexText(hex);
    if (n) change({ color: n === DEFAULT_BRAND_COLOR ? null : n });
  };

  async function onLogo(file: File | undefined) {
    setLogoError(null);
    if (!file) return;
    if (!/^image\/(png|jpeg|webp|svg\+xml)$/.test(file.type)) return setLogoError("Use a PNG, JPG, WebP or SVG file.");
    if (file.size > MAX_UPLOAD) return setLogoError("That file is over 5 MB. Use a smaller logo.");
    try {
      change({ logo: await logoToDataUrl(file) });
    } catch {
      setLogoError("Couldn't read that image. Try a PNG instead.");
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Branding"
        subtitle="Your logo and colour on the clock-in screens and gate posters. Your dashboard stays in Musterpass colours."
      />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
        <div className="space-y-6">
          {/* Logo */}
          <Card className="p-6">
            <h2 className="font-display text-xl font-bold">Logo</h2>
            <p className="mt-1 text-sm text-muted">PNG with a transparent background works best. It&apos;s shrunk to fit.</p>
            <div className="mt-4 flex flex-wrap items-center gap-4">
              {draft.logo ? (
                <BrandLogo brand={draft} companyName={company.name} size="lg" />
              ) : (
                <div className="flex h-20 w-32 items-center justify-center rounded-2xl border border-dashed border-line text-sm text-muted">
                  No logo
                </div>
              )}
              <div className="flex flex-wrap gap-2">
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/svg+xml"
                  className="sr-only"
                  aria-label="Upload logo"
                  onChange={(e) => {
                    void onLogo(e.target.files?.[0]);
                    e.target.value = "";
                  }}
                />
                <Button variant="ink" size="sm" onClick={() => fileRef.current?.click()}>
                  {draft.logo ? "Replace logo" : "Upload logo"}
                </Button>
                {draft.logo && (
                  <Button variant="outline" size="sm" onClick={() => change({ logo: null })}>
                    Remove
                  </Button>
                )}
              </div>
            </div>
            {logoError && (
              <p role="alert" className="mt-3 text-sm text-alert">
                {logoError}
              </p>
            )}
            <fieldset className="mt-5">
              <legend className="mb-2 text-sm font-medium">Tile behind the logo</legend>
              <div className="inline-flex rounded-full border border-line p-0.5" role="radiogroup">
                {(
                  [
                    ["light", "Light, for dark logos"],
                    ["dark", "Dark, for white logos"],
                  ] as const
                ).map(([v, label]) => (
                  <button
                    key={v}
                    type="button"
                    role="radio"
                    aria-checked={draft.logoBg === v}
                    onClick={() => change({ logoBg: v })}
                    className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition ${draft.logoBg === v ? "bg-fg text-bg" : "text-muted hover:text-fg"}`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </fieldset>
          </Card>

          {/* Colour */}
          <Card className="p-6">
            <h2 className="font-display text-xl font-bold">Brand colour</h2>
            <p className="mt-1 text-sm text-muted">Used for the main button and the check mark when someone clocks in.</p>
            <div className="mt-4 flex flex-wrap gap-2" role="radiogroup" aria-label="Preset colours">
              {BRAND_PRESETS.map((p) => {
                const on = color === p.hex;
                return (
                  <button
                    key={p.hex}
                    type="button"
                    role="radio"
                    aria-checked={on}
                    aria-label={p.name}
                    title={p.name}
                    onClick={() => pickColor(p.hex)}
                    className={`size-10 rounded-full ring-offset-2 ring-offset-surface transition ${on ? "ring-2 ring-fg" : "ring-1 ring-line hover:ring-fg"}`}
                    style={{ background: p.hex }}
                  />
                );
              })}
            </div>
            <div className="mt-4 flex flex-wrap items-end gap-3">
              <label className="block">
                <span className="mb-1.5 block text-sm font-medium">Pick any colour</span>
                <input
                  type="color"
                  value={color}
                  onChange={(e) => pickColor(e.target.value)}
                  className="h-12 w-16 cursor-pointer rounded-xl border border-line bg-raised p-1"
                />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-sm font-medium">Hex code</span>
                <input
                  value={hexText}
                  onChange={(e) => pickColor(e.target.value)}
                  spellCheck={false}
                  aria-invalid={!normalizeHex(hexText)}
                  className="w-32 rounded-2xl border border-line bg-raised px-4 py-3 font-mono text-base text-fg outline-none focus:border-fg"
                />
              </label>
            </div>
            {!normalizeHex(hexText) && <p className="mt-2 text-sm text-alert">Enter a hex code like #1F5EFF.</p>}
            <p className="mt-4 text-sm">
              Button text: <strong>{check.textName}</strong>{" "}
              <span className="text-muted">· contrast {check.ratio.toFixed(1)}:1 {check.ratio >= 4.5 ? "(easy to read)" : ""}</span>
            </p>
            {check.warnings.map((w) => (
              <p key={w} role="alert" className="mt-2 rounded-xl border border-pop px-3 py-2 text-sm">
                {w}
              </p>
            ))}
          </Card>

          {/* Welcome */}
          <Card className="p-6">
            <label htmlFor="welcome" className="font-display text-xl font-bold">
              Welcome message
            </label>
            <p className="mt-1 text-sm text-muted">Optional. Shown on the first clock-in screen.</p>
            <textarea
              id="welcome"
              rows={2}
              maxLength={WELCOME_MAX}
              value={draft.welcome}
              placeholder="Safety first. Sign in at the trailer if you're new to site."
              onChange={(e) => change({ welcome: e.target.value })}
              className="mt-3 w-full rounded-2xl border border-line bg-raised px-4 py-3 text-base text-fg outline-none placeholder:text-muted focus:border-fg"
            />
            <p className="mt-1 text-right text-xs text-muted">
              {draft.welcome.length}/{WELCOME_MAX}
            </p>
          </Card>

          <div className="flex flex-wrap items-center gap-3">
            <Button
              variant="ink"
              disabled={!dirty}
              onClick={() => {
                setBrand({ ...draft, welcome: draft.welcome.trim() });
                setSavedAt(Date.now());
              }}
            >
              Save branding
            </Button>
            <Button variant="outline" disabled={!dirty} onClick={() => { setDraft(saved); setHexText(saved.color ?? DEFAULT_BRAND_COLOR); }}>
              Undo changes
            </Button>
            <button
              type="button"
              className="text-sm text-muted underline underline-offset-4 hover:text-fg"
              onClick={() => {
                setDraft(DEFAULT_BRAND);
                setHexText(DEFAULT_BRAND_COLOR);
              }}
            >
              Back to Musterpass defaults
            </button>
            <span role="status" className="text-sm text-muted">
              {savedAt ? "Saved. Clock-in screens and posters now use it." : dirty ? "Unsaved changes" : ""}
            </span>
          </div>
        </div>

        {/* Live preview */}
        <div className="space-y-3 lg:sticky lg:top-6 lg:self-start">
          <div className="flex items-baseline justify-between">
            <h2 className="font-display text-xl font-bold">Preview</h2>
            <Link href="/admin/sites" className="text-sm text-muted underline underline-offset-4 hover:text-fg">
              See your posters
            </Link>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <PhonePreview theme="light" brand={draft} company={company.name} site={firstSite} />
            <PhonePreview theme="dark" brand={draft} company={company.name} site={firstSite} />
          </div>
        </div>
      </div>
    </div>
  );
}

// Theme role values, so both previews show side by side whatever this page's theme is.
const ROLES: Record<"light" | "dark", CSSProperties> = {
  light: { "--bg": "#f5f5f0", "--raised": "#ffffff", "--fg": "#141414", "--muted": "#5e5e59", "--line": "#dddcd3" } as CSSProperties,
  dark: { "--bg": "#141414", "--raised": "#2a2a2a", "--fg": "#f5f5f0", "--muted": "#a3a39e", "--line": "#3a3a38" } as CSSProperties,
};

function PhonePreview({ theme, brand, company, site }: { theme: "light" | "dark"; brand: Brand; company: string; site: string }) {
  return (
    <figure>
      <div
        aria-hidden
        style={{ ...ROLES[theme], ...brandStyle(brand) }}
        className="flex aspect-[9/16] flex-col rounded-[2rem] border-[6px] border-graphite bg-bg p-4 text-fg"
      >
        <div className="flex items-center justify-between">
          {brand.logo ? <BrandLogo brand={brand} companyName={company} size="sm" /> : <Wordmark tone="fg" className="text-sm" />}
          <span className="truncate pl-2 text-[10px] text-muted">{site}</span>
        </div>
        <div className="flex flex-1 flex-col justify-center">
          <p className="text-[9px] uppercase tracking-[0.2em] text-muted">{company}</p>
          <p className="mt-1 font-display text-2xl font-bold leading-[0.95]">
            Clock in at
            <br />
            {site}
          </p>
          <p className="mt-2 line-clamp-3 text-[11px] text-muted">{brand.welcome.trim() || "A selfie, a quick location check and a short form. Under a minute."}</p>
          <div className="mt-5 rounded-full bg-brand py-2.5 text-center font-display text-sm font-bold text-brand-fg">Clock in</div>
        </div>
      </div>
      <figcaption className="mt-2 text-center text-xs text-muted">{theme === "light" ? "Light mode" : "Dark mode"}</figcaption>
    </figure>
  );
}
