// ─── types/validation.ts ───────────────────────────────
export interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
}