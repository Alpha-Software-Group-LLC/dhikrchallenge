import { createContext, useContext, type AnchorHTMLAttributes, type MouseEvent, type ReactNode } from "react";
import { useLocationPath } from "@/lib/router";

interface RouterValue {
  path: string;
  search: string;
  navigate: (to: string, opts?: { replace?: boolean }) => void;
}

const RouterContext = createContext<RouterValue | null>(null);

export function RouterProvider({ children }: { children: ReactNode }) {
  const [loc, navigate] = useLocationPath();
  return <RouterContext.Provider value={{ path: loc.path, search: loc.search, navigate }}>{children}</RouterContext.Provider>;
}

export function useRouter(): RouterValue {
  const ctx = useContext(RouterContext);
  if (!ctx) throw new Error("useRouter must be used within RouterProvider");
  return ctx;
}

interface LinkProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  to: string;
  replace?: boolean;
}

export function Link({ to, replace, onClick, children, ...rest }: LinkProps) {
  const { navigate } = useRouter();
  const handle = (e: MouseEvent<HTMLAnchorElement>) => {
    onClick?.(e);
    if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
    e.preventDefault();
    navigate(to, { replace });
  };
  return (
    <a href={to} onClick={handle} {...rest}>
      {children}
    </a>
  );
}
