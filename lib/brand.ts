import type { CSSProperties } from "react";

// Company branding: a logo, a brand colour and a short welcome line. Workers see it on the
// clock-in screens and the gate poster. The admin stays in Musterpass colours.

export type Brand = {
  /** Hex colour for the main buttons on clock-in screens. null = Musterpass volt. */
  color: string | null;
  /** PNG data URL, at most 320px on its longest side. */
  logo: string | null;
  /** The tile behind the logo: light suits dark logos, dark suits light (white) logos. */
  logoBg: "light" | "dark";
  /** Shown on the clock-in start screen. */
  welcome: string;
};

export const DEFAULT_BRAND_COLOR = "#c6f432";
export const WELCOME_MAX = 140;

export const DEFAULT_BRAND: Brand = { color: null, logo: null, logoBg: "light", welcome: "" };

export const BRAND_PRESETS = [
  { name: "Musterpass volt", hex: "#c6f432" },
  { name: "Safety orange", hex: "#ff6a13" },
  { name: "Hi-vis yellow", hex: "#ffd400" },
  { name: "Signal blue", hex: "#1f5eff" },
  { name: "Forest green", hex: "#1e7a46" },
  { name: "Brick red", hex: "#b3261e" },
  { name: "Slate", hex: "#3d4a5c" },
  { name: "Black", hex: "#141414" },
];

const INK = "#141414";
const WHITE = "#ffffff";
const LIGHT_BG = "#f5f5f0";
const DARK_BG = "#141414";

/** "#abc", "abc", "#AABBCC" → "#aabbcc"; anything else → null. */
export function normalizeHex(input: string): string | null {
  let h = input.trim().replace(/^#/, "").toLowerCase();
  if (/^[0-9a-f]{3}$/.test(h)) h = h.split("").map((c) => c + c).join("");
  return /^[0-9a-f]{6}$/.test(h) ? `#${h}` : null;
}

function luminance(hex: string) {
  const n = parseInt(hex.slice(1), 16);
  const ch = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => {
    const s = v / 255;
    return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * ch[0] + 0.7152 * ch[1] + 0.0722 * ch[2];
}

/** WCAG contrast ratio between two hex colours (1 to 21). */
export function contrast(a: string, b: string) {
  const [x, y] = [luminance(a), luminance(b)].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
}

/** Black or white, whichever reads better on the colour. */
export function textOn(color: string) {
  return contrast(color, INK) >= contrast(color, WHITE) ? INK : WHITE;
}

export type BrandCheck = { text: string; textName: "black" | "white"; ratio: number; warnings: string[] };

/** What the button text will be, how readable it is, and anything worth warning about. */
export function checkBrandColor(color: string): BrandCheck {
  const text = textOn(color);
  const ratio = contrast(color, text);
  const warnings: string[] = [];
  if (ratio < 4.5)
    warnings.push(`Button text is hard to read on this colour (${ratio.toFixed(1)}:1, aim for 4.5:1). Try a darker or brighter shade.`);
  if (contrast(color, LIGHT_BG) < 1.25) warnings.push("Buttons will nearly disappear against the light background.");
  if (contrast(color, DARK_BG) < 1.25) warnings.push("Buttons will nearly disappear against the dark background.");
  return { text, textName: text === INK ? "black" : "white", ratio, warnings };
}

/** CSS variables that recolour `bg-brand` / `text-brand-fg` inside an element. */
export function brandStyle(brand: Brand | null | undefined): CSSProperties | undefined {
  const color = brand?.color && normalizeHex(brand.color);
  if (!color) return undefined;
  return { "--brand": color, "--brand-fg": textOn(color) } as CSSProperties;
}

/** Shrink an uploaded logo to a PNG data URL (keeps transparency). SVGs are drawn to pixels. */
export async function logoToDataUrl(file: File, maxSide = 320): Promise<string> {
  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    img.src = url;
    await img.decode();
    // Some SVGs have no intrinsic size; draw them at the maximum.
    const w = img.naturalWidth || maxSide;
    const h = img.naturalHeight || maxSide;
    const scale = Math.min(1, maxSide / Math.max(w, h));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(w * scale));
    canvas.height = Math.max(1, Math.round(h * scale));
    canvas.getContext("2d")!.drawImage(img, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL("image/png");
  } finally {
    URL.revokeObjectURL(url);
  }
}
