// src/context/ThemeContext.tsx
import React, { createContext, useContext, useState, useEffect, type ReactNode } from "react";

export interface ThemeColors {
  bg: string;
  bg2: string;
  srf: string;
  srf2: string;
  bdr: string;
  bdr2: string;
  t1: string;
  t2: string;
  t3: string;
  acc: string;
}

interface ThemeContextValue {
  dark: boolean;
  setDark: (val: boolean) => void;
  toggleDark: () => void;
  t: ThemeColors;
  themeStyles: React.CSSProperties;
}

const darkColors: ThemeColors = {
  bg: "#0f1a24",
  bg2: "#152535",
  srf: "#1c3044",
  srf2: "#22384e",
  bdr: "#2e5065",
  bdr2: "#3a6580",
  t1: "#f0f8fc",
  t2: "#a0d0e0",
  t3: "#6ba0b8",
  acc: "#22d3ee",
};

const lightColors: ThemeColors = {
  bg: "#eef7fa",
  bg2: "#e0f0f5",
  srf: "#ffffff",
  srf2: "#f0f8fb",
  bdr: "#c0dde8",
  bdr2: "#a0c8d8",
  t1: "#0f2a33",
  t2: "#5f8a99",
  t3: "#8aafbb",
  acc: "#0891b2",
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [dark, setDark] = useState<boolean>(() => {
    const saved = localStorage.getItem("giteaforge_theme");
    return saved ? saved === "dark" : false;
  });

  useEffect(() => {
    localStorage.setItem("giteaforge_theme", dark ? "dark" : "light");
    const currentTheme = dark ? darkColors : lightColors;
    document.documentElement.style.backgroundColor = currentTheme.bg;
    document.body.style.backgroundColor = currentTheme.bg;
    document.body.style.color = currentTheme.t1;
    
    // Set root CSS variables
    Object.entries(currentTheme).forEach(([key, val]) => {
      document.documentElement.style.setProperty(`--${key}`, val);
    });

    if (dark) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [dark]);

  const toggleDark = () => setDark((prev) => !prev);
  const t = dark ? darkColors : lightColors;

  const themeStyles = {
    "--bg": t.bg,
    "--bg2": t.bg2,
    "--srf": t.srf,
    "--srf2": t.srf2,
    "--bdr": t.bdr,
    "--bdr2": t.bdr2,
    "--t1": t.t1,
    "--t2": t.t2,
    "--t3": t.t3,
    "--acc": t.acc,
  } as React.CSSProperties;

  return (
    <ThemeContext.Provider value={{ dark, setDark, toggleDark, t, themeStyles }}>
      <div style={themeStyles} className={dark ? "dark" : ""}>
        {children}
      </div>
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}
