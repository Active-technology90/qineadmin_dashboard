// ─── utils/timeUtils.ts ────────────────────────────────
/**
 * Convert "HH:mm" to minutes from midnight.
 */
export const timeToMinutes = (time: string): number => {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
};

/**
 * Check if two half‑open intervals [startA, endA) and [startB, endB) overlap.
 */
export const isTimeOverlap = (
  startA: string,
  endA: string,
  startB: string,
  endB: string,
): boolean => {
  return startA < endB && startB < endA;
};

/**
 * Normalise a time string to "HH:mm" (pad with zeros).
 */
export const normaliseTime = (time: string): string => {
  const parts = time.trim().split(':');
  const hour = parts[0].padStart(2, '0');
  const minute = (parts[1] || '0').padStart(2, '0');
  return `${hour}:${minute}`;
};

/**
 * Validate HH:mm format.
 */
export const isValidTimeFormat = (time: string): boolean =>
  /^([0-1]\d|2[0-3]):[0-5]\d$/.test(time);

/**
 * Get duration in minutes between start and end (supports overnight if end < start).
 */
export const getDurationMinutes = (start: string, end: string): number => {
  let startMin = timeToMinutes(start);
  let endMin = timeToMinutes(end);
  if (endMin <= startMin) {
    endMin += 24 * 60; // overnight
  }
  return endMin - startMin;
};