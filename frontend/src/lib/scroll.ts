/**
 * Where the page has actually scrolled to, as the reader sees it.
 *
 * Smoothed scrolling moves the content with a transform, so the scrollbar runs
 * ahead of what is on screen. Anything drawn outside that content — the field,
 * which is fixed — has to follow the lagging value, or it slides against the
 * page by however far the smoothing is behind. Everything reads the position
 * through here so there is one answer to that question.
 */

type Source = () => number;

let source: Source | null = null;

export function setScrollSource(next: Source): void {
  source = next;
}

export function clearScrollSource(): void {
  source = null;
}

export function scrollNow(): number {
  if (source) {
    const value = source();
    if (Number.isFinite(value)) return value;
  }
  return typeof scrollY === "number" ? scrollY : 0;
}

/**
 * How to reach a place on the page, when the page is not what scrolls.
 *
 * ScrollSmoother makes `#smooth-wrapper` the visual viewport — fixed, overflow hidden — and moves
 * the content by transform. A browser asked to jump to `#position` looks for the nearest scrollable
 * ancestor, finds one that cannot scroll, and does nothing; the hash changes and the reader stays
 * exactly where they were. So the smoother has to be asked directly, and the only place that knows
 * it exists is the component that made it. It registers here, the same way the read side does.
 */
type ScrollTo = (target: string) => boolean;

let scrollTo: ScrollTo | null = null;

export function setScrollTo(next: ScrollTo): void {
  scrollTo = next;
}

export function clearScrollTo(): void {
  scrollTo = null;
}

/**
 * Ask whatever is driving the page to go to `target`.
 *
 * Returns whether it actually scrolled, so the caller can fall back. It is deliberately the
 * caller's fallback and not this module's: when no smoother is running the page scrolls natively
 * and the browser's own anchor handling is already correct, which is a decision about an event,
 * not about scrolling.
 */
export function scrollToTarget(target: string): boolean {
  if (!scrollTo) return false;
  try {
    return scrollTo(target) === true;
  } catch {
    return false;
  }
}
