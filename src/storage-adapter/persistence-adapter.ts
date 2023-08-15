import Sylvie from "../modules/sylvie";

/** there are two build in persistence adapters for internal use
 * fs             for use in Nodejs type environments
 * localStorage   for use in browser environment
 * defined as helper classes here so its easy and clean to use
 */

export interface PersistenceAdapter {
  mode: string | undefined;
  loadDatabase(dbname: string, callback: (value: string | Error) => void): void;
  deleteDatabase(
    dbname: string,
    callback: (
      result: Error | { success: true } | { success: false; error: Error }
    ) => void
  ): void;
  exportDatabase?(
    dbname: string,
    dbref: typeof Sylvie,
    callback?: (
      result: Error | { success: true } | { success: false; error: Error }
    ) => void
  ): void;
  saveDatabase(
    dbname: string,
    dbstring: any,
    callback?: (
      result: Error | { success: true } | { success: false; error: Error }
    ) => void
  ): void;
}

export interface AsyncPersistenceAdapter {
  isAsync: true;
  mode: string | undefined;
  loadDatabaseAsync(dbname: string): Promise<string | Error>;
  deleteDatabaseAsync(dbname: string): Promise<{ success: true }>;
  exportDatabaseAsync?(
    dbname: string,
    dbref: typeof Sylvie
  ): Promise<{ success: true }>;
  saveDatabaseAsync(
    dbname: string,
    dbstring: string
  ): Promise<{ success: true }>;
}
