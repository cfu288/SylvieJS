import Sylvie from "../../../database/sylvie";

/**
 * AsyncPersistenceAdapter is a interface that will be used for all async persistence adapters and are
 * compatible with only SylvieJS, not LokiJS. Replaces the previous callback API with async/await. Note
 * that an adapter can choose to implement both SyncPersistenceAdapter and AsyncPersistenceAdapter if
 * backwards compatibility is desired. Sylvie will choose to use the async version isAsync is set.
 */
export type AsyncPersistenceAdapter =
  | NormalAsyncPersistenceAdapter
  | ReferenceAsyncPersistenceAdapter;

export interface NormalAsyncPersistenceAdapter {
  isAsync: true;
  mode?: "normal";
  loadDatabaseAsync(dbname: string): Promise<string>;
  deleteDatabaseAsync(dbname: string): Promise<void>;
  saveDatabaseAsync(dbname: string, dbstring: string): Promise<void>;
}

export interface ReferenceAsyncPersistenceAdapter {
  isAsync: true;
  mode: "reference";
  loadDatabaseAsync(dbname: string): Promise<string | Sylvie>;
  deleteDatabaseAsync(dbname: string): Promise<void>;
  exportDatabaseAsync(dbname: string, dbref: Sylvie): Promise<void>;
}
