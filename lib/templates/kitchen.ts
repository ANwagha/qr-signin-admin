import type { IndustryTemplate } from "./types";

// Temperatures follow common BC food-safety guidance: cold ≤ 4 °C, frozen ≤ −18 °C, hot holding ≥ 60 °C.
export const kitchen: IndustryTemplate = {
  id: "kitchen",
  label: "Kitchen and food service",
  blurb: "Opening safety and food-safety check: illness screen, fridge and hot-holding temperatures, handwash station.",
  siteNoun: "kitchen",
  siteExample: "Main Street kitchen",
  addressExample: "2400 Main St, Vancouver, BC",
  taskExample: "Prep line, opening shift",
  formName: "Opening safety and food-safety check",
  formShort: "Opening check",
  readiness: [
    { id: "illness", question: "No vomiting, diarrhea or fever in the last 48 hours?", expected: true, alert: "Reported illness symptoms: must not handle food" },
    { id: "cuts", question: "Any cuts or sores on your hands are covered (or you have none)?", expected: true, alert: "Uncovered cut or sore on hands" },
    { id: "exits", question: "Do you know the fire exits and where the extinguisher is?", expected: true, alert: "Hasn't reviewed fire exits and extinguisher" },
  ],
  hazards: [
    { id: "burns", label: "Burns and hot oil", controls: ["Oven mitts", "Fryer lid / guard", "Announce 'hot behind'"], photoByDefault: false, photoPrompt: "Photo of the fryer area" },
    { id: "knives", label: "Knives and slicers", controls: ["Cut-resistant glove", "Slicer guard on", "Knives stored safely"], photoByDefault: false, photoPrompt: "Photo of the slicer guard" },
    { id: "slips", label: "Slips and wet floors", controls: ["Mats down", "Spills cleaned", "Wet-floor sign"], photoByDefault: true, photoPrompt: "Photo of the mats or wet-floor sign" },
    { id: "chemicals", label: "Cleaning chemicals", controls: ["Labelled bottles", "SDS available", "Gloves on"], photoByDefault: false, photoPrompt: "Photo of the chemical labels" },
    { id: "allergens", label: "Allergen cross-contact", controls: ["Separate boards and tools", "Labels checked", "Surfaces sanitized"], photoByDefault: false, photoPrompt: "Photo of the allergen station" },
    { id: "lifting", label: "Heavy lifting", controls: ["Team lift", "Cart used", "Load split"], photoByDefault: false, photoPrompt: "Photo of the load" },
  ],
  checksTitle: "Food-safety checks",
  checks: [
    { id: "fridge", kind: "number", label: "Walk-in fridge temperature", unit: "°C", max: 4, failAlert: "Fridge above 4 °C" },
    { id: "freezer", kind: "number", label: "Freezer temperature", unit: "°C", max: -18, failAlert: "Freezer warmer than −18 °C" },
    { id: "hothold", kind: "number", label: "Hot-holding temperature", unit: "°C", min: 60, failAlert: "Hot holding below 60 °C" },
    { id: "handwash", kind: "photo", label: "Handwash station stocked (soap, paper towels, hot water)", photoPrompt: "Photo of the handwash station" },
  ],
  ppe: ["Hairnet or hat", "Apron", "Cut-resistant glove", "Non-slip shoes"],
  ppePhotoPrompt: "Photo of your hairnet, apron and shoes",
  visitorRules:
    "Wash your hands, wear a hairnet in food areas, stay out of the line unless your host brings you, and leave by the nearest exit if the alarm sounds.",
};
