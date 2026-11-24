import { FIT_FOR_DUTY, type IndustryTemplate } from "./types";

export const cleaning: IndustryTemplate = {
  id: "cleaning",
  label: "Cleaning and facilities",
  blurb: "Job-start safety check: chemicals and labels, wet floors, ladders, sharps and working alone.",
  siteNoun: "building",
  siteExample: "Metrotown office tower",
  addressExample: "4710 Kingsway, Burnaby, BC",
  taskExample: "Floors 10–15, night clean",
  formName: "Job-start safety check",
  formShort: "Job-start check",
  readiness: [
    FIT_FOR_DUTY,
    // Expected "No": working alone isn't wrong, but the supervisor must plan check-ins for it.
    { id: "alone", question: "Will you be working alone today?", expected: false, alert: "Working alone: supervisor to arrange check-ins" },
    { id: "exits", question: "Do you know this building's exits?", expected: true, alert: "Hasn't reviewed the building's exits" },
  ],
  hazards: [
    { id: "chemicals", label: "Chemicals (WHMIS / SDS)", controls: ["Labelled bottles", "SDS available", "Never mix products", "Gloves and eye protection"], photoByDefault: true, photoPrompt: "Photo of the product label you're using" },
    { id: "wetfloor", label: "Wet floors", controls: ["Wet-floor sign placed", "Area closed off", "Dry mop after"], photoByDefault: true, photoPrompt: "Photo of the wet-floor sign in place" },
    { id: "ladders", label: "Ladders", controls: ["Ladder inspected", "Three points of contact", "Not on top step"], photoByDefault: false, photoPrompt: "Photo of the ladder setup" },
    { id: "sharps", label: "Sharps and biohazards", controls: ["Puncture-resistant gloves", "Sharps container", "No hands in bins"], photoByDefault: false, photoPrompt: "Photo of the sharps container" },
    { id: "electrical", label: "Electrical equipment", controls: ["Cords inspected", "No wet hands", "GFCI outlet"], photoByDefault: false, photoPrompt: "Photo of the equipment cord" },
    { id: "lifting", label: "Lifting and carts", controls: ["Team lift", "Cart used", "Bags not overfilled"], photoByDefault: false, photoPrompt: "Photo of the load" },
    { id: "alone", label: "Working alone", controls: ["Check-in times agreed", "Phone charged", "Doors secured"], photoByDefault: false, photoPrompt: "Photo" },
  ],
  checks: [],
  checksTitle: "Checks",
  ppe: ["Gloves", "Eye protection", "Non-slip shoes", "Mask (where needed)"],
  ppePhotoPrompt: "Photo of your gloves and shoes",
  visitorRules: "Stay with your host, avoid areas marked with wet-floor signs, and leave by the nearest exit if the alarm sounds.",
};
