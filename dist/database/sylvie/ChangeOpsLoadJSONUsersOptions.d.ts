import { ChangeOpsLoadJSONOptionsMeta } from "./ChangeOpsLoadJSONOptionsMeta";
export type ChangeOpsLoadJSONUsersOptions = {
    inflate: ((src: any) => ChangeOpsLoadJSONOptionsMeta) | ((src: any, dest: ChangeOpsLoadJSONOptionsMeta) => void);
    proto: (n: any) => void;
};
