"use client";

import { useCallback, useEffect, useMemo, useRef } from "react";
import { useTranslations } from "next-intl";
import type { DriveStep, Driver } from "driver.js";
import { TourProvider } from "@/components/onboarding/tour-context";
import {
  setMobileNavOpen,
  waitForSelector,
  waitForSelectorGone,
  waitForStableRect,
} from "@/lib/mobile-nav-tour";
import { TOUR_VERSION, tourStorageKey } from "@/lib/onboarding";
import type { UserRole } from "@/lib/types";

type Props = {
  role: UserRole;
  show: boolean;
  version?: number;
  employeeId: string;
  children: React.ReactNode;
};

type StepDef = {
  /** Value of data-tour on the target control */
  tourId?: string;
  titleKey: string;
  bodyKey: string;
  /** Nav item — on mobile open the sheet and highlight the in-sheet link */
  navTarget?: boolean;
  /** Only shown below the md breakpoint (e.g. the hamburger button) */
  mobileOnly?: boolean;
};

const MOBILE_MENU_STEP: StepDef = {
  tourId: "mobile-menu",
  titleKey: "mobileMenuTitle",
  bodyKey: "mobileMenuBody",
  mobileOnly: true,
};

const EMPLOYEE_STEPS: StepDef[] = [
  { titleKey: "employeeWelcomeTitle", bodyKey: "employeeWelcomeBody" },
  MOBILE_MENU_STEP,
  {
    tourId: "nav-upload",
    titleKey: "employeeUploadTitle",
    bodyKey: "employeeUploadBody",
    navTarget: true,
  },
  {
    tourId: "nav-invoices",
    titleKey: "employeeInvoicesTitle",
    bodyKey: "employeeInvoicesBody",
    navTarget: true,
  },
  {
    tourId: "nav-reimbursement",
    titleKey: "employeeReimbursementTitle",
    bodyKey: "employeeReimbursementBody",
    navTarget: true,
  },
  {
    tourId: "nav-subscriptions",
    titleKey: "employeeSubscriptionsTitle",
    bodyKey: "employeeSubscriptionsBody",
    navTarget: true,
  },
  {
    tourId: "user-menu",
    titleKey: "employeeUserMenuTitle",
    bodyKey: "employeeUserMenuBody",
  },
];

const ADMIN_STEPS: StepDef[] = [
  { titleKey: "adminWelcomeTitle", bodyKey: "adminWelcomeBody" },
  MOBILE_MENU_STEP,
  {
    tourId: "nav-dashboard",
    titleKey: "adminDashboardTitle",
    bodyKey: "adminDashboardBody",
    navTarget: true,
  },
  {
    tourId: "nav-reviews",
    titleKey: "adminReviewsTitle",
    bodyKey: "adminReviewsBody",
    navTarget: true,
  },
  {
    tourId: "nav-employees",
    titleKey: "adminEmployeesTitle",
    bodyKey: "adminEmployeesBody",
    navTarget: true,
  },
  {
    tourId: "nav-tools",
    titleKey: "adminToolsTitle",
    bodyKey: "adminToolsBody",
    navTarget: true,
  },
  {
    tourId: "nav-report",
    titleKey: "adminReportTitle",
    bodyKey: "adminReportBody",
    navTarget: true,
  },
  {
    tourId: "user-menu",
    titleKey: "adminUserMenuTitle",
    bodyKey: "adminUserMenuBody",
  },
];

function isMobileNav() {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(max-width: 767px)").matches;
}

function selectorForStep(def: StepDef): string | undefined {
  if (!def.tourId) return undefined;
  if (def.navTarget && isMobileNav()) {
    return `[data-mobile-nav] [data-tour="${def.tourId}"]`;
  }
  if (def.navTarget) {
    return `[data-desktop-nav] [data-tour="${def.tourId}"]`;
  }
  return `[data-tour="${def.tourId}"]`;
}

function persistCompletion(version: number, employeeId: string) {
  try {
    localStorage.setItem(tourStorageKey(version, employeeId), "1");
  } catch {
    // private mode / quota — ignore
  }
  void fetch("/api/me/onboarding", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ version }),
  }).catch(() => {
    // Best-effort; localStorage already covers this browser.
  });
}

export function OnboardingTour({
  role,
  show,
  version = TOUR_VERSION,
  employeeId,
  children,
}: Props) {
  const t = useTranslations("Tour");
  const driverRef = useRef<Driver | null>(null);
  const startedRef = useRef(false);

  const stepDefs = useCallback((): StepDef[] => {
    const defs = role === "admin" ? ADMIN_STEPS : EMPLOYEE_STEPS;
    const mobile = isMobileNav();
    return defs.filter((def) => mobile || !def.mobileOnly);
  }, [role]);

  const runTour = useCallback(
    async (force = false) => {
      if (typeof window === "undefined") return;

      const key = tourStorageKey(version, employeeId);
      if (!force) {
        try {
          if (localStorage.getItem(key)) {
            persistCompletion(version, employeeId);
            return;
          }
        } catch {
          // continue
        }
      }

      driverRef.current?.destroy();
      driverRef.current = null;
      setMobileNavOpen(false);

      const { driver } = await import("driver.js");
      await import("driver.js/dist/driver.css");

      const defs = stepDefs();
      const steps: DriveStep[] = defs.map((def) => ({
        // Resolved at highlight time, so the in-sheet link is picked up once
        // the sheet has been opened by goTo().
        element: def.tourId
          ? () => {
              const selector = selectorForStep(def);
              return (selector && document.querySelector(selector)) as Element;
            }
          : undefined,
        popover: {
          title: t(def.titleKey as Parameters<typeof t>[0]),
          description: t(def.bodyKey as Parameters<typeof t>[0]),
        },
      }));

      let navigating = false;

      // Driver measures the target once when a step starts, so on mobile the
      // sheet must be open (or closed) and settled *before* moving to a step.
      const goTo = async (index: number) => {
        const active = driverRef.current;
        if (!active || navigating) return;
        const def = defs[index];
        if (!def) {
          active.destroy();
          return;
        }
        navigating = true;
        try {
          if (isMobileNav()) {
            if (def.navTarget) {
              setMobileNavOpen(true);
              const selector = selectorForStep(def);
              const el = selector ? await waitForSelector(selector) : null;
              if (el) await waitForStableRect(el);
            } else {
              setMobileNavOpen(false);
              await waitForSelectorGone("[data-mobile-nav]");
            }
          }
          if (active.isActive()) active.moveTo(index);
        } finally {
          navigating = false;
        }
      };

      const d = driver({
        showProgress: true,
        animate: true,
        allowClose: true,
        // Missing targets fall back to a centered popover instead of
        // silently skipping (closed-sheet links would otherwise be skipped).
        skipMissingElement: false,
        // Prevent tour clicks from following nav links / toggling the sheet.
        disableActiveInteraction: true,
        overlayOpacity: 0.55,
        stagePadding: 8,
        stageRadius: 12,
        popoverClass: "spendflow-tour-popover",
        nextBtnText: t("next"),
        prevBtnText: t("back"),
        doneBtnText: t("done"),
        progressText: "{{current}} / {{total}}",
        steps,
        onNextClick: (_el, _step, { driver: active }) => {
          void goTo((active.getActiveIndex() ?? -1) + 1);
        },
        onPrevClick: (_el, _step, { driver: active }) => {
          const index = active.getActiveIndex() ?? 0;
          if (index > 0) void goTo(index - 1);
        },
        onDestroyed: () => {
          setMobileNavOpen(false);
          persistCompletion(version, employeeId);
          driverRef.current = null;
        },
      });

      driverRef.current = d;
      d.drive();
    },
    [employeeId, stepDefs, t, version],
  );

  const startTour = useCallback(() => {
    void runTour(true);
  }, [runTour]);

  useEffect(() => {
    if (!show || startedRef.current) return;
    startedRef.current = true;
    const timer = window.setTimeout(() => {
      void runTour(false);
    }, 400);
    return () => {
      window.clearTimeout(timer);
      setMobileNavOpen(false);
      driverRef.current?.destroy();
      driverRef.current = null;
    };
  }, [runTour, show]);

  const value = useMemo(() => ({ startTour }), [startTour]);

  return <TourProvider value={value}>{children}</TourProvider>;
}
