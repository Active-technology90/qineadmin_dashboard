export function extractErrorMessage(err: any, fallbackMessage = "An error occurred"): string {
  if (!err) return fallbackMessage;

  const data = err?.response?.data;
  if (!data) {
    return err?.message || fallbackMessage;
  }

  // 1. Raw string
  if (typeof data === "string") {
    return data;
  }

  // 2. "detail" or "error"
  if (typeof data.detail === "string") return data.detail;
  if (typeof data.error === "string") return data.error;

  // 3. Array of errors
  if (Array.isArray(data) && data.length > 0) {
    return data.map((item) => (typeof item === "string" ? item : JSON.stringify(item))).join(", ");
  }

  // 4. Object of field errors (e.g. { start_time: ["Open time must be before close time"] })
  if (typeof data === "object") {
    const errorParts: string[] = [];

    for (const [key, value] of Object.entries(data)) {
      const fieldLabel = key === "non_field_errors" || key === "detail" ? "" : `${key.replace(/_/g, " ")}: `;
      if (Array.isArray(value)) {
        errorParts.push(`${fieldLabel}${value.map((v) => (typeof v === "string" ? v : JSON.stringify(v))).join(", ")}`);
      } else if (typeof value === "string") {
        errorParts.push(`${fieldLabel}${value}`);
      } else if (typeof value === "object" && value !== null) {
        const sub = Object.entries(value)
          .map(([k, v]) => `${k.replace(/_/g, " ")}: ${Array.isArray(v) ? (v as any[]).join(", ") : v}`)
          .join("; ");
        errorParts.push(`${fieldLabel}${sub}`);
      }
    }

    if (errorParts.length > 0) {
      return errorParts.join(" | ");
    }
  }

  return err?.message || fallbackMessage;
}
