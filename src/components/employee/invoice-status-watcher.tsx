"use client";

import { useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { useRouter } from "@/i18n/navigation";
import type { InvoiceStatusItem } from "@/lib/data";

const POLL_MS = 10_000;

function snapshotKey(items: InvoiceStatusItem[]) {
  return items
    .map((i) => `${i.id}:${i.status}`)
    .sort()
    .join("|");
}

export function InvoiceStatusWatcher() {
  const t = useTranslations("Employee");
  const router = useRouter();
  const routerRef = useRef(router);
  const tRef = useRef(t);
  const previous = useRef<Map<string, InvoiceStatusItem> | null>(null);
  const initialized = useRef(false);

  useEffect(() => {
    routerRef.current = router;
    tRef.current = t;
  }, [router, t]);

  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | null = null;
    let inFlight = false;

    async function poll() {
      if (cancelled || inFlight) return;
      if (document.visibilityState === "hidden") {
        schedule();
        return;
      }

      inFlight = true;
      try {
        const res = await fetch("/api/me/invoice-status", {
          cache: "no-store",
        });
        if (!res.ok || cancelled) return;
        const data = (await res.json()) as { items?: InvoiceStatusItem[] };
        const items = data.items ?? [];
        const next = new Map(items.map((i) => [i.id, i]));

        if (initialized.current && previous.current) {
          const prev = previous.current;
          const changed =
            snapshotKey([...prev.values()]) !== snapshotKey(items);

          if (changed) {
            for (const item of items) {
              const before = prev.get(item.id);
              if (
                before &&
                before.status === "pending_review" &&
                item.status === "approved"
              ) {
                toast.success(
                  tRef.current("invoiceApprovedToast", { label: item.label }),
                );
              } else if (
                before &&
                before.status === "pending_review" &&
                item.status === "rejected"
              ) {
                toast.message(
                  tRef.current("invoiceRejectedToast", { label: item.label }),
                );
              }
            }
            routerRef.current.refresh();
          }
        }

        previous.current = next;
        initialized.current = true;
      } catch {
        // Ignore transient network errors; retry on next tick.
      } finally {
        inFlight = false;
        if (!cancelled) schedule();
      }
    }

    function schedule() {
      if (cancelled) return;
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => {
        void poll();
      }, POLL_MS);
    }

    void poll();

    function onVisible() {
      if (document.visibilityState === "visible") {
        if (timer) clearTimeout(timer);
        void poll();
      }
    }
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);

  return null;
}
