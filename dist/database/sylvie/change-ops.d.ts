export interface ChangeOps {
    name: string;
    operation: "U" | "I" | "R";
    obj: Record<string, any>;
}
