import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Database } from "./types";
import { loadDatabase, saveDatabase } from "./storage";

interface DbContextValue {
  db: Database;
  setDb: (db: Database) => void;
}

const DbContext = createContext<DbContextValue | null>(null);

export function DbProvider({ children }: { children: ReactNode }) {
  const [db, setDbState] = useState<Database>(() => loadDatabase());

  useEffect(() => {
    saveDatabase(db);
  }, [db]);

  const setDb = (next: Database) => setDbState(next);

  return <DbContext.Provider value={{ db, setDb }}>{children}</DbContext.Provider>;
}

export function useDb(): DbContextValue {
  const ctx = useContext(DbContext);
  if (!ctx) throw new Error("useDb deve essere usato dentro DbProvider");
  return ctx;
}

export function newId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;
}
