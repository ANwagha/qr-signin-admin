import { FIT_FOR_DUTY, type IndustryTemplate } from "./types";

export const general: IndustryTemplate = {
  id: "general",
  label: "Other / general",
  blurb: "A general daily safety check-in for any workplace: common hazards, readiness and PPE.",
  siteNoun: "location",
  siteExample: "Head office",
  addressExample: "800 Granville St, Vancouver, BC",
  taskExample: "Front desk, day shift",
  formName: "Daily safety check-in",
  formShort: "Safety check-in",
  readiness: [
    FIT_FOR_DUTY,
    { id: "muster", question: "Do you know the emergency exits and muster point?", expected: true, alert: "Hasn't reviewed exits and muster point" },
  ],
  hazards: [
    { id: "slips", label: "Slips and trips", controls: ["Area clear", "Spills cleaned", "Lighting adequate"], photoByDefault: false, photoPrompt: "Photo of the area" },
    { id: "lifting", label: "Lifting and carrying", controls: ["Team lift", "Cart used", "Load checked"], photoByDefault: false, photoPrompt: "Photo of the load" },
    { id: "electrical", label: "Electrical", controls: ["Cords inspected", "No overloaded outlets"], photoByDefault: false, photoPrompt: "Photo of the setup" },
    { id: "alone", label: "Working alone", controls: ["Check-in times agreed", "Phone charged"], photoByDefault: false, photoPrompt: "Photo" },
    { id: "violence", label: "Aggressive customers or visitors", controls: ["Know how to call for help", "Exit route clear"], photoByDefault: false, photoPrompt: "Photo" },
    { id: "ergonomics", label: "Ergonomics and screens", controls: ["Workstation adjusted", "Breaks planned"], photoByDefault: false, photoPrompt: "Photo of the workstation" },
  ],
  checks: [],
  checksTitle: "Checks",
  ppe: ["Safety shoes", "Gloves", "Eye protection", "Hi-vis", "None needed for my role"],
  ppePhotoPrompt: "Photo of you ready for work (PPE if any)",
  visitorRules: "Stay with your host, follow posted signs, and leave by the nearest exit if the alarm sounds.",
};
