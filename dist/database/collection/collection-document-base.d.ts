import { CollectionDocumentMeta } from "./collection-document-meta";
export interface CollectionDocumentBase {
    meta?: CollectionDocumentMeta;
    $loki?: number;
}
