import { ChangeOpsLoadJSONUsersOptions } from "./change-ops-load-json-users-options";
import { ChangeOpsLoadJSONOptionsMeta } from "./change-ops-load-json-options-meta";

export interface ChangeOpsLoadJSONOptions extends ChangeOpsLoadJSONOptionsMeta {
  retainDirtyFlags: boolean;
  users: Partial<ChangeOpsLoadJSONUsersOptions>;
}
