import { FIT_FOR_DUTY, type IndustryTemplate } from "./types";

export const manufacturing: IndustryTemplate = {
  id: "manufacturing",
  label: "Manufacturing",
  blurb: "Pre-shift machine and safety check: guarding, lockout, e-stop test and plant hazards.",
  siteNoun: "plant",
  siteExample: "Port Kells plant",
  addressExample: "9000 196 St, Langley, BC",
  taskExample: "CNC line 2",
  formName: "Pre-shift machine and safety check",
  formShort: "Machine check",
  readiness: [
    FIT_FOR_DUTY,
    { id: "trained", question: "Are you trained on the machine you'll run today?", expected: true, alert: "Not trained on today's machine" },
    { id: "muster", question: "Do you know the muster point?", expected: true, alert: "Hasn't reviewed the muster point" },
  ],
  hazards: [
    { id: "guarding", label: "Machine guarding", controls: ["Guards in place", "Interlocks tested", "No bypassing"], photoByDefault: true, photoPrompt: "Photo of the machine guard" },
    { id: "lockout", label: "Lockout / tagout for maintenance", controls: ["Personal lock applied", "Energy verified zero", "Tag filled in"], photoByDefault: true, photoPrompt: "Photo of your lock and tag" },
    { id: "pinch", label: "Moving parts and pinch points", controls: ["Hands clear", "Two-hand controls", "No loose clothing or jewellery"], photoByDefault: false, photoPrompt: "Photo of the work area" },
    { id: "noise", label: "Noise", controls: ["Hearing protection"], photoByDefault: false, photoPrompt: "Photo" },
    { id: "hot", label: "Hot surfaces", controls: ["Heat gloves", "Signage", "Cool-down time"], photoByDefault: false, photoPrompt: "Photo of the hot area signage" },
    { id: "chemicals", label: "Chemicals", controls: ["SDS reviewed", "Ventilation", "Gloves and eye protection"], photoByDefault: false, photoPrompt: "Photo of the product label" },
    { id: "forklift", label: "Forklifts in the plant", controls: ["Marked walkways", "Horn at intersections"], photoByDefault: false, photoPrompt: "Photo of the walkway" },
    { id: "strain", label: "Repetitive strain", controls: ["Job rotation", "Stretch breaks", "Adjusted workstation"], photoByDefault: false, photoPrompt: "Photo of the workstation" },
  ],
  checksTitle: "Machine checks",
  checks: [
    { id: "guards", kind: "passfail", label: "All machine guards in place", photoOnFail: true, failAlert: "Machine guard missing or damaged" },
    { id: "estop", kind: "passfail", label: "Emergency stop tested and works", photoOnFail: true, failAlert: "Emergency stop failed test" },
  ],
  ppe: ["Safety glasses", "Hearing protection", "Safety boots", "Gloves", "Hi-vis"],
  ppePhotoPrompt: "Photo of your PPE (glasses, hearing protection, boots)",
  visitorRules:
    "Stay with your host, keep to marked walkways, wear the glasses and hearing protection you're given, and go to the muster point if the alarm sounds.",
};
