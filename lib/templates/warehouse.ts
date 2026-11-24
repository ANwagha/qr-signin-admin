import { FIT_FOR_DUTY, type IndustryTemplate } from "./types";

export const warehouse: IndustryTemplate = {
  id: "warehouse",
  label: "Warehouse and logistics",
  blurb: "Pre-shift safety check with a forklift pre-use inspection, racking and dock hazards.",
  siteNoun: "warehouse",
  siteExample: "Annacis Island DC",
  addressExample: "1500 Cliveden Ave, Delta, BC",
  taskExample: "Picking, aisles 10–14",
  formName: "Pre-shift safety check",
  formShort: "Pre-shift check",
  readiness: [
    FIT_FOR_DUTY,
    { id: "trained", question: "Are you trained and certified for any equipment you'll use today?", expected: true, alert: "Not trained on today's equipment" },
    { id: "muster", question: "Do you know the emergency exits and muster point?", expected: true, alert: "Hasn't reviewed exits and muster point" },
  ],
  hazards: [
    { id: "forklift", label: "Forklifts and pedestrians", controls: ["Marked walkways", "Spotter", "Horn at intersections", "Speed limit followed"], photoByDefault: true, photoPrompt: "Photo of the walkway or traffic area" },
    { id: "racking", label: "Racking damage or overloading", controls: ["Racking inspected", "Load limits posted", "Damage reported"], photoByDefault: true, photoPrompt: "Photo of the racking you'll work in" },
    { id: "dock", label: "Loading docks and trailers", controls: ["Wheel chocks / restraint", "Dock plate secured", "Trailer inspected"], photoByDefault: true, photoPrompt: "Photo of the trailer restraint or wheel chocks" },
    { id: "lifting", label: "Manual lifting", controls: ["Team lift", "Lifting aid", "Load checked"], photoByDefault: false, photoPrompt: "Photo of the load" },
    { id: "conveyor", label: "Conveyors", controls: ["Guards in place", "E-stop tested", "No loose clothing"], photoByDefault: false, photoPrompt: "Photo of the conveyor guard" },
    { id: "battery", label: "Battery charging", controls: ["Ventilation", "Eye wash nearby", "Face shield"], photoByDefault: false, photoPrompt: "Photo of the charging area" },
    { id: "slips", label: "Slips, trips and housekeeping", controls: ["Aisles clear", "Spills cleaned", "Pallets stacked"], photoByDefault: false, photoPrompt: "Photo of the aisle" },
    { id: "cold", label: "Cold storage", controls: ["Insulated gear", "Warm-up breaks", "Door release checked"], photoByDefault: false, photoPrompt: "Photo of the freezer door release" },
  ],
  checksTitle: "Forklift pre-use inspection",
  checks: [
    { id: "brakes", kind: "passfail", label: "Brakes and parking brake work", photoOnFail: true, failAlert: "Forklift brakes failed inspection" },
    { id: "horn", kind: "passfail", label: "Horn and lights work", photoOnFail: true, failAlert: "Forklift horn or lights failed inspection" },
    { id: "forks", kind: "passfail", label: "Forks, mast and chains undamaged", photoOnFail: true, failAlert: "Forklift forks or chains failed inspection" },
    { id: "leaks", kind: "passfail", label: "No fluid leaks", photoOnFail: true, failAlert: "Forklift fluid leak found" },
  ],
  ppe: ["Hi-vis", "Safety boots", "Gloves", "Hard hat (racking zones)"],
  ppePhotoPrompt: "Photo of your PPE (hi-vis and boots)",
  visitorRules:
    "Stay with your host, keep to marked walkways, wear the hi-vis you're given, and go to the muster point if the alarm sounds.",
};
