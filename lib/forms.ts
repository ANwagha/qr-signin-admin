// Company-defined check-in and check-out forms. Built on the Forms page; answered on the phone.

export type QuestionType = "yesno" | "choice" | "multi" | "text" | "number" | "photo";

export type Question = {
  id: string;
  label: string;
  type: QuestionType;
  required: boolean;
  /** choice / multi */
  options?: string[];
  /** number */
  unit?: string;
  /** When the supervisor should be alerted. */
  flag?: {
    yesno?: boolean; // flag when the answer equals this
    options?: string[]; // flag when any of these is chosen
    min?: number; // flag below
    max?: number; // flag above
  };
};

export type FormWhen = "check-in" | "check-out";

export type FormDef = {
  id: string;
  name: string;
  description: string;
  when: FormWhen;
  active: boolean;
  /** Ask for a finger signature after this form. */
  signature: boolean;
  questions: Question[];
};

/** Photo answers hold the id of a photo in the check-in's `photos` list. */
export type AnswerValue = boolean | number | string | string[] | null;

/** A completed form, with the questions copied in so old records still read correctly after edits. */
export type FormResponse = {
  formId: string;
  name: string;
  questions: Question[];
  answers: Record<string, AnswerValue>;
};

export const QUESTION_TYPES: { type: QuestionType; label: string }[] = [
  { type: "yesno", label: "Yes / no" },
  { type: "choice", label: "Pick one" },
  { type: "multi", label: "Pick any" },
  { type: "text", label: "Short answer" },
  { type: "number", label: "Number" },
  { type: "photo", label: "Photo" },
];

export function newId() {
  return Math.random().toString(36).slice(2, 9);
}

export function isAnswered(q: Question, v: AnswerValue | undefined) {
  if (v === undefined || v === null) return false;
  if (q.type === "text") return String(v).trim() !== "";
  if (q.type === "multi") return Array.isArray(v) && v.length > 0;
  if (q.type === "number") return typeof v === "number" && !Number.isNaN(v);
  return true;
}

export function isFlagged(q: Question, v: AnswerValue | undefined) {
  if (!q.flag || !isAnswered(q, v)) return false;
  if (q.type === "yesno") return q.flag.yesno !== undefined && v === q.flag.yesno;
  if (q.type === "choice") return !!q.flag.options?.includes(String(v));
  if (q.type === "multi") return Array.isArray(v) && v.some((x) => q.flag?.options?.includes(x));
  if (q.type === "number" && typeof v === "number")
    return (q.flag.min !== undefined && v < q.flag.min) || (q.flag.max !== undefined && v > q.flag.max);
  return false;
}

export function answerText(q: Question, v: AnswerValue | undefined) {
  if (!isAnswered(q, v)) return "—";
  if (q.type === "yesno") return v ? "Yes" : "No";
  if (q.type === "multi") return (v as string[]).join(", ");
  if (q.type === "number") return `${v}${q.unit ? ` ${q.unit}` : ""}`;
  if (q.type === "photo") return "Photo taken";
  return String(v);
}

export function flagsForResponse(r: FormResponse) {
  return r.questions.filter((q) => isFlagged(q, r.answers[q.id])).map((q) => `${q.label} → ${answerText(q, r.answers[q.id])}`);
}

export function flagRuleText(q: Question) {
  if (!q.flag) return null;
  if (q.type === "yesno" && q.flag.yesno !== undefined) return `Alerts on "${q.flag.yesno ? "Yes" : "No"}"`;
  if ((q.type === "choice" || q.type === "multi") && q.flag.options?.length) return `Alerts on: ${q.flag.options.join(", ")}`;
  if (q.type === "number") {
    const parts = [];
    if (q.flag.min !== undefined) parts.push(`below ${q.flag.min}`);
    if (q.flag.max !== undefined) parts.push(`above ${q.flag.max}`);
    return parts.length ? `Alerts ${parts.join(" or ")}${q.unit ? ` ${q.unit}` : ""}` : null;
  }
  return null;
}

function q(label: string, type: QuestionType, extra: Partial<Question> = {}): Question {
  return { id: newId(), label, type, required: true, ...extra };
}

/** Ready-made forms a company can add from the Forms page. Every one is fully editable. */
export const FORM_LIBRARY: Omit<FormDef, "id" | "active">[] = [
  {
    name: "Fit for work",
    description: "A quick check that everyone is ready to start safely.",
    when: "check-in",
    signature: false,
    questions: [
      q("Are you fit for work today? (rested, not impaired, no injury)", "yesno", { flag: { yesno: false } }),
      q("Do you know where the emergency exits and muster point are?", "yesno", { flag: { yesno: false } }),
    ],
  },
  {
    name: "End of shift",
    description: "Asked when people clock out.",
    when: "check-out",
    signature: false,
    questions: [
      q("Any incidents, injuries or near misses today?", "yesno", { flag: { yesno: true } }),
      q("Anything your supervisor should know?", "text", { required: false }),
    ],
  },
  {
    name: "PPE check",
    description: "Confirm protective equipment, with a photo.",
    when: "check-in",
    signature: true,
    questions: [
      q("What PPE are you wearing?", "multi", { options: ["Hard hat", "Hi-vis", "Safety boots", "Gloves", "Eye protection", "Hearing protection", "None needed"] }),
      q("Photo of your PPE", "photo"),
    ],
  },
  {
    name: "Hazard assessment",
    description: "A short field-level hazard assessment before work starts.",
    when: "check-in",
    signature: true,
    questions: [
      q("What are you working on today?", "text"),
      q("Which hazards apply?", "multi", {
        options: ["Working at heights", "Moving equipment", "Electrical", "Chemicals", "Lifting", "Slips and trips", "None"],
        flag: { options: ["Working at heights", "Electrical"] },
      }),
      q("How are they controlled?", "text"),
      q("Photo of the work area", "photo", { required: false }),
    ],
  },
  {
    name: "Equipment check",
    description: "Pre-use inspection for a vehicle or machine.",
    when: "check-in",
    signature: false,
    questions: [
      q("Equipment", "text"),
      q("Brakes, horn and lights all work?", "yesno", { flag: { yesno: false } }),
      q("Any damage or leaks?", "yesno", { flag: { yesno: true } }),
      q("Photo of any problem", "photo", { required: false }),
    ],
  },
  {
    name: "Temperature log",
    description: "Fridge and freezer readings.",
    when: "check-in",
    signature: false,
    questions: [
      q("Fridge temperature", "number", { unit: "°C", flag: { max: 4 } }),
      q("Freezer temperature", "number", { unit: "°C", flag: { max: -18 } }),
    ],
  },
];

export function fromLibrary(name: string, active = true): FormDef {
  const t = FORM_LIBRARY.find((f) => f.name === name)!;
  // Fresh ids so two copies of the same template never share question ids.
  return { ...t, id: newId(), active, questions: t.questions.map((x) => ({ ...x, id: newId() })) };
}

export function blankForm(): FormDef {
  return {
    id: newId(),
    name: "New form",
    description: "",
    when: "check-in",
    active: false,
    signature: false,
    questions: [q("New question", "yesno")],
  };
}

export function starterForms(): FormDef[] {
  return [fromLibrary("Fit for work"), fromLibrary("End of shift")];
}

export const CONSENT_TEXT =
  "Musterpass records your name, a selfie, your location when you clock in and out, and any forms you fill in. Your employer can see them. Selfies are kept for 90 days; time and form records are kept as required by law. Location is never tracked during your shift.";
