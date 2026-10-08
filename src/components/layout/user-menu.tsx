"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { ChevronDown, LogOut } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useRouter } from "@/i18n/navigation";

export function UserMenu({
  name,
  roleLabel,
}: {
  name: string;
  roleLabel: string;
}) {
  const t = useTranslations("Common");
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function signOut() {
    if (loading) return;
    setLoading(true);
    await fetch("/api/auth/demo", { method: "DELETE" });
    try {
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();
      await supabase.auth.signOut();
    } catch {
      // Demo mode or missing Supabase env — ignore.
    }
    router.push("/login");
    router.refresh();
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        openOnHover
        delay={80}
        closeDelay={120}
        className="group flex cursor-pointer items-center gap-1.5 rounded-lg px-2 py-1.5 text-left outline-none transition-colors hover:bg-muted/60 focus-visible:ring-2 focus-visible:ring-ring/40 data-popup-open:bg-muted/60"
      >
        <span className="min-w-0">
          <span className="block max-w-[7rem] truncate text-sm font-medium sm:max-w-[12rem]">
            {name}
          </span>
          <span className="hidden text-xs text-muted-foreground sm:block">
            {roleLabel}
          </span>
        </span>
        <ChevronDown className="size-3.5 shrink-0 text-muted-foreground transition-transform group-data-popup-open:rotate-180" />
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        sideOffset={6}
        className="w-auto min-w-40"
      >
        <DropdownMenuItem
          variant="destructive"
          disabled={loading}
          onClick={() => void signOut()}
        >
          <LogOut className="size-4" />
          {loading ? t("loading") : t("signOut")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
