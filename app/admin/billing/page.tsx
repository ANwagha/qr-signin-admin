"use client";

import { useRouter } from "next/navigation";
import { Button, Card, PageHeader, Pill } from "@/components/ui";
import { resetDemo, setPlan, useStore, type Plan } from "@/lib/store";
import { useNow } from "@/lib/time";

const PLANS: { id: Exclude<Plan, "trial">; name: string; price: string; sites: string; features: string[] }[] = [
  {
    id: "crew",
    name: "Crew",
    price: "$149",
    sites: "1 active site",
    features: ["Unlimited workers, subs and visitors", "FLHA and visitor forms", "Photo evidence", "Live roster and muster list"],
  },
  {
    id: "company",
    name: "Company",
    price: "$399",
    sites: "Up to 10 active sites",
    features: ["Everything in Crew", "Form customization", "Supervisor countersign", "Exports and time records"],
  },
  {
    id: "enterprise",
    name: "Enterprise",
    price: "Custom",
    sites: "Unlimited sites",
    features: ["Everything in Company", "Single sign-on", "Longer retention", "API access and onboarding"],
  },
];

export default function BillingPage() {
  const s = useStore();
  const now = useNow();
  const router = useRouter();
  if (!s || !s.company || now === null) return null;
  const c = s.company;
  const daysLeft = Math.max(0, Math.ceil((new Date(c.trialEndsAt).getTime() - now) / 86_400_000));
  const current = PLANS.find((p) => p.id === c.plan);

  return (
    <div className="space-y-6">
      <PageHeader title="Billing" subtitle={`${c.name} · one price per company, never per worker`} />

      <div className="rounded-3xl bg-ink p-6 text-bone">
        <p className="text-sm text-smoke">Current plan</p>
        <p className="mt-2 font-display text-3xl font-bold">{current ? current.name : "Free trial"}</p>
        <p className="mt-1 text-smoke">
          {current
            ? `${current.price === "Custom" ? "Custom pricing" : `${current.price} CAD per month`} · ${current.sites}`
            : `${daysLeft} days left · all features included · ${s.sites.length} site${s.sites.length === 1 ? "" : "s"} set up`}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {PLANS.map((p) => {
          const active = c.plan === p.id;
          return (
            <Card key={p.id} className={`flex flex-col p-6 ${active ? "border-ink! border-2" : ""}`}>
              <div className="flex items-start justify-between">
                <h2 className="font-display text-xl font-bold">{p.name}</h2>
                {active && <Pill tone="ink">Current</Pill>}
              </div>
              <p className="mt-3 font-display text-4xl font-bold">
                {p.price}
                {p.price !== "Custom" && <span className="text-base font-semibold text-graphite/70"> CAD / month</span>}
              </p>
              <p className="mt-1 text-sm font-medium">{p.sites}</p>
              <ul className="mt-4 flex-1 space-y-1.5 text-sm text-graphite">
                {p.features.map((f) => (
                  <li key={f} className="flex gap-2">
                    <span aria-hidden className="mt-1.5 size-1.5 shrink-0 rounded-full bg-ink" />
                    {f}
                  </li>
                ))}
              </ul>
              <div className="mt-5">
                {p.id === "enterprise" ? (
                  <Button variant="outline" className="w-full" onClick={() => window.alert("Prototype: this would open a contact form.")}>
                    Talk to us
                  </Button>
                ) : (
                  <Button variant={active ? "outline" : "ink"} className="w-full" disabled={active} onClick={() => setPlan(p.id)}>
                    {active ? "Your plan" : `Choose ${p.name}`}
                  </Button>
                )}
              </div>
            </Card>
          );
        })}
      </div>
      <p className="text-sm text-graphite/70">Prices are placeholders to test with pilot customers. Annual billing gets a discount.</p>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="p-6">
          <h2 className="font-display text-lg font-semibold">Payment method</h2>
          <p className="mt-1 text-sm text-graphite/70">
            Card details are handled by Stripe, never stored by Musterpass. Connected in the billing step of the roadmap.
          </p>
          <Button className="mt-4" variant="outline" disabled>
            Add card (coming with Stripe)
          </Button>
        </Card>
        <Card className="p-6">
          <h2 className="font-display text-lg font-semibold">Invoices</h2>
          <p className="mt-1 text-sm text-graphite/70">No invoices yet. They appear here once your trial ends.</p>
          <p className="mt-4 text-sm">
            Billing contact: <strong>{c.ownerName}</strong> · {c.ownerEmail}
          </p>
        </Card>
      </div>

      <Card className="p-6">
        <h2 className="font-display text-lg font-semibold">Prototype data</h2>
        <p className="mt-1 text-sm text-graphite/70">
          Everything here is stored in this browser only{c.demo ? ", using the Northshore Builders demo" : ""}. Resetting clears the company, people,
          check-ins and photos.
        </p>
        <Button
          className="mt-4"
          variant="danger"
          onClick={() => {
            if (window.confirm("Delete all prototype data in this browser?")) {
              resetDemo();
              router.push("/");
            }
          }}
        >
          Reset demo
        </Button>
      </Card>
    </div>
  );
}
