import { useCallback, useEffect, useState } from "react";

/** A very small history router. Enough for five destinations and a few details. */
export interface RouteMatch {
  params: Record<string, string>;
}

export function matchRoute(pattern: string, path: string): RouteMatch | null {
  const p = pattern.split("/").filter(Boolean);
  const s = path.split("/").filter(Boolean);
  if (p.length !== s.length) return null;
  const params: Record<string, string> = {};
  for (let i = 0; i < p.length; i += 1) {
    const seg = p[i]!;
    const val = s[i]!;
    if (seg.startsWith(":")) params[seg.slice(1)] = decodeURIComponent(val);
    else if (seg !== val) return null;
  }
  return { params };
}

function currentPath(): string {
  return window.location.pathname.replace(/\/+$/, "") || "/";
}

export interface Location {
  path: string;
  search: string;
}

function currentLocation(): Location {
  return { path: currentPath(), search: window.location.search };
}

export function useLocationPath(): [Location, (to: string, opts?: { replace?: boolean }) => void] {
  const [loc, setLoc] = useState<Location>(() => (typeof window === "undefined" ? { path: "/", search: "" } : currentLocation()));
  useEffect(() => {
    const onPop = () => setLoc(currentLocation());
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);
  const navigate = useCallback((to: string, opts?: { replace?: boolean }) => {
    if (opts?.replace) window.history.replaceState({}, "", to);
    else window.history.pushState({}, "", to);
    setLoc(currentLocation());
    window.scrollTo({ top: 0 });
  }, []);
  return [loc, navigate];
}
