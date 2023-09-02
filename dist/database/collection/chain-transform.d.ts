export type ChainTransform = string | {
    type: string;
    value?: any;
    mapFunction?: (_: any) => any;
    reduceFunction?: (values: any[]) => any;
}[];
