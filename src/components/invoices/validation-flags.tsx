import { describeFlags, type FlagTone } from "@/lib/invoices/flags";
import { cn } from "@/lib/utils";

const TONE_STYLES: Record<
  FlagTone,
  { wrap: string; badge: string; label: string }
> = {
  danger: {
    wrap: "border-[color-mix(in_oklab,var(--destructive)_35%,transparent)] bg-[color-mix(in_oklab,var(--destructive)_8%,white)]",
    badge: "bg-destructive/15 text-destructive",
    label: "text-destructive",
  },
  warning: {
    wrap: "border-[color-mix(in_oklab,#c4a35a_40%,transparent)] bg-[color-mix(in_oklab,#c4a35a_10%,white)]",
    badge: "bg-[color-mix(in_oklab,#c4a35a_22%,white)] text-[#6b5320]",
    label: "text-[#6b5320]",
  },
  info: {
    wrap: "border-[color-mix(in_oklab,var(--brand)_45%,transparent)] bg-[color-mix(in_oklab,var(--brand)_12%,white)]",
    badge: "bg-[color-mix(in_oklab,var(--brand)_28%,white)] text-[var(--ink)]",
    label: "text-foreground",
  },
};

export function ValidationFlags({
  flags,
  className,
}: {
  flags: string[];
  className?: string;
}) {
  if (flags.length === 0) return null;

  const items = describeFlags(flags);

  return (
    <section className={cn("space-y-3", className)}>
      <div className="flex items-baseline justify-between gap-3">
        <h3 className="text-sm font-medium">Review notes</h3>
        <p className="text-xs text-muted-foreground">
          {items.length} flag{items.length === 1 ? "" : "s"}
        </p>
      </div>
      <ul className="space-y-2">
        {items.map((flag) => {
          const tone = TONE_STYLES[flag.tone];
          return (
            <li
              key={flag.code}
              className={cn(
                "rounded-xl border px-3.5 py-3",
                tone.wrap,
              )}
            >
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={cn(
                    "inline-flex rounded-md px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
                    tone.badge,
                  )}
                >
                  {flag.tone}
                </span>
                <p className={cn("text-sm font-medium", tone.label)}>
                  {flag.label}
                </p>
              </div>
              <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                {flag.description}
              </p>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
