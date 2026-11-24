"use client";

import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import { Button, Card, Pill } from "@/components/ui";
import type { CompaniesResponse, Version, VersionsResponse } from "@/lib/command-types";
import { useStore } from "@/lib/store";
import { CHECKS, runTesterBot, type Check } from "@/lib/tester-bot";

type Tab = "versions" | "bot" | "companies";
const KEY_STORE = "musterpass.commandKey";

type Gate = "checking" | "locked" | "setup" | "open";

async function checkKey(k: string): Promise<Gate | "wrong"> {
  const res = await fetch("/api/command/check", { method: "POST", headers: { "x-command-key": k }, cache: "no-store" });
  if (res.ok) return "open";
  if (res.status === 503) return "setup";
  return "wrong";
}

/** Nothing in the command center shows until the right command key is entered. */
export default function CommandCenter() {
  const [gate, setGate] = useState<Gate>("checking");
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // A key entered earlier in this tab: check it's still right.
  useEffect(() => {
    const k = readKey();
    if (!k) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- nothing to check without a key
      setGate("locked");
      return;
    }
    checkKey(k)
      .then((g) => {
        if (g === "wrong") forgetKey();
        setGate(g === "wrong" ? "locked" : g);
      })
      .catch(() => setGate("locked"));
  }, []);

  async function unlock(e: FormEvent) {
    e.preventDefault();
    const k = draft.trim();
    if (!k || busy) return;
    setBusy(true);
    setError(null);
    try {
      const g = await checkKey(k);
      if (g === "wrong") return setError("That isn't the command key.");
      if (g === "open") {
        try {
          sessionStorage.setItem(KEY_STORE, k);
        } catch {}
        setDraft("");
      }
      setGate(g);
    } catch {
      setError("Couldn't reach the server. Try again.");
    } finally {
      setBusy(false);
    }
  }

  if (gate === "checking") return <div className="mx-auto mt-16 h-48 max-w-md animate-pulse rounded-3xl bg-line/60" />;

  if (gate === "setup")
    return (
      <Card className="mx-auto mt-10 max-w-lg p-6">
        <h1 className="font-display text-2xl font-bold">Set a command key first</h1>
        <p className="mt-2 text-sm text-muted">
          The command center stays locked until it has a key. In Vercel → musterpass → Settings → Environment Variables, add{" "}
          <code className="font-mono font-semibold text-fg">COMMAND_KEY</code> as a secret, with a long phrase only the Musterpass team knows.
          Then redeploy and come back.
        </p>
      </Card>
    );

  if (gate === "locked")
    return (
      <Card className="mx-auto mt-10 max-w-md p-6">
        <p className="text-sm text-muted">Musterpass team only</p>
        <h1 className="mt-1 font-display text-2xl font-bold">Unlock the command center</h1>
        <form className="mt-5 space-y-3" onSubmit={unlock}>
          <label htmlFor="command-gate-key" className="block text-sm font-medium">
            Command key
          </label>
          <input
            id="command-gate-key"
            type="password"
            autoComplete="current-password"
            autoFocus
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            className="w-full rounded-2xl border border-line bg-raised px-4 py-3 text-base text-fg outline-none focus:border-fg"
          />
          {error && (
            <p role="alert" className="text-sm text-alert">
              {error}
            </p>
          )}
          <Button type="submit" variant="ink" size="lg" disabled={busy}>
            {busy ? "Checking…" : "Unlock"}
          </Button>
        </form>
        <p className="mt-4 text-xs text-muted">Kept only in this tab until you close it or lock again.</p>
      </Card>
    );

  return (
    <Unlocked
      onLock={() => {
        forgetKey();
        setGate("locked");
      }}
    />
  );
}

function forgetKey() {
  try {
    sessionStorage.removeItem(KEY_STORE);
  } catch {}
}

function Unlocked({ onLock }: { onLock: () => void }) {
  const [tab, setTab] = useState<Tab>("versions");
  const tabs: [Tab, string][] = [
    ["versions", "Versions"],
    ["bot", "Tester bot"],
    ["companies", "Companies"],
  ];
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-sm text-muted">Musterpass team only</p>
          <h1 className="font-display text-3xl font-bold tracking-tight">Command center</h1>
        </div>
        <Button variant="outline" size="sm" onClick={onLock}>
          Lock
        </Button>
      </div>
      <div role="tablist" aria-label="Command center sections" className="inline-flex rounded-full border border-line p-1">
        {tabs.map(([id, label]) => (
          <button
            key={id}
            role="tab"
            id={`tab-${id}`}
            aria-selected={tab === id}
            aria-controls={`panel-${id}`}
            onClick={() => setTab(id)}
            className={`rounded-full px-4 py-1.5 text-sm font-semibold transition ${tab === id ? "bg-fg text-bg" : "text-muted hover:text-fg"}`}
          >
            {label}
          </button>
        ))}
      </div>
      <div role="tabpanel" id={`panel-${tab}`} aria-labelledby={`tab-${tab}`}>
        {tab === "versions" && <Versions />}
        {tab === "bot" && <TesterBot />}
        {tab === "companies" && <Companies />}
      </div>
    </div>
  );
}

// ---------------- Versions and rollback ----------------

function readKey() {
  try {
    return sessionStorage.getItem(KEY_STORE) ?? "";
  } catch {
    return "";
  }
}

function ago(ms: number) {
  const s = Math.round((Date.now() - ms) / 1000);
  if (s < 60) return "just now";
  const m = Math.round(s / 60);
  if (m < 60) return `${m} min ago`;
  const h = Math.round(m / 60);
  if (h < 48) return `${h} h ago`;
  return new Date(ms).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

const short = (sha: string | null) => (sha ? sha.slice(0, 7) : "—");
const firstLine = (m: string | null) => (m ? m.split("\n")[0] : "No commit message");

function Versions() {
  const [key, setKey] = useState("");
  const [draftKey, setDraftKey] = useState("");
  const [data, setData] = useState<VersionsResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [missing, setMissing] = useState<string[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [confirming, setConfirming] = useState<Version | null>(null);
  const [reason, setReason] = useState("");
  const [acting, setActing] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  // eslint-disable-next-line react-hooks/set-state-in-effect -- read the remembered key once, after hydration
  useEffect(() => setKey(readKey()), []);

  const load = useCallback(
    async (k = key) => {
      if (!k) return;
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/command/versions", { headers: { "x-command-key": k }, cache: "no-store" });
        const body = await res.json();
        if (res.status === 401) {
          try {
            sessionStorage.removeItem(KEY_STORE);
          } catch {}
          setKey("");
          setError(body.error ?? "Wrong command key.");
          return;
        }
        if (res.status === 503) {
          setMissing(body.missing ?? []);
          return;
        }
        if (!res.ok) throw new Error(body.error ?? `Error ${res.status}`);
        setMissing(null);
        setData(body);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Couldn't load versions.");
      } finally {
        setLoading(false);
      }
    },
    [key],
  );

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetch when the key becomes known
    if (key) void load(key);
  }, [key, load]);

  // While Vercel is still switching versions, check again every few seconds.
  useEffect(() => {
    if (!data?.busy) return;
    const t = setTimeout(() => void load(), 3000);
    return () => clearTimeout(t);
  }, [data, load]);

  async function act(path: "rollback" | "promote", deploymentId: string, extra: Record<string, string> = {}) {
    setActing(true);
    setError(null);
    try {
      const res = await fetch(`/api/command/${path}`, {
        method: "POST",
        headers: { "content-type": "application/json", "x-command-key": key },
        body: JSON.stringify({ deploymentId, ...extra }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error ?? `Error ${res.status}`);
      setNotice(path === "rollback" ? "Rolling back. Everyone will see that version within a minute." : "Making it live. Automatic releases are back on.");
      setConfirming(null);
      setReason("");
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "That didn't work.");
    } finally {
      setActing(false);
    }
  }

  if (missing) return <SetupNeeded missing={missing} onRetry={() => load()} />;

  if (!key)
    return (
      <Card className="max-w-lg p-6">
        <h2 className="font-display text-xl font-bold">Unlock versions</h2>
        <p className="mt-1 text-sm text-muted">Enter the command key to see every version of the site and roll back.</p>
        <form
          className="mt-4 flex flex-wrap gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            const k = draftKey.trim();
            if (!k) return;
            try {
              sessionStorage.setItem(KEY_STORE, k);
            } catch {}
            setDraftKey("");
            setKey(k);
          }}
        >
          <label htmlFor="command-key" className="sr-only">
            Command key
          </label>
          <input
            id="command-key"
            type="password"
            autoComplete="current-password"
            value={draftKey}
            onChange={(e) => setDraftKey(e.target.value)}
            placeholder="Command key"
            className="min-w-0 flex-1 rounded-2xl border border-line bg-raised px-4 py-3 text-base text-fg outline-none placeholder:text-muted focus:border-fg"
          />
          <Button type="submit" variant="ink">
            Unlock
          </Button>
        </form>
        {error && (
          <p role="alert" className="mt-3 text-sm text-alert">
            {error}
          </p>
        )}
        <p className="mt-4 text-xs text-muted">Kept only in this tab until you close it.</p>
      </Card>
    );

  const live = data?.versions.find((v) => v.live) ?? null;
  const newest = data?.versions.find((v) => v.state === "READY") ?? null;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted">
          {data?.serving ? `This page is running ${short(data.serving)}. ` : ""}
          Production versions, newest first.
        </p>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => load()} disabled={loading}>
            {loading ? "Refreshing…" : "Refresh"}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              try {
                sessionStorage.removeItem(KEY_STORE);
              } catch {}
              setKey("");
              setData(null);
            }}
          >
            Lock
          </Button>
        </div>
      </div>

      {notice && (
        <p role="status" className="rounded-2xl border border-line bg-surface px-4 py-3 text-sm">
          {notice}
        </p>
      )}
      {error && (
        <p role="alert" className="rounded-2xl border border-pop px-4 py-3 text-sm">
          {error}
        </p>
      )}
      {data?.busy && (
        <p role="status" className="rounded-2xl border border-line bg-surface px-4 py-3 text-sm">
          Vercel is switching versions now. This updates on its own.
        </p>
      )}

      {data?.rolledBack && (
        <Card className="border-pop p-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="font-display text-lg font-bold">The live site is rolled back</p>
              <p className="mt-1 text-sm text-muted">
                Everyone sees an older version{data.rolledBack.reason ? ` (“${data.rolledBack.reason}”)` : ""}. New pushes still build, but
                they don&apos;t go live until you undo the rollback.
              </p>
            </div>
            {newest && !newest.live && (
              <Button variant="ink" size="sm" disabled={acting} onClick={() => act("promote", newest.id)}>
                {acting ? "Working…" : `Undo: make ${short(newest.commit.sha)} live`}
              </Button>
            )}
          </div>
        </Card>
      )}

      {!data && loading && <div className="h-48 animate-pulse rounded-3xl bg-line/60" />}

      {data && (
        <Card className="divide-y divide-line">
          {data.versions.length === 0 && <p className="p-5 text-sm text-muted">No production versions yet.</p>}
          {data.versions.map((v) => (
            <div key={v.id} className="p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    {v.live && <Pill tone="volt">Live</Pill>}
                    {v.state !== "READY" && <Pill tone={v.state === "ERROR" ? "pop" : "outline"}>{v.state.toLowerCase()}</Pill>}
                    <span className="font-mono text-xs text-muted">{short(v.commit.sha)}</span>
                    <span className="text-xs text-muted">
                      {ago(v.createdAt)}
                      {v.by ? ` · ${v.by}` : ""}
                    </span>
                  </div>
                  <p className="mt-1 break-words font-medium">{firstLine(v.commit.message)}</p>
                </div>
                <div className="flex shrink-0 gap-2">
                  {v.url && (
                    <a href={v.url} target="_blank" rel="noreferrer" className="rounded-full border border-line px-3.5 py-1.5 text-sm font-bold hover:border-fg">
                      Open
                    </a>
                  )}
                  {v.canRollBack && live && v.createdAt < live.createdAt && (
                    <Button variant="outline" size="sm" onClick={() => setConfirming(v)}>
                      Roll back to this
                    </Button>
                  )}
                  {v.canRollBack && live && v.createdAt > live.createdAt && (
                    <Button variant="outline" size="sm" disabled={acting} onClick={() => act("promote", v.id)}>
                      Make live
                    </Button>
                  )}
                </div>
              </div>

              {confirming?.id === v.id && (
                <div className="mt-4 rounded-2xl border border-pop p-4">
                  <p className="font-display font-bold">Roll back the live site for everyone?</p>
                  <p className="mt-1 text-sm text-muted">
                    Every company and worker will see version {short(v.commit.sha)} from {ago(v.createdAt)} within a minute. New pushes
                    won&apos;t go live until you undo it here.
                  </p>
                  <label htmlFor="rollback-reason" className="mt-3 block text-sm font-medium">
                    Reason (optional)
                  </label>
                  <input
                    id="rollback-reason"
                    value={reason}
                    maxLength={200}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Clock-in button broken on iPhone"
                    className="mt-1 w-full rounded-2xl border border-line bg-raised px-4 py-2.5 text-base text-fg outline-none placeholder:text-muted focus:border-fg"
                  />
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Button variant="danger" size="sm" disabled={acting} onClick={() => act("rollback", v.id, { reason })}>
                      {acting ? "Rolling back…" : "Roll back for everyone"}
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => setConfirming(null)}>
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </Card>
      )}
      <p className="text-xs text-muted">
        On Vercel&apos;s Hobby plan you can only roll back to the version just before the live one. Pro can roll back to any earlier live
        version.
      </p>
    </div>
  );
}

function SetupNeeded({ missing, onRetry }: { missing: string[]; onRetry: () => void }) {
  return (
    <Card className="max-w-2xl p-6">
      <h2 className="font-display text-xl font-bold">Connect the command center to Vercel</h2>
      <p className="mt-1 text-sm text-muted">Add these in Vercel → your project → Settings → Environment Variables, then redeploy.</p>
      <ul className="mt-4 space-y-3 text-sm">
        {[
          ["COMMAND_KEY", "A long secret phrase only the Musterpass team knows. It unlocks this page."],
          ["VERCEL_TOKEN", "Vercel → Account Settings → Tokens → Create. Scope it to this project's team."],
          ["VERCEL_PROJECT_ID", "Project → Settings → General → Project ID."],
          ["VERCEL_TEAM_ID", "Only if the project is under a Vercel team (Team Settings → General)."],
        ].map(([k, how]) => (
          <li key={k} className="flex gap-3">
            <span className={`mt-0.5 inline-flex size-5 shrink-0 items-center justify-center rounded-full text-xs font-bold ${missing.includes(k) ? "bg-pop text-white" : "bg-line text-fg"}`}>
              {missing.includes(k) ? "!" : "✓"}
            </span>
            <span>
              <code className="font-mono font-semibold">{k}</code>
              <span className="block text-muted">{how}</span>
            </span>
          </li>
        ))}
      </ul>
      <Button className="mt-5" variant="outline" size="sm" onClick={onRetry}>
        Check again
      </Button>
    </Card>
  );
}

// ---------------- Tester bot ----------------

const BOT_LAST = "musterpass.bot.lastRun";

function TesterBot() {
  const frame = useRef<HTMLIFrameElement>(null);
  const [checks, setChecks] = useState<Check[]>(() => CHECKS.map((c) => ({ ...c, status: "waiting", detail: "", ms: null })));
  const [log, setLog] = useState<string[]>([]);
  const [running, setRunning] = useState(false);
  const [last, setLast] = useState<{ at: number; passed: number; total: number } | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(BOT_LAST);
      // eslint-disable-next-line react-hooks/set-state-in-effect -- per-viewer convenience, read after hydration
      if (raw) setLast(JSON.parse(raw));
    } catch {}
  }, []);

  async function run() {
    if (!frame.current) return;
    setRunning(true);
    setLog([]);
    setChecks(CHECKS.map((c) => ({ ...c, status: "waiting", detail: "", ms: null })));
    const results = await runTesterBot(
      frame.current,
      (c) => setChecks((cs) => cs.map((x) => (x.id === c.id ? c : x))),
      (line) => setLog((l) => [...l.slice(-200), line]),
    );
    const summary = { at: Date.now(), passed: results.filter((r) => r.status === "passed").length, total: results.length };
    setLast(summary);
    try {
      localStorage.setItem(BOT_LAST, JSON.stringify(summary));
    } catch {}
    setRunning(false);
  }

  const failed = checks.filter((c) => c.status === "failed").length;
  const done = checks.every((c) => c.status === "passed" || c.status === "failed");

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_auto]">
      <div className="space-y-4">
        <Card className="p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h2 className="font-display text-xl font-bold">Tester bot</h2>
              <p className="mt-1 max-w-xl text-sm text-muted">
                Uses the site like a real person: opens every page, clocks a worker in and out, and checks the dashboard and records.
                It runs on the demo company in this browser, then puts your data back. Nothing is sent anywhere.
              </p>
              {last && !running && (
                <p className="mt-2 text-xs text-muted">
                  Last run {ago(last.at)}: {last.passed} of {last.total} passed
                </p>
              )}
            </div>
            <Button variant="volt" onClick={run} disabled={running}>
              {running ? "Running…" : "Run all checks"}
            </Button>
          </div>
        </Card>

        {done && !running && (
          <p role="status" className={`rounded-2xl border px-4 py-3 text-sm font-medium ${failed ? "border-pop" : "border-line bg-surface"}`}>
            {failed ? `${failed} check${failed > 1 ? "s" : ""} failed. Details below.` : "Everything passed."}
          </p>
        )}

        <Card className="divide-y divide-line">
          {checks.map((c) => (
            <div key={c.id} className="flex items-start gap-3 p-4">
              <StatusIcon status={c.status} />
              <div className="min-w-0 flex-1">
                <p className="font-medium">{c.title}</p>
                {c.detail && <p className={`mt-0.5 text-sm ${c.status === "failed" ? "text-alert" : "text-muted"}`}>{c.detail}</p>}
              </div>
              {c.ms !== null && <span className="shrink-0 font-mono text-xs text-muted">{(c.ms / 1000).toFixed(1)} s</span>}
            </div>
          ))}
        </Card>

        <details className="rounded-3xl border border-line bg-surface p-4" open={running}>
          <summary className="cursor-pointer text-sm font-semibold">What the bot did ({log.length} steps)</summary>
          <ol className="mt-3 max-h-72 space-y-1 overflow-y-auto font-mono text-xs text-muted" aria-live="off">
            {log.map((l, i) => (
              <li key={i}>{l}</li>
            ))}
          </ol>
        </details>
      </div>

      <figure className="mx-auto lg:mx-0">
        <div className="h-[540px] w-[270px] overflow-hidden rounded-[2.25rem] border-[7px] border-graphite bg-bg">
          {/* The bot drives this frame. Scaled down from a 375×750 phone screen. */}
          <iframe
            ref={frame}
            title="Tester bot screen"
            src="about:blank"
            tabIndex={-1}
            className="pointer-events-none h-[750px] w-[375px] origin-top-left scale-[0.72] border-0"
          />
        </div>
        <figcaption className="mt-2 text-center text-xs text-muted">{running ? "Watch the bot work" : "The bot's screen"}</figcaption>
      </figure>
    </div>
  );
}

function StatusIcon({ status }: { status: Check["status"] }) {
  const base = "mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-bold";
  if (status === "passed") return <span className={`${base} bg-volt text-ink`} aria-label="Passed">✓</span>;
  if (status === "failed") return <span className={`${base} bg-pop text-white`} aria-label="Failed">✕</span>;
  if (status === "running") return <span className={`${base} animate-pulse border-2 border-fg`} aria-label="Running" />;
  return <span className={`${base} border-2 border-line`} aria-label="Waiting" />;
}

// ---------------- Companies ----------------

function Companies() {
  const [list, setList] = useState<(CompaniesResponse & { at: number }) | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [needsKey, setNeedsKey] = useState(false);

  useEffect(() => {
    const k = readKey();
    if (!k) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- nothing to fetch without the key
      setNeedsKey(true);
      return;
    }
    fetch("/api/command/companies", { headers: { "x-command-key": k }, cache: "no-store" })
      .then(async (res) => {
        const body = await res.json();
        if (res.status === 401 || res.status === 503) return setNeedsKey(true);
        if (!res.ok) throw new Error(body.error ?? `Error ${res.status}`);
        setList({ ...body, at: Date.now() });
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Couldn't load companies."));
  }, []);

  if (needsKey)
    return (
      <div className="space-y-4">
        <Card className="p-5 text-sm text-muted">Unlock with the command key on the Versions tab, then come back here to see every company.</Card>
        <ThisBrowser />
      </div>
    );
  if (error) return <Card className="p-5 text-sm text-alert">{error}</Card>;
  if (!list) return <div className="h-32 animate-pulse rounded-3xl bg-line/60" />;
  if (!list.connected)
    return (
      <div className="space-y-4">
        <p className="max-w-2xl text-sm text-muted">
          Supabase isn&apos;t connected on the server yet, so each browser holds one company. Add the Supabase environment variables (see
          the README) to list every company here.
        </p>
        <ThisBrowser />
      </div>
    );

  const onSite = list.companies.reduce((n, c) => n + c.onSite, 0);
  return (
    <div className="space-y-4">
      <p className="text-sm text-muted">
        {list.companies.length} compan{list.companies.length === 1 ? "y" : "ies"} · {onSite} people clocked in right now
      </p>
      {list.companies.length === 0 && <Card className="p-5 text-sm text-muted">No companies have signed up yet.</Card>}
      <ul className="grid gap-3 md:grid-cols-2">
        {list.companies.map((c) => {
          const trialLeft = Math.ceil((new Date(c.trialEndsAt).getTime() - list.at) / 86_400_000);
          return (
            <li key={c.id}>
              <Card className="p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate font-display text-lg font-bold">{c.name}</p>
                    <p className="truncate text-sm text-muted">{c.ownerEmail || "No owner email"}</p>
                  </div>
                  <Pill tone={c.plan === "trial" && trialLeft <= 0 ? "pop" : "outline"}>
                    {c.plan === "trial" ? (trialLeft > 0 ? `Trial · ${trialLeft} d left` : "Trial ended") : c.plan}
                  </Pill>
                </div>
                <dl className="mt-4 grid grid-cols-4 gap-2 text-center">
                  {(
                    [
                      ["Sites", c.sites],
                      ["People", c.people],
                      ["Clock-ins", c.checkIns],
                      ["On site", c.onSite],
                    ] as const
                  ).map(([k, v]) => (
                    <div key={k} className="rounded-2xl bg-bg p-2.5">
                      <dt className="text-xs text-muted">{k}</dt>
                      <dd className="font-display text-xl font-bold">{v}</dd>
                    </div>
                  ))}
                </dl>
                <p className="mt-3 text-xs text-muted">
                  Joined {new Date(c.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })} · last
                  clock-in {c.lastCheckIn ? ago(new Date(c.lastCheckIn).getTime()) : "never"}
                </p>
              </Card>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/** The company saved in this browser (the only one there is without Supabase). */
function ThisBrowser() {
  const s = useStore();
  if (s === null) return <div className="h-32 animate-pulse rounded-3xl bg-line/60" />;
  const c = s.company;
  if (!c) return <Card className="p-5 text-sm text-muted">No company saved in this browser.</Card>;
  return (
    <Card className="p-5">
      <p className="text-xs font-semibold uppercase tracking-wider text-muted">In this browser</p>
      <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="font-display text-lg font-bold">{c.name}</p>
          <p className="text-sm text-muted">{c.demo ? "Demo company" : `Owner: ${c.ownerName}`}</p>
        </div>
        <Pill tone="outline">{c.plan}</Pill>
      </div>
      <dl className="mt-4 grid grid-cols-3 gap-3 text-center">
        {(
          [
            ["Sites", s.sites.length],
            ["People", s.people.length],
            ["Clock-ins", s.checkIns.length],
          ] as const
        ).map(([k, v]) => (
          <div key={k} className="rounded-2xl bg-bg p-3">
            <dt className="text-xs text-muted">{k}</dt>
            <dd className="font-display text-2xl font-bold">{v}</dd>
          </div>
        ))}
      </dl>
    </Card>
  );
}
