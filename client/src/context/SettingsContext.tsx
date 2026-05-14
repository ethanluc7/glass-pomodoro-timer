import { createContext, useContext, useState, useCallback, type ReactNode } from "react";
import { loadFromStorage, saveToStorage } from "../lib/storage";

type TimerMode = "focus" | "short-break" | "long-break";

export interface Settings {
  focusDuration: number;
  shortBreakDuration: number;
  longBreakDuration: number;
  longBreakInterval: number;
  autoStartBreak: boolean;
  autoStartFocus: boolean;
  volume: number;
  muted: boolean;
}

const DEFAULTS: Settings = {
  focusDuration: 25 * 60,
  shortBreakDuration: 5 * 60,
  longBreakDuration: 15 * 60,
  longBreakInterval: 4,
  autoStartBreak: false,
  autoStartFocus: false,
  volume: 0.5,
  muted: false,
};

const STORAGE_KEY = "pomofocus-settings";

interface SettingsContextValue {
  settings: Settings;
  updateSettings: (partial: Partial<Settings>) => void;
  getDuration: (mode: TimerMode) => number;
}

const SettingsContext = createContext<SettingsContextValue | undefined>(undefined);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<Settings>(() => {
    const stored = loadFromStorage<Partial<Settings>>(STORAGE_KEY, {});
    return { ...DEFAULTS, ...stored };
  });

  const updateSettings = useCallback((partial: Partial<Settings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...partial };
      saveToStorage(STORAGE_KEY, next);
      return next;
    });
  }, []);

  const getDuration = useCallback(
    (mode: TimerMode): number => {
      switch (mode) {
        case "focus":
          return settings.focusDuration;
        case "short-break":
          return settings.shortBreakDuration;
        case "long-break":
          return settings.longBreakDuration;
      }
    },
    [settings.focusDuration, settings.shortBreakDuration, settings.longBreakDuration]
  );

  return (
    <SettingsContext.Provider value={{ settings, updateSettings, getDuration }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error("useSettings must be used within SettingsProvider");
  return ctx;
}
