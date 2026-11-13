// Field Level Hazard Assessment template (construction). See founding document, section 01.

export type Hazard = {
  id: string;
  label: string;
  controls: string[];
  photoByDefault: boolean;
  photoPrompt: string;
};

export const FLHA_HAZARDS: Hazard[] = [
  {
    id: "heights",
    label: "Working at heights",
    controls: ["Guardrails", "Fall arrest / tie-off", "Scaffold inspected", "Ladder secured"],
    photoByDefault: true,
    photoPrompt: "Photo of your fall protection: harness and tie-off point",
  },
  {
    id: "falling",
    label: "Falling objects",
    controls: ["Toe boards", "Exclusion zone below", "Tool lanyards"],
    photoByDefault: false,
    photoPrompt: "Photo of the exclusion zone",
  },
  {
    id: "equipment",
    label: "Mobile equipment",
    controls: ["Spotter", "Exclusion zone", "Eye contact with operator"],
    photoByDefault: false,
    photoPrompt: "Photo of the work area and equipment",
  },
  {
    id: "excavation",
    label: "Excavation or trenching",
    controls: ["Barricade", "Shoring", "Sloping", "Utility locates done"],
    photoByDefault: true,
    photoPrompt: "Photo of the barricade or shoring",
  },
  {
    id: "electrical",
    label: "Electrical",
    controls: ["Lockout / tagout", "GFCI in use", "Qualified worker only"],
    photoByDefault: false,
    photoPrompt: "Photo of the lockout",
  },
  {
    id: "hotwork",
    label: "Hot work",
    controls: ["Hot work permit", "Fire watch", "Extinguisher within reach"],
    photoByDefault: true,
    photoPrompt: "Photo of the extinguisher and cleared work area",
  },
  {
    id: "confined",
    label: "Confined space",
    controls: ["Entry permit", "Air monitoring", "Attendant posted"],
    photoByDefault: false,
    photoPrompt: "Photo of the entry permit",
  },
  {
    id: "hazmat",
    label: "Hazardous materials",
    controls: ["SDS reviewed", "Ventilation", "Respirator"],
    photoByDefault: false,
    photoPrompt: "Photo of the product label",
  },
  { id: "noise", label: "Noise", controls: ["Hearing protection"], photoByDefault: false, photoPrompt: "Photo" },
  {
    id: "weather",
    label: "Weather",
    controls: ["Breaks scheduled", "Water available", "Work paused if unsafe"],
    photoByDefault: false,
    photoPrompt: "Photo of conditions",
  },
  {
    id: "slips",
    label: "Slips, trips and housekeeping",
    controls: ["Area cleaned", "Cords managed", "Lighting adequate"],
    photoByDefault: false,
    photoPrompt: "Photo of the work area",
  },
  {
    id: "lifting",
    label: "Manual lifting",
    controls: ["Team lift", "Lifting aid", "Load checked"],
    photoByDefault: false,
    photoPrompt: "Photo of the load",
  },
];

export const PPE_ITEMS = [
  "Hard hat",
  "Hi-vis",
  "Safety boots",
  "Eye protection",
  "Gloves",
  "Hearing protection",
  "Fall protection",
];

export const PPE_PHOTO_PROMPT = "Photo of your PPE (hard hat, hi-vis, boots)";

export const CONSENT_TEXT =
  "To keep this site safe, Musterpass records your name, a selfie, your location at check-in and check-out, your safety form and its photos. Your employer and the site's safety team can see them. Selfies are kept for 90 days; safety records are kept as required by law. Location is never tracked during your shift.";

export function hazardById(id: string) {
  return FLHA_HAZARDS.find((h) => h.id === id);
}
