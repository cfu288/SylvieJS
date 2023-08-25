export type SuccessResultType = {
    success: true;
};
export type FailResultType = {
    success: false;
    error: Error;
};
export type ResultType = SuccessResultType | FailResultType;
