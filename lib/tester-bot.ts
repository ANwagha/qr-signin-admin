"use client";

// The tester bot: uses the site the way a person would, inside an on-page frame, and reports
// what worked. It runs on the demo company and puts this browser's own data back afterwards.

import { loadDemo } from "@/lib/demo-seed";

const STORE_KEY = "musterpass.demo.v3";
const BOT_NAME = "Tester Bot";

export type CheckStatus = "waiting" | "running" | "passed" | "failed";
export type Check = { id: string; title: string; status: CheckStatus; detail: string; ms: number | null };
export type Log = (line: string) => void;

export const CHECKS: { id: string; title: string }[] = [
  { id: "pages", title: "Every page loads" },
  { id: "redirect", title: "Old poster links still work" },
  { id: "clockin", title: "A worker can clock in" },
  { id: "dashboard", title: "The dashboard shows them on site" },
  { id: "clockout", title: "They can clock out" },
  { id: "records", title: "Their record is saved" },
];

const PAGES = ["/", "/login", "/signup", "/admin", "/admin/sites", "/admin/people", "/admin/forms", "/admin/records", "/admin/branding", "/admin/billing", "/command", "/s/lonsdale-tower"];

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function waitFor<T>(fn: () => T | null | undefined | false, what: string, timeout = 10000): Promise<T> {
  const end = Date.now() + timeout;
  while (Date.now() < end) {
    try {
      const v = fn();
      if (v) return v;
    } catch {
      /* page still loading */
    }
    await sleep(120);
  }
  throw new Error(`Gave up waiting for ${what}.`);
}

/** Drives one page inside the frame. */
class Driver {
  constructor(
    private frame: HTMLIFrameElement,
    private log: Log,
  ) {}

  get doc() {
    return this.frame.contentDocument!;
  }
  get win() {
    return this.frame.contentWindow as (Window & typeof globalThis) | null;
  }

  async open(path: string) {
    this.log(`Opening ${path}`);
    await new Promise<void>((resolve, reject) => {
      const t = setTimeout(() => reject(new Error(`${path} took too long to load.`)), 20000);
      this.frame.onload = () => {
        clearTimeout(t);
        resolve();
      };
      this.frame.src = path;
    });
    await sleep(400);
  }

  heading() {
    return this.doc.querySelector("main h1")?.textContent?.trim() ?? "";
  }

  text() {
    return this.doc.body?.innerText ?? "";
  }

  setValue(el: HTMLInputElement | HTMLTextAreaElement, value: string) {
    const proto = el instanceof this.win!.HTMLTextAreaElement ? this.win!.HTMLTextAreaElement.prototype : this.win!.HTMLInputElement.prototype;
    Object.getOwnPropertyDescriptor(proto, "value")!.set!.call(el, value);
    el.dispatchEvent(new this.win!.Event("input", { bubbles: true }));
  }

  button(labels: string[]) {
    return [...this.doc.querySelectorAll<HTMLButtonElement>("main button")].find((b) => labels.includes(b.innerText.trim()) && !b.disabled);
  }

  /** Answers whatever is on the current screen the way a careful worker would. */
  async fillScreen() {
    const d = this.doc;
    const w = this.win!;

    // Text fields: name, company, phone and any free-text questions.
    for (const input of d.querySelectorAll<HTMLInputElement>("main input:not([type=file]):not([type=hidden])")) {
      if (input.value) continue;
      const label = (d.querySelector(`label[for="${CSS.escape(input.id)}"]`)?.textContent ?? "").toLowerCase();
      const value = label.includes("name") ? BOT_NAME : label.includes("phone") ? "604-555-0199" : input.inputMode === "decimal" ? "5" : "Musterpass QA";
      this.setValue(input, value);
      this.log(`Typed "${value}" into ${label || "a field"}`);
    }
    for (const ta of d.querySelectorAll<HTMLTextAreaElement>("main textarea")) {
      if (!ta.value) this.setValue(ta, "All good (tester bot run).");
    }

    // One answer per question group (yes/no and choices): the first option.
    for (const fs of d.querySelectorAll("main fieldset")) {
      const opts = [...fs.querySelectorAll<HTMLButtonElement>("button[aria-pressed]")];
      if (opts.length && !opts.some((b) => b.getAttribute("aria-pressed") === "true")) {
        opts[0].click();
        this.log(`Answered "${opts[0].innerText.trim()}"`);
        await sleep(60);
      }
    }
    // Agreement ticks outside question groups (consent, site rules).
    for (const b of d.querySelectorAll<HTMLButtonElement>("main button[aria-pressed='false']")) {
      if (b.closest("fieldset") || b.getAttribute("aria-label")) continue;
      b.click();
      this.log(`Ticked "${b.innerText.trim()}"`);
      await sleep(60);
    }

    // Photos: a generated test image, never a real person.
    for (const input of d.querySelectorAll<HTMLInputElement>("main input[type=file]")) {
      const holder = input.parentElement;
      if (holder?.querySelector("img")) continue;
      input.files = await testImage(w);
      input.dispatchEvent(new w.Event("change", { bubbles: true }));
      this.log("Took a test photo");
      await waitFor(() => holder?.querySelector("img"), "the photo to process");
    }

    // Location: the prototype's simulate button stands in for GPS.
    const sim = [...d.querySelectorAll<HTMLButtonElement>("main button")].find((b) => b.innerText.includes("simulate being on site"));
    if (sim && !this.text().includes("On site")) {
      sim.click();
      this.log("Checked location (simulated on site)");
      await sleep(150);
    }

    // Signature: draw a short stroke.
    const canvas = d.querySelector<HTMLCanvasElement>("main canvas");
    if (canvas && !canvas.dataset.botSigned) {
      const r = canvas.getBoundingClientRect();
      const at = (t: string, x: number, y: number) =>
        canvas.dispatchEvent(new w.PointerEvent(t, { bubbles: true, pointerId: 1, clientX: r.left + x, clientY: r.top + y, buttons: 1 }));
      at("pointerdown", 20, r.height / 2);
      for (let x = 30; x < Math.min(200, r.width - 10); x += 15) at("pointermove", x, r.height / 2 + Math.sin(x / 15) * 12);
      at("pointerup", 200, r.height / 2);
      canvas.dataset.botSigned = "1";
      this.log("Signed");
      await sleep(100);
    }
  }

  /** Fill and continue until the heading matches `goal`. */
  async runTo(goal: RegExp, primary: string[], maxScreens = 14) {
    for (let i = 0; i < maxScreens; i++) {
      const h = this.heading();
      if (goal.test(h)) return h;
      await this.fillScreen();
      const btn = await waitFor(() => this.button(primary), `a "${primary[0]}" button on "${h}"`, 4000);
      this.log(`Pressed "${btn.innerText.trim()}" on "${h}"`);
      btn.click();
      try {
        await waitFor(() => this.heading() !== h, `the next screen after "${h}"`, 5000);
      } catch {
        const err = this.doc.querySelector("main [role=alert]")?.textContent;
        throw new Error(err ? `Stuck on "${h}": ${err}` : `Stuck on "${h}".`);
      }
      await sleep(150);
    }
    throw new Error(`Didn't reach the end after ${maxScreens} screens.`);
  }
}

async function testImage(w: Window & typeof globalThis): Promise<FileList> {
  const c = document.createElement("canvas");
  c.width = c.height = 320;
  const x = c.getContext("2d")!;
  x.fillStyle = "#c6f432";
  x.fillRect(0, 0, 320, 320);
  x.fillStyle = "#141414";
  x.font = "bold 40px sans-serif";
  x.fillText("TEST", 110, 175);
  const blob = await new Promise<Blob>((r) => c.toBlob((b) => r(b!), "image/png"));
  const dt = new w.DataTransfer();
  dt.items.add(new w.File([blob], "tester-bot.png", { type: "image/png" }));
  return dt.files;
}

/**
 * Runs every check in order. `onUpdate` gets each check as it changes.
 * This browser's saved data is restored afterwards, whatever happens.
 */
export async function runTesterBot(frame: HTMLIFrameElement, onUpdate: (c: Check) => void, log: Log) {
  const saved = localStorage.getItem(STORE_KEY);
  const drv = new Driver(frame, log);
  const results: Check[] = [];

  async function check(id: string, fn: () => Promise<string>) {
    const title = CHECKS.find((c) => c.id === id)!.title;
    const t0 = performance.now();
    onUpdate({ id, title, status: "running", detail: "", ms: null });
    let c: Check;
    try {
      c = { id, title, status: "passed", detail: await fn(), ms: Math.round(performance.now() - t0) };
    } catch (e) {
      c = { id, title, status: "failed", detail: e instanceof Error ? e.message : String(e), ms: Math.round(performance.now() - t0) };
      log(`Failed: ${c.detail}`);
    }
    results.push(c);
    onUpdate(c);
    return c.status === "passed";
  }

  try {
    log("Loading the demo company for the test");
    await loadDemo();

    await check("pages", async () => {
      const bad: string[] = [];
      let slowest = 0;
      for (const p of PAGES) {
        const t0 = performance.now();
        const res = await fetch(p, { cache: "no-store" });
        slowest = Math.max(slowest, performance.now() - t0);
        log(`${p} → ${res.status}`);
        if (!res.ok) bad.push(`${p} (${res.status})`);
      }
      if (bad.length) throw new Error(`Didn't load: ${bad.join(", ")}`);
      return `${PAGES.length} pages, slowest ${Math.round(slowest)} ms`;
    });

    await check("redirect", async () => {
      const res = await fetch("/scan/lonsdale-tower", { cache: "no-store" });
      if (!res.ok || !new URL(res.url).pathname.startsWith("/s/lonsdale-tower")) throw new Error(`Ended up at ${new URL(res.url).pathname} (${res.status})`);
      return "/scan/… goes to /s/…";
    });

    const clockedIn = await check("clockin", async () => {
      await drv.open("/s/lonsdale-tower");
      await waitFor(() => drv.button(["Start", "Clock in"]), "the clock-in screen");
      await drv.runTo(/you're clocked in/i, ["Start", "Clock in", "Continue", "Sign and clock in"]);
      const flagged = drv.text().includes("Your supervisor will review");
      return `Clocked in at Lonsdale Tower${flagged ? " (with answers for a supervisor to review)" : ""}`;
    });

    await check("dashboard", async () => {
      if (!clockedIn) throw new Error("Skipped: clock-in didn't finish.");
      await drv.open("/admin");
      await waitFor(() => drv.text().includes(BOT_NAME), `${BOT_NAME} on the dashboard`);
      return `${BOT_NAME} is on the live list`;
    });

    const clockedOut = await check("clockout", async () => {
      if (!clockedIn) throw new Error("Skipped: clock-in didn't finish.");
      await drv.open("/s/lonsdale-tower");
      const out = await waitFor(() => drv.button(["Clock out"]), "the Clock out button");
      out.click();
      await waitFor(() => /clock out/i.test(drv.heading()), "the clock-out screen");
      await drv.runTo(/you're clocked out/i, ["Clock out"]);
      return "Clocked out";
    });

    await check("records", async () => {
      if (!clockedOut) throw new Error("Skipped: clock-out didn't finish.");
      await drv.open("/admin/records");
      await waitFor(() => drv.text().includes(BOT_NAME), `${BOT_NAME} in Records`);
      return "Clock-in and clock-out are in Records";
    });
  } finally {
    // Put this browser's own data back exactly as it was.
    if (saved === null) localStorage.removeItem(STORE_KEY);
    else localStorage.setItem(STORE_KEY, saved);
    window.dispatchEvent(new StorageEvent("storage", { key: STORE_KEY }));
    frame.src = "about:blank";
    log("Put your saved data back");
  }
  return results;
}
