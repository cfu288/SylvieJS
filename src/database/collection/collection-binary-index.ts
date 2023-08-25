/* eslint-disable @typescript-eslint/no-this-alias */
"use strict";

export type CollectionBinaryIndex = Record<
  string,
  {
    name: string;
    dirty: boolean;
    values: any[];
  }
>;
