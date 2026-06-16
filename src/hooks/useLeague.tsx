import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from "react";
import type { LeagueConfig } from "../types";
import { loadLeague, saveLeague, exportLeagueToFile, importLeagueFromFile, fetchHostedLeague } from "../utils/league-data";

interface LeagueContextType {
  league: LeagueConfig;
  loading: boolean;
  updateLeague: (updater: (prev: LeagueConfig) => LeagueConfig) => void;
  resetLeague: () => void;
  exportData: () => void;
  importData: (file: File) => Promise<void>;
}

const LeagueContext = createContext<LeagueContextType | null>(null);

export function LeagueProvider({ children }: { children: ReactNode }) {
  const [league, setLeague] = useState<LeagueConfig>(() => loadLeague());
  const [loading, setLoading] = useState(true);

  // On mount, if localStorage was empty (got default league with no teams beyond defaults),
  // try to fetch hosted data for visitors
  useEffect(() => {
    const hasLocalData = localStorage.getItem("golf-league-data") !== null;
    if (!hasLocalData) {
      fetchHostedLeague().then((hosted) => {
        if (hosted) {
          setLeague(hosted);
          // Don't save to localStorage — keep visitors stateless so they always get fresh data
        }
        setLoading(false);
      });
    } else {
      setLoading(false);
    }
  }, []);

  const updateLeague = useCallback((updater: (prev: LeagueConfig) => LeagueConfig) => {
    setLeague((prev) => {
      const next = updater(prev);
      saveLeague(next);
      return next;
    });
  }, []);

  const resetLeague = useCallback(() => {
    localStorage.removeItem("golf-league-data");
    const fresh = loadLeague();
    setLeague(fresh);
  }, []);

  const exportData = useCallback(() => {
    exportLeagueToFile(league);
  }, [league]);

  const importData = useCallback(async (file: File) => {
    const imported = await importLeagueFromFile(file);
    setLeague(imported);
  }, []);

  return (
    <LeagueContext.Provider value={{ league, loading, updateLeague, resetLeague, exportData, importData }}>
      {children}
    </LeagueContext.Provider>
  );
}

export function useLeague(): LeagueContextType {
  const ctx = useContext(LeagueContext);
  if (!ctx) throw new Error("useLeague must be used within LeagueProvider");
  return ctx;
}
