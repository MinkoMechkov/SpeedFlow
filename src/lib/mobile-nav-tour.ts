/** Bridge so the onboarding tour can open/close the mobile sheet. */

export const MOBILE_NAV_TOUR_EVENT = "spendflow:mobile-nav";

export function setMobileNavOpen(open: boolean) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent(MOBILE_NAV_TOUR_EVENT, { detail: { open } }),
  );
}

export function waitForSelector(
  selector: string,
  timeoutMs = 1500,
): Promise<Element | null> {
  return new Promise((resolve) => {
    const existing = document.querySelector(selector);
    if (existing) {
      resolve(existing);
      return;
    }
    const started = Date.now();
    const timer = window.setInterval(() => {
      const el = document.querySelector(selector);
      if (el) {
        window.clearInterval(timer);
        resolve(el);
        return;
      }
      if (Date.now() - started > timeoutMs) {
        window.clearInterval(timer);
        resolve(null);
      }
    }, 40);
  });
}

export function waitForSelectorGone(
  selector: string,
  timeoutMs = 1000,
): Promise<void> {
  return new Promise((resolve) => {
    const started = Date.now();
    const check = () => {
      if (!document.querySelector(selector) || Date.now() - started > timeoutMs) {
        resolve();
        return;
      }
      window.requestAnimationFrame(check);
    };
    check();
  });
}

/**
 * Resolve once the element's box stops moving (e.g. the sheet's slide-in
 * transition has finished), so the tour measures its final position.
 */
export function waitForStableRect(
  el: Element,
  timeoutMs = 800,
): Promise<void> {
  return new Promise((resolve) => {
    const started = Date.now();
    let last = el.getBoundingClientRect();
    let stableFrames = 0;
    const tick = () => {
      const rect = el.getBoundingClientRect();
      const same =
        rect.x === last.x &&
        rect.y === last.y &&
        rect.width === last.width &&
        rect.height === last.height;
      stableFrames = same ? stableFrames + 1 : 0;
      last = rect;
      if (stableFrames >= 3 || Date.now() - started > timeoutMs) {
        resolve();
        return;
      }
      window.requestAnimationFrame(tick);
    };
    window.requestAnimationFrame(tick);
  });
}
