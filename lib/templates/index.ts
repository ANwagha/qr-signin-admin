import { cleaning } from "./cleaning";
import { construction } from "./construction";
import { general } from "./general";
import { kitchen } from "./kitchen";
import { manufacturing } from "./manufacturing";
import type { IndustryId, IndustryTemplate } from "./types";
import { warehouse } from "./warehouse";

export * from "./types";

/** In sign-up order. */
export const TEMPLATES: IndustryTemplate[] = [construction, warehouse, kitchen, manufacturing, cleaning, general];

export function templateFor(industry: IndustryId | string | undefined): IndustryTemplate {
  return TEMPLATES.find((t) => t.id === industry) ?? construction;
}

export function hazardById(t: IndustryTemplate, id: string) {
  return t.hazards.find((h) => h.id === id);
}

export function defaultPhotoRequired(t: IndustryTemplate): Record<string, boolean> {
  return Object.fromEntries(t.hazards.map((h) => [h.id, h.photoByDefault]));
}

/** Whether a check answer needs a supervisor's attention. */
export function checkFailed(t: IndustryTemplate, id: string, a: { pass?: boolean; value?: number } | undefined) {
  const c = t.checks.find((x) => x.id === id);
  if (!c || !a) return false;
  if (c.kind === "passfail") return a.pass === false;
  if (c.kind === "number") {
    if (a.value === undefined || Number.isNaN(a.value)) return false;
    return (c.max !== undefined && a.value > c.max) || (c.min !== undefined && a.value < c.min);
  }
  return false;
}
