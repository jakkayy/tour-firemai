import { useCallback, useMemo, useSyncExternalStore } from "react";

const STORAGE_KEY = "tour-firemai:favorites";
const CHANGE_EVENT = "tour-firemai:favorites-change";
const EMPTY = "[]";

function readRaw(): string {
  try {
    return window.localStorage.getItem(STORAGE_KEY) ?? EMPTY;
  } catch {
    return EMPTY;
  }
}

function parse(raw: string): number[] {
  try {
    const value: unknown = JSON.parse(raw);
    return Array.isArray(value) ? value.filter((v): v is number => Number.isInteger(v)) : [];
  } catch {
    return [];
  }
}

function write(ids: number[]) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
  } catch {
    // Storage blocked (private mode etc.): favorites just won't persist.
  }
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

function subscribe(onChange: () => void) {
  // "storage" covers other tabs, CHANGE_EVENT covers this one.
  window.addEventListener("storage", onChange);
  window.addEventListener(CHANGE_EVENT, onChange);
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener(CHANGE_EVENT, onChange);
  };
}

// Favorites live in localStorage only (no login). Newest first.
export function useFavorites() {
  const raw = useSyncExternalStore(subscribe, readRaw, () => EMPTY);
  const ids = useMemo(() => parse(raw), [raw]);

  const toggle = useCallback((id: number) => {
    const current = parse(readRaw());
    write(current.includes(id) ? current.filter((x) => x !== id) : [id, ...current]);
  }, []);

  const removeMany = useCallback((toRemove: number[]) => {
    const drop = new Set(toRemove);
    write(parse(readRaw()).filter((x) => !drop.has(x)));
  }, []);

  return { ids, toggle, removeMany };
}
