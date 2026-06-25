import { createContext, useContext, useEffect, useState } from "react";
import { flushSync } from "react-dom";

type Mode = "light" | "dark" | "system";
const STORAGE_KEY = "ascii-anim-theme";

const Ctx = createContext<{
  resolvedMode: "light" | "dark";
  mode: Mode;
  setMode: (m: Mode) => void;
} | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setModeState] = useState<Mode>(() => {
    try {
      return (localStorage.getItem(STORAGE_KEY) as Mode) ?? "dark";
    } catch {
      return "dark";
    }
  });

  const resolved: "light" | "dark" =
    mode === "system"
      ? window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light"
      : mode;

  const setMode = (m: Mode) => {
    const apply = () => {
      setModeState(m);
      try {
        localStorage.setItem(STORAGE_KEY, m);
      } catch {}
    };
    const doc = document as Document & {
      startViewTransition?: (cb: () => void) => void;
    };
    if (
      doc.startViewTransition &&
      !window.matchMedia("(prefers-reduced-motion:reduce)").matches
    ) {
      doc.startViewTransition(() => flushSync(apply));
    } else {
      apply();
    }
  };

  useEffect(() => {
    document.documentElement.classList.toggle("dark", resolved === "dark");
    document.documentElement.classList.toggle("light", resolved !== "dark");
  }, [resolved]);

  return (
    <Ctx.Provider value={{ mode, resolvedMode: resolved, setMode }}>
      {children}
    </Ctx.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}
