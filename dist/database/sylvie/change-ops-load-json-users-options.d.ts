import { ChangeOpsLoadJSONOptionsMeta } from "./change-ops-load-json-options-meta";
export type ChangeOpsLoadJSONUsersOptions = {
    inflate: ((src: any) => ChangeOpsLoadJSONOptionsMeta) | ((src: any, dest: ChangeOpsLoadJSONOptionsMeta) => void);
    proto: (n: any) => void;
};
