import { ChangeOpsLoadJSONUsersOptions } from "./ChangeOpsLoadJSONUsersOptions";
import { ChangeOpsLoadJSONOptionsMeta } from "./ChangeOpsLoadJSONOptionsMeta";
export interface ChangeOpsLoadJSONOptions extends ChangeOpsLoadJSONOptionsMeta {
    retainDirtyFlags: boolean;
    users: Partial<ChangeOpsLoadJSONUsersOptions>;
}
