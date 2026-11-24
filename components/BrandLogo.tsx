import type { Brand } from "@/lib/brand";

/**
 * A company's logo on its own tile, so it reads on any background and in either theme.
 * Light tile for dark logos, dark tile for white logos.
 */
export default function BrandLogo({
  brand,
  companyName,
  size = "md",
  className = "",
}: {
  brand: Brand;
  companyName: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  if (!brand.logo) return null;
  const sizes = { sm: "h-8 px-2 py-1 rounded-lg", md: "h-12 px-3 py-1.5 rounded-xl", lg: "h-20 px-4 py-2.5 rounded-2xl" };
  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center ${brand.logoBg === "dark" ? "bg-ink ring-1 ring-graphite" : "bg-white ring-1 ring-black/10"} ${sizes[size]} ${className}`}
    >
      {/* eslint-disable-next-line @next/next/no-img-element -- data URL from the browser, not an optimisable asset */}
      <img src={brand.logo} alt={`${companyName} logo`} className="h-full w-auto max-w-40 object-contain" />
    </span>
  );
}
