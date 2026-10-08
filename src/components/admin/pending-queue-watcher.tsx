"use client";

import { useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { useRouter } from "@/i18n/navigation";

const POLL_MS = 12_000;

export function PendingQueueWatcher() {
  const t = useTranslations("Admin");
  const router = useRouter();
  const routerRef = useRef(router);
  const previous = useRef<number | null>(null);
  const initialized = useRef(false);
  const tRef = useRef(t);

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
        const res = await fetch("/api/admin/pending-count", {
          cache: "no-store",
        });
        if (!res.ok || cancelled) return;
        const data = (await res.json()) as { count?: number };
        const count = Number(data.count ?? 0);

        if (initialized.current && previous.current != null) {
          if (count > previous.current) {
            const added = count - previous.current;
            toast.info(
              added === 1
                ? tRef.current("newInvoicePending")
                : tRef.current("newInvoicesPending", { count: added }),
            );
            routerRef.current.refresh();
          } else if (count < previous.current) {
            routerRef.current.refresh();
          }
        }

        previous.current = count;
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
