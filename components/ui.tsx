import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode } from "react";

// Shared building blocks. Colours use the theme roles (bg, surface, raised, fg, muted, line, alert)
// so everything follows light and dark mode. Volt and pop stay fixed: text on volt is ink, text on pop (alert red) is white.

type Variant = "volt" | "ink" | "outline" | "outline-dark" | "ghost" | "danger";

const variants: Record<Variant, string> = {
  volt: "bg-volt text-ink hover:brightness-95",
  ink: "bg-fg text-bg hover:opacity-90",
  outline: "border border-line text-fg hover:border-fg",
  "outline-dark": "border border-line text-fg hover:border-fg",
  ghost: "text-muted hover:text-fg",
  danger: "bg-pop text-white hover:brightness-90",
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
  // `dark` is kept so existing callers compile; fields now follow the theme everywhere.
  dark: _dark = false,
  className = "",
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { label: string; hint?: string; error?: string | null; dark?: boolean }) {
  void _dark;
  const id = props.id ?? props.name ?? label.toLowerCase().replace(/\W+/g, "-");
  return (
    <div className={className}>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-fg">
        {label}
      </label>
      <input
        id={id}
        aria-invalid={!!error}
        aria-describedby={error ? `${id}-error` : undefined}
        className="w-full rounded-2xl border border-line bg-raised px-4 py-3.5 text-base text-fg outline-none placeholder:text-muted focus:border-fg"
        {...props}
      />
      {hint && !error && <p className="mt-1.5 text-xs text-muted">{hint}</p>}
      {error && (
        <p id={`${id}-error`} role="alert" className="mt-1.5 text-sm text-alert">
          {error}
        </p>
      )}
    </div>
  );
}

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`rounded-3xl border border-line bg-surface ${className}`}>{children}</div>;
}

export function Pill({ tone = "neutral", children }: { tone?: "neutral" | "ink" | "pop" | "volt" | "outline"; children: ReactNode }) {
  const tones = {
    neutral: "bg-line/70 text-fg/85",
    ink: "bg-fg text-bg",
    pop: "bg-pop text-white",
    volt: "bg-volt text-ink",
    outline: "border border-line text-fg/85",
  };
  return <span className={`inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-semibold ${tones[tone]}`}>{children}</span>;
}

export function PageHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: ReactNode }) {
  return (
    <div className="no-print flex flex-wrap items-end justify-between gap-4">
      <div>
        {subtitle && <p className="text-sm text-muted">{subtitle}</p>}
        <h1 className="font-display text-3xl font-bold tracking-tight">{title}</h1>
      </div>
      {action}
    </div>
  );
}

/** Large tappable option for gloved hands (56px+ targets). Selected = inverted colours. */
export function Choice({
  selected,
  onClick,
  children,
}: {
  selected: boolean;
  onClick: () => void;
  children: ReactNode;
  /** Ignored: kept so existing callers compile. Choices follow the theme. */
  dark?: boolean;
}) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onClick}
      className={`flex min-h-14 w-full items-center gap-3 rounded-2xl border px-4 py-3 text-left font-medium transition ${
        selected ? "border-fg bg-fg text-bg" : "border-line bg-raised text-fg"
      }`}
    >
      <span
        aria-hidden
        className={`flex size-5 shrink-0 items-center justify-center rounded-md border-2 ${
          selected ? "border-bg bg-bg text-fg" : "border-current opacity-60"
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
