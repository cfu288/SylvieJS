/* eslint-disable @typescript-eslint/no-this-alias */
"use strict";
import { CollectionDocumentMeta } from "./collection-document-meta";

export interface CollectionDocumentBase {
  meta?: CollectionDocumentMeta;
  $loki?: number;
}
