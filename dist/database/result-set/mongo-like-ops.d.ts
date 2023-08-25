import { valueLevelOps } from "../../utils/ops";
export type MongoLikeOps = (typeof valueLevelOps)[number] | "$regex" | "$in" | "$inSet";
