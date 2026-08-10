// validators/availabilityValidator.ts

import type { AvailabilitySlot, ValidationResult } from "../types";
import {
  normaliseTime,
  isValidTimeFormat,
  isTimeOverlap,
  getDurationMinutes,
} from "../utils/timeUtils";

export interface AvailabilitySlotInput {
  day_of_week: number;
  start_time: string;
  end_time: string;
  max_bookings: number;
  id?: number;
}

export interface AvailabilityConfig {
  minSlotDurationMinutes: number;
  maxSlotDurationMinutes: number;
  maxBookingsPerSlot: number;
  allowOvernight: boolean;
}

const DEFAULT_CONFIG: AvailabilityConfig = {
  minSlotDurationMinutes: 15,
  maxSlotDurationMinutes: 720,
  maxBookingsPerSlot: 100,
  allowOvernight: false,
};

export const validateAvailabilitySlot = (
  data: AvailabilitySlotInput,
  existingSlots: Pick<AvailabilitySlot, "id" | "day_of_week" | "start_time" | "end_time">[],
  config: Partial<AvailabilityConfig> = {},
): ValidationResult => {
  const cfg = { ...DEFAULT_CONFIG, ...config };
  const errors: Record<string, string> = {};

  // 1. day_of_week
  if (data.day_of_week === undefined || data.day_of_week === null) {
    errors.day_of_week = "Day is required.";
  } else if (!Number.isInteger(data.day_of_week) || data.day_of_week < 0 || data.day_of_week > 6) {
    errors.day_of_week = "Day must be between Monday (0) and Sunday (6).";
  }

  // 2. start_time
  if (!data.start_time) {
    errors.start_time = "Start time is required.";
  } else if (!isValidTimeFormat(data.start_time)) {
    errors.start_time = "Start time must be in HH:mm format.";
  }

  // 3. end_time
  if (!data.end_time) {
    errors.end_time = "End time is required.";
  } else if (!isValidTimeFormat(data.end_time)) {
    errors.end_time = "End time must be in HH:mm format.";
  }

  // 4. max_bookings
  if (data.max_bookings === undefined || data.max_bookings === null) {
    errors.max_bookings = "Max bookings is required.";
  } else if (!Number.isInteger(data.max_bookings)) {
    errors.max_bookings = "Max bookings must be a whole number.";
  } else if (data.max_bookings < 1) {
    errors.max_bookings = "Max bookings must be at least 1.";
  } else if (data.max_bookings > cfg.maxBookingsPerSlot) {
    errors.max_bookings = `Max bookings cannot exceed ${cfg.maxBookingsPerSlot}.`;
  }

  // Return early if required fields are missing
  if (Object.keys(errors).length > 0) return { isValid: false, errors };

  // Normalise times
  const start = normaliseTime(data.start_time);
  const end = normaliseTime(data.end_time);

  // 5. Time order (only if overnight is not allowed)
  if (!cfg.allowOvernight && start >= end) {
    errors.end_time = "End time must be after start time.";
    return { isValid: false, errors };
  }

  // 6. Duration checks
  const duration = getDurationMinutes(start, end);
  if (duration < cfg.minSlotDurationMinutes) {
    errors.end_time = `Minimum slot duration is ${cfg.minSlotDurationMinutes} minutes.`;
  } else if (duration > cfg.maxSlotDurationMinutes) {
    errors.end_time = `Maximum slot duration is ${cfg.maxSlotDurationMinutes} minutes.`;
  }

  // 7. Duplicate check (exact same start/end on same day, excluding self)
  const duplicate = existingSlots.some(
    (s) =>
      s.day_of_week === data.day_of_week &&
      s.id !== data.id &&
      s.start_time === start &&
      s.end_time === end,
  );
  if (duplicate) {
    errors.start_time = "An identical slot already exists for this day.";
  }

  // 8. Overlap check (any overlapping slot on same day, excluding self)
  const overlap = existingSlots.some(
    (s) =>
      s.day_of_week === data.day_of_week &&
      s.id !== data.id &&
      isTimeOverlap(start, end, s.start_time, s.end_time),
  );
  if (overlap) {
    errors.start_time = "This time slot overlaps with an existing slot on the same day.";
  }

  return { isValid: Object.keys(errors).length === 0, errors };
};