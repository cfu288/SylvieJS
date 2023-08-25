/* eslint-disable @typescript-eslint/no-this-alias */
"use strict";
import { CollectionDocumentBase } from "./collection-document-base";

export type CollectionDocument = object &
  Record<string, any> &
  CollectionDocumentBase;
