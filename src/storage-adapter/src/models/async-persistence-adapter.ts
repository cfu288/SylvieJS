import Sylvie from "../../../database/sylvie";

/**
 * AsyncPersistenceAdapter is a interface that will be used for all async persistence adapters and are
 * compatible with only SylvieJS, not LokiJS. Replaces the previous callback API with async/await. Note
 * that an adapter can choose to implement both SyncPersistenceAdapter and AsyncPersistenceAdapter if
 * backwards compatibility is desired. Sylvie will choose to use the async version isAsync is set.
 */

export interface AsyncPersistenceAdapter {
  isAsync: true;
  mode?: "normal" | "reference" | "incremental";
  loadDatabaseAsync(dbname: string): Promise<string>;
  deleteDatabaseAsync(dbname: string): Promise<void>;
  saveDatabaseAsync(dbname: string, dbstring: string): Promise<void>;
  exportDatabaseAsync?(dbname: string, dbref: typeof Sylvie): Promise<void>;
}
