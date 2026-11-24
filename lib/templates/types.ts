// Industry check-in templates. Each industry gets its own daily safety form, chosen at sign-up.

export type IndustryId = "construction" | "warehouse" | "kitchen" | "manufacturing" | "cleaning" | "general";

export type Hazard = {
  id: string;
  label: string;
  controls: string[];
  photoByDefault: boolean;
  photoPrompt: string;
};

/** Yes/no question asked before work starts. Answering differently from `expected` alerts the supervisor. */
export type ReadinessQuestion = {
  id: string;
  question: string;
  expected: boolean;
  alert: string;
};

export type Check =
  | {
      id: string;
      kind: "passfail";
      label: string;
      /** Photo required when the item fails (to show the problem). */
      photoOnFail: boolean;
      failAlert: string;
    }
  | {
      id: string;
      kind: "number";
      label: string;
      unit: string;
      min?: number;
      max?: number;
      failAlert: string;
    }
  | {
      id: string;
      kind: "photo";
      label: string;
      photoPrompt: string;
    };

export type IndustryTemplate = {
  id: IndustryId;
  label: string;
  blurb: string;
  siteNoun: string; // "site", "warehouse", "kitchen"…
  siteExample: string;
  addressExample: string;
  taskExample: string;
  formName: string;
  formShort: string;
  readiness: ReadinessQuestion[];
  hazards: Hazard[];
  checks: Check[];
  checksTitle: string;
  ppe: string[];
  ppePhotoPrompt: string;
  visitorRules: string;
};

export const FIT_FOR_DUTY: ReadinessQuestion = {
  id: "fit",
  question: "Are you fit for duty today? (rested, not impaired, no injury)",
  expected: true,
  alert: "Not fit for duty",
};
