import { CloneMethods } from "../../utils/clone";
export interface CollectionOptions {
    unique: string | string[];
    exact: string[];
    adaptiveBinaryIndices: boolean;
    transactional: boolean;
    cloneObjects: boolean;
    cloneMethod: CloneMethods;
    asyncListeners: boolean;
    disableMeta: boolean;
    disableChangesApi: boolean;
    disableDeltaChangesApi: boolean;
    autoupdate: boolean;
    serializableIndices: boolean;
    disableFreeze: boolean;
    ttl: number;
    ttlInterval: number;
    indices: string | string[];
    clone: boolean;
}
