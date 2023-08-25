export interface DynamicViewOptions {
  // indicates if view is to main internal results array in 'resultdata'. Default false.
  persistent: boolean;
  // 'passive' (sorts performed on call to data) or 'active' (after updates). Default 'passive'.
  sortPriority: "passive" | "active";
  // minimum rebuild interval (need clarification to docs here)
  minRebuildInterval: number;
}
