/** DRF may return a plain array or { results: T[] } when pagination is enabled. */
export function normalizeListResponse<T>(data: T[] | { results?: T[] } | null | undefined): T[] {
  if (Array.isArray(data)) return data;
  if (data && typeof data === "object" && Array.isArray(data.results)) {
    return data.results;
  }
  return [];
}
