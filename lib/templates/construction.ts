import { FIT_FOR_DUTY, type IndustryTemplate } from "./types";

export const construction: IndustryTemplate = {
  id: "construction",
  label: "Construction",
  blurb: "Daily Field Level Hazard Assessment, PPE check, visitor sign-in and muster list.",
  siteNoun: "site",
  siteExample: "Lonsdale Tower",
  addressExample: "1200 Lonsdale Ave, North Vancouver, BC",
  taskExample: "Framing, level 6",
  formName: "Field Level Hazard Assessment",
  formShort: "FLHA",
  readiness: [
    FIT_FOR_DUTY,
    { id: "muster", question: "Do you know where the muster point is?", expected: true, alert: "Hasn't reviewed the muster point" },
  ],
  hazards: [
    { id: "heights", label: "Working at heights", controls: ["Guardrails", "Fall arrest / tie-off", "Scaffold inspected", "Ladder secured"], photoByDefault: true, photoPrompt: "Photo of your fall protection: harness and tie-off point" },
    { id: "falling", label: "Falling objects", controls: ["Toe boards", "Exclusion zone below", "Tool lanyards"], photoByDefault: false, photoPrompt: "Photo of the exclusion zone" },
    { id: "equipment", label: "Mobile equipment", controls: ["Spotter", "Exclusion zone", "Eye contact with operator"], photoByDefault: false, photoPrompt: "Photo of the work area and equipment" },
    { id: "excavation", label: "Excavation or trenching", controls: ["Barricade", "Shoring", "Sloping", "Utility locates done"], photoByDefault: true, photoPrompt: "Photo of the barricade or shoring" },
    { id: "electrical", label: "Electrical", controls: ["Lockout / tagout", "GFCI in use", "Qualified worker only"], photoByDefault: false, photoPrompt: "Photo of the lockout" },
    { id: "hotwork", label: "Hot work", controls: ["Hot work permit", "Fire watch", "Extinguisher within reach"], photoByDefault: true, photoPrompt: "Photo of the extinguisher and cleared work area" },
    { id: "confined", label: "Confined space", controls: ["Entry permit", "Air monitoring", "Attendant posted"], photoByDefault: false, photoPrompt: "Photo of the entry permit" },
    { id: "hazmat", label: "Hazardous materials", controls: ["SDS reviewed", "Ventilation", "Respirator"], photoByDefault: false, photoPrompt: "Photo of the product label" },
    { id: "noise", label: "Noise", controls: ["Hearing protection"], photoByDefault: false, photoPrompt: "Photo" },
    { id: "weather", label: "Weather", controls: ["Breaks scheduled", "Water available", "Work paused if unsafe"], photoByDefault: false, photoPrompt: "Photo of conditions" },
    { id: "slips", label: "Slips, trips and housekeeping", controls: ["Area cleaned", "Cords managed", "Lighting adequate"], photoByDefault: false, photoPrompt: "Photo of the work area" },
    { id: "lifting", label: "Manual lifting", controls: ["Team lift", "Lifting aid", "Load checked"], photoByDefault: false, photoPrompt: "Photo of the load" },
  ],
  checks: [],
  checksTitle: "Checks",
  ppe: ["Hard hat", "Hi-vis", "Safety boots", "Eye protection", "Gloves", "Hearing protection", "Fall protection"],
  ppePhotoPrompt: "Photo of your PPE (hard hat, hi-vis, boots)",
  visitorRules:
    "Stay with your host, wear the PPE you're given, keep out of marked zones, and go to the muster point if the alarm sounds.",
};
