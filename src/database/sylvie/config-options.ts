import { PersistenceAdapter } from "../../storage-adapter/src/models/persistence-adapter";
import { AsyncPersistenceAdapter } from "../../storage-adapter/src/models/async-persistence-adapter";

export interface ConfigOptions {
  adapter: PersistenceAdapter | AsyncPersistenceAdapter | null;
  autoload: boolean;
  autoloadCallback: (err: any) => void;
  autosave: boolean;
  autosaveCallback: (err?: any) => void;
  autosaveInterval: string | number;
  persistenceMethod: "fs" | "localStorage" | "memory" | null;
  destructureDelimiter: string;
  serializationMethod: "normal" | "pretty" | "destructured" | null;
  throttledSaves: boolean;
}
