type Props = {
  /**
   * "volt" for brand moments on ink (posters); "bone" on the fixed black top bar;
   * "fg" on themed pages, so it follows light and dark mode.
   */
  tone?: "volt" | "bone" | "ink" | "fg";
  className?: string;
};

const toneClass = {
  volt: "text-volt",
  bone: "text-bone",
  ink: "text-ink",
  fg: "text-fg",
} as const;

export default function Wordmark({ tone = "volt", className = "" }: Props) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 font-display text-xl font-bold tracking-tight ${toneClass[tone]} ${className}`}
    >
      <span aria-hidden className="size-3 rounded-full border-[2.5px] border-current" />
      musterpass
    </span>
  );
}
