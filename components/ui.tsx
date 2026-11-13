import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode } from "react";

type Variant = "volt" | "ink" | "outline" | "outline-dark" | "ghost" | "danger";

const variants: Record<Variant, string> = {
  volt: "bg-volt text-ink hover:brightness-95",
  ink: "bg-ink text-bone hover:bg-graphite",
  outline: "border border-line text-ink hover:border-ink",
  "outline-dark": "border border-graphite text-bone hover:border-bone",
  ghost: "text-smoke hover:text-current",
  danger: "bg-pop text-ink hover:brightness-95",
};

export function Button({
  variant = "ink",
  size = "md",
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: "sm" | "md" | "lg" }) {
  const sizes = { sm: "px-3.5 py-1.5 text-sm", md: "px-5 py-2.5 text-sm", lg: "w-full py-4 text-lg" };
  return (
    <button
      className={`rounded-full font-display font-bold transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40 ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    />
  );
}

export function Field({
  label,
  hint,
  error,
  dark = false,
  className = "",
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { label: string; hint?: string; error?: string | null; dark?: boolean }) {
  const id = props.id ?? props.name ?? label.toLowerCase().replace(/\W+/g, "-");
  return (
    <div className={className}>
      <label htmlFor={id} className={`mb-1.5 block text-sm font-medium ${dark ? "text-bone" : "text-ink"}`}>
        {label}
      </label>
      <input
        id={id}
        aria-invalid={!!error}
        aria-describedby={error ? `${id}-error` : undefined}
        className={`w-full rounded-2xl border px-4 py-3.5 text-base outline-none ${
          dark
            ? "border-graphite bg-graphite text-bone placeholder:text-smoke focus:border-bone"
            : "border-line bg-white text-ink focus:border-ink"
        }`}
        {...props}
      />
      {hint && !error && <p className={`mt-1.5 text-xs ${dark ? "text-smoke" : "text-graphite/70"}`}>{hint}</p>}
      {error && (
        <p id={`${id}-error`} role="alert" className={`mt-1.5 text-sm ${dark ? "text-pop" : "text-pop-deep"}`}>
          {error}
        </p>
      )}
    </div>
  );
}

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`rounded-3xl border border-line bg-white/60 ${className}`}>{children}</div>;
}

export function Pill({ tone = "neutral", children }: { tone?: "neutral" | "ink" | "pop" | "volt" | "outline"; children: ReactNode }) {
  const tones = {
    neutral: "bg-line/70 text-graphite",
    ink: "bg-ink text-bone",
    pop: "bg-pop text-ink",
    volt: "bg-volt text-ink",
    outline: "border border-line text-graphite",
  };
  return <span className={`inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-semibold ${tones[tone]}`}>{children}</span>;
}

export function PageHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: ReactNode }) {
  return (
    <div className="no-print flex flex-wrap items-end justify-between gap-4">
      <div>
        {subtitle && <p className="text-sm text-graphite/70">{subtitle}</p>}
        <h1 className="font-display text-3xl font-bold tracking-tight">{title}</h1>
      </div>
      {action}
    </div>
  );
}

/** Large tappable option for gloved hands (56px+ targets). */
export function Choice({
  selected,
  onClick,
  children,
  dark = true,
}: {
  selected: boolean;
  onClick: () => void;
  children: ReactNode;
  dark?: boolean;
}) {
  const base = dark
    ? selected
      ? "border-bone bg-bone text-ink"
      : "border-graphite bg-graphite text-bone"
    : selected
      ? "border-ink bg-ink text-bone"
      : "border-line bg-white text-ink";
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onClick}
      className={`flex min-h-14 w-full items-center gap-3 rounded-2xl border px-4 py-3 text-left font-medium transition ${base}`}
    >
      <span
        aria-hidden
        className={`flex size-5 shrink-0 items-center justify-center rounded-md border-2 ${
          selected ? (dark ? "border-ink bg-ink text-bone" : "border-bone bg-bone text-ink") : "border-current opacity-60"
        }`}
      >
        {selected && (
          <svg viewBox="0 0 16 16" className="size-3.5" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="m3.5 8.5 3 3 6-7" />
          </svg>
        )}
      </span>
      <span>{children}</span>
    </button>
  );
}
