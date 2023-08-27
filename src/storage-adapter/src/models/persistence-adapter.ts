import Sylvie from "../../../database/sylvie";
import { PersistenceAdapterCallback } from "./persistence-adapter-callback";

/**
 * SyncPersistanceAdapter is the interface that will be used for all synchronous persistence adapters and are compatible with LokiJS and SylvieJS
 */
export type PersistenceAdapter =
  | NormalPersistenceAdapter
  | ReferencePersistenceAdapter
  | IncrementalPersistenceAdapter;

export interface NormalPersistenceAdapter {
  mode: "normal";
  loadDatabase(dbname: string, callback: (value: string | Error) => void): void;
  deleteDatabase(dbname: string, callback: PersistenceAdapterCallback): void;
  saveDatabase(
    dbname: string,
    dbstring: string,
    callback?: PersistenceAdapterCallback,
  ): void;
}

export interface IncrementalPersistenceAdapter {
  mode: "incremental";
  loadDatabase(dbname: string, callback: (value: string | Error) => void): void;
  deleteDatabase(dbname: string, callback: PersistenceAdapterCallback): void;
  saveDatabase(
    dbname: string,
    dbref: () => Sylvie,
    callback?: PersistenceAdapterCallback,
  ): void;
}

export interface ReferencePersistenceAdapter {
  mode: "reference";
  loadDatabase(
    dbname: string,
    callback: (value: string | Error | Sylvie) => void,
  ): void;
  deleteDatabase(dbname: string, callback: PersistenceAdapterCallback): void;
  exportDatabase(
    dbname: string,
    dbref: Sylvie,
    callback?: PersistenceAdapterCallback,
  ): void;
}
