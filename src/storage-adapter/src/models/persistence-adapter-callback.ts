import { ResultType } from "./result-type";

export type PersistenceAdapterCallback = (result?: ResultType | Error) => void;
