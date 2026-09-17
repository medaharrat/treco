import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { DEFAULT_SETTINGS, type ExtensionSettings, type Goal, type UsageEvent } from "@ai-footprint/core";
import { WebExtensionStorageAdapter } from "../../platform/storage.js";
import { browser } from "../../platform/browserApi.js";

const storage = new WebExtensionStorageAdapter();

interface StorageContextValue {
  events: UsageEvent[];
  settings: ExtensionSettings;
  goals: Goal[];
  loading: boolean;
  updateSettings: (patch: Partial<ExtensionSettings>) => Promise<void>;
  setGoals: (goals: Goal[]) => Promise<void>;
  clearAllData: () => Promise<void>;
  importEvents: (events: UsageEvent[]) => Promise<void>;
  refresh: () => Promise<void>;
}

const StorageContext = createContext<StorageContextValue | null>(null);

export function StorageProvider({ children }: { children: React.ReactNode }) {
  const [events, setEvents] = useState<UsageEvent[]>([]);
  const [settings, setSettingsState] = useState<ExtensionSettings>(DEFAULT_SETTINGS);
  const [goals, setGoalsState] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const [e, s, g] = await Promise.all([storage.getEvents(), storage.getSettings(), storage.getGoals()]);
    setEvents(e);
    setSettingsState(s);
    setGoalsState(g);
    setLoading(false);
  }, []);

  useEffect(() => {
    void refresh();

    const listener = (changes: Record<string, chrome.storage.StorageChange>, areaName: string) => {
      if (areaName !== "local") return;
      if (changes["aifootprint:events"] || changes["aifootprint:settings"] || changes["aifootprint:goals"]) {
        void refresh();
      }
    };
    browser.storage.onChanged.addListener(listener);
    return () => browser.storage.onChanged.removeListener(listener);
  }, [refresh]);

  const updateSettings = useCallback(
    async (patch: Partial<ExtensionSettings>) => {
      const next = { ...settings, ...patch };
      setSettingsState(next);
      await storage.setSettings(next);
    },
    [settings]
  );

  const setGoals = useCallback(async (nextGoals: Goal[]) => {
    setGoalsState(nextGoals);
    await storage.setGoals(nextGoals);
  }, []);

  const clearAllData = useCallback(async () => {
    await storage.clearAllEvents();
    setEvents([]);
  }, []);

  const importEvents = useCallback(async (imported: UsageEvent[]) => {
    await storage.replaceAllEvents(imported);
    await refresh();
  }, [refresh]);

  const value = useMemo<StorageContextValue>(
    () => ({ events, settings, goals, loading, updateSettings, setGoals, clearAllData, importEvents, refresh }),
    [events, settings, goals, loading, updateSettings, setGoals, clearAllData, importEvents, refresh]
  );

  return <StorageContext.Provider value={value}>{children}</StorageContext.Provider>;
}

export function useStorage(): StorageContextValue {
  const ctx = useContext(StorageContext);
  if (!ctx) throw new Error("useStorage must be used within a StorageProvider");
  return ctx;
}
