"use client";

import { ExternalLink, Eye } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { buttonVariants } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

export function TableIconLink({
  href,
  label,
  icon = "eye",
}: {
  href: string;
  label: string;
  icon?: "eye" | "external";
}) {
  const Icon = icon === "external" ? ExternalLink : Eye;

  return (
    <Tooltip>
      <TooltipTrigger
        delay={200}
        render={
          <Link
            href={href}
            aria-label={label}
            className={cn(
              buttonVariants({ variant: "ghost", size: "icon-sm" }),
              "text-[var(--brand-deep)] hover:bg-[color-mix(in_oklab,var(--brand)_18%,transparent)] hover:text-[var(--brand-deep)]",
            )}
          />
        }
      >
        <Icon className="size-3.5" />
      </TooltipTrigger>
      <TooltipContent side="top">{label}</TooltipContent>
    </Tooltip>
  );
}
