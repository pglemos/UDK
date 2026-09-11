"use client";

import { useEffect } from "react";

const MOBILE_QUERY = "(max-width: 1100px)";
const COMPACT_MOBILE_QUERY = "(max-width: 760px)";
const DISCLOSURE_SELECTOR = "[data-result-disclosure]";
let selectedResultId: string | null = null;

function resultDisclosures(): HTMLDetailsElement[] {
  return Array.from(document.querySelectorAll<HTMLDetailsElement>(DISCLOSURE_SELECTOR));
}

function resultIndexLinks(): HTMLAnchorElement[] {
  return Array.from(
    document.querySelectorAll<HTMLAnchorElement>("#resultados-index a[href^='#resultado-']"),
  );
}

function applyDisclosureMode(): void {
  const disclosures = resultDisclosures();
  if (!disclosures.length) return;

  disclosures.forEach((disclosure) => {
    disclosure.setAttribute("name", "resultados-provas");
  });

  const hashTarget = window.location.hash
    ? document.querySelector<HTMLDetailsElement>(window.location.hash)
    : null;
  if (hashTarget && disclosures.includes(hashTarget)) {
    disclosures.forEach((disclosure) => {
      disclosure.open = disclosure === hashTarget;
    });
    return;
  }

  if (!disclosures.some((disclosure) => disclosure.open)) disclosures[0]!.open = true;
}

function openHashResult(): void {
  const hash = window.location.hash;
  const target = hash ? document.querySelector<HTMLDetailsElement>(hash) : null;
  if (!target) return;

  resultDisclosures().forEach((disclosure) => {
    disclosure.open = disclosure === target;
  });
  selectedResultId = target.id;
  target.open = true;
  target.scrollIntoView({ block: "start" });
}

function syncActiveResult(): void {
  const links = resultIndexLinks();
  const panels = resultDisclosures();
  if (!links.length || !panels.length) return;

  const headerHeight = Number.parseFloat(
    getComputedStyle(document.documentElement).getPropertyValue("--cinema-header"),
  );
  const compactMobile = window.matchMedia(COMPACT_MOBILE_QUERY).matches;
  const indexOffset = compactMobile ? 16 : 136;
  const referenceY = (Number.isFinite(headerHeight) ? headerHeight : 92) + indexOffset;
  const selectedIndex = selectedResultId
    ? panels.findIndex((panel) => panel.id === selectedResultId && panel.open)
    : -1;
  let activeIndex = selectedIndex >= 0 ? selectedIndex : 0;

  if (selectedIndex < 0) {
    panels.forEach((panel, index) => {
      if (panel.getBoundingClientRect().top <= referenceY) activeIndex = index;
    });
  }

  links.forEach((link, index) => {
    const active = index === activeIndex;
    link.toggleAttribute("data-active", active);
    if (active) link.setAttribute("aria-current", "location");
    else link.removeAttribute("aria-current");
  });
}

function markActiveResult(link: HTMLAnchorElement): void {
  resultIndexLinks().forEach((candidate) => {
    const active = candidate === link;
    candidate.toggleAttribute("data-active", active);
    if (active) candidate.setAttribute("aria-current", "location");
    else candidate.removeAttribute("aria-current");
  });
}

function openIndexedResult(event: Event): void {
  const link = (event.target as Element | null)?.closest<HTMLAnchorElement>(
    "#resultados-index a[href^='#resultado-']",
  );
  if (!link) return;
  const mouseEvent = event as MouseEvent;
  if (
    event instanceof MouseEvent &&
    (mouseEvent.button !== 0 || mouseEvent.metaKey || mouseEvent.ctrlKey || mouseEvent.shiftKey)
  ) {
    return;
  }
  const hash = link.hash;
  const target = hash ? document.querySelector<HTMLDetailsElement>(hash) : null;
  if (!target) return;

  event.preventDefault();
  resultDisclosures().forEach((disclosure) => {
    disclosure.open = disclosure === target;
  });
  selectedResultId = target.id;
  window.history.replaceState(null, "", hash);
  target.scrollIntoView({ block: "start" });
  markActiveResult(link);
  requestAnimationFrame(syncActiveResult);
}

function syncDisclosureState(event: Event): void {
  const target = event.currentTarget as HTMLDetailsElement;
  if (target.open) {
    selectedResultId = target.id;
    resultDisclosures().forEach((disclosure) => {
      if (disclosure !== target) disclosure.open = false;
    });
  }
  syncActiveResult();
}

export function PublicResultsBehavior() {
  useEffect(() => {
    const media = window.matchMedia(MOBILE_QUERY);
    const disclosures = resultDisclosures();
    if (!disclosures.length) return;

    const apply = () => {
      applyDisclosureMode();
      openHashResult();
      syncActiveResult();
    };

    apply();
    media.addEventListener("change", apply);
    window.addEventListener("scroll", syncActiveResult, { passive: true });
    window.addEventListener("resize", syncActiveResult, { passive: true });
    disclosures.forEach((disclosure) => disclosure.addEventListener("toggle", syncDisclosureState));
    document.addEventListener("click", openIndexedResult);

    return () => {
      media.removeEventListener("change", apply);
      window.removeEventListener("scroll", syncActiveResult);
      window.removeEventListener("resize", syncActiveResult);
      disclosures.forEach((disclosure) =>
        disclosure.removeEventListener("toggle", syncDisclosureState),
      );
      document.removeEventListener("click", openIndexedResult);
    };
  }, []);

  return null;
}
