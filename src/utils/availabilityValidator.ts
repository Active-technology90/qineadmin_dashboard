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

/**
 * Convert HH:mm or HH:mm:ss into minutes from midnight.
 */
const timeToMinutes = (time: string): number => {
  if (!time) return NaN;

  const [hours, minutes] = time.split(":").map(Number);

  if (
    !Number.isFinite(hours) ||
    !Number.isFinite(minutes) ||
    hours < 0 ||
    hours > 23 ||
    minutes < 0 ||
    minutes > 59
  ) {
    return NaN;
  }

  return hours * 60 + minutes;
};

/**
 * Normalize API/UI time values to HH:mm.
 *
 * Examples:
 * 09:00      -> 09:00
 * 09:00:00   -> 09:00
 */
const normalizeTimeSafe = (time: string): string => {
  if (!time) return "";

  const [hours = "", minutes = ""] = time.split(":");

  if (hours === "" || minutes === "") {
    return "";
  }

  return `${hours.padStart(2, "0")}:${minutes.padStart(2, "0")}`;
};

export const validateAvailabilitySlot = (
  data: AvailabilitySlotInput,
  existingSlots: Pick<
    AvailabilitySlot,
    "id" | "day_of_week" | "start_time" | "end_time"
  >[],
  config: Partial<AvailabilityConfig> = {},
): ValidationResult => {
  const cfg = {
    ...DEFAULT_CONFIG,
    ...config,
  };

  const errors: Record<string, string> = {};

  // ---------------------------------------------------------
  // 1. Day
  // ---------------------------------------------------------

  if (data.day_of_week === undefined || data.day_of_week === null) {
    errors.day_of_week = "Day is required.";
  } else if (
    !Number.isInteger(data.day_of_week) ||
    data.day_of_week < 0 ||
    data.day_of_week > 6
  ) {
    errors.day_of_week =
      "Day must be between Monday (0) and Sunday (6).";
  }

  // ---------------------------------------------------------
  // 2. Start time
  // ---------------------------------------------------------

  if (!data.start_time) {
    errors.start_time = "Start time is required.";
  } else if (!isValidTimeFormat(data.start_time)) {
    errors.start_time = "Start time must be in HH:mm format.";
  }

  // ---------------------------------------------------------
  // 3. End time
  // ---------------------------------------------------------

  if (!data.end_time) {
    errors.end_time = "End time is required.";
  } else if (!isValidTimeFormat(data.end_time)) {
    errors.end_time = "End time must be in HH:mm format.";
  }

  // ---------------------------------------------------------
  // 4. Max bookings
  // ---------------------------------------------------------

  if (
    data.max_bookings === undefined ||
    data.max_bookings === null ||
    Number.isNaN(data.max_bookings)
  ) {
    errors.max_bookings = "Max bookings is required.";
  } else if (!Number.isInteger(data.max_bookings)) {
    errors.max_bookings = "Max bookings must be a whole number.";
  } else if (data.max_bookings < 1) {
    errors.max_bookings = "Max bookings must be at least 1.";
  } else if (data.max_bookings > cfg.maxBookingsPerSlot) {
    errors.max_bookings = `Max bookings cannot exceed ${cfg.maxBookingsPerSlot}.`;
  }

  // ---------------------------------------------------------
  // Required-field validation
  // ---------------------------------------------------------

  if (Object.keys(errors).length > 0) {
    return {
      isValid: false,
      errors,
    };
  }

  // ---------------------------------------------------------
  // Normalize times
  // ---------------------------------------------------------

  const start = normalizeTimeSafe(data.start_time);
  const end = normalizeTimeSafe(data.end_time);

  const startMinutes = timeToMinutes(start);
  const endMinutes = timeToMinutes(end);

  if (!Number.isFinite(startMinutes)) {
    errors.start_time = "Invalid start time.";
  }

  if (!Number.isFinite(endMinutes)) {
    errors.end_time = "Invalid end time.";
  }

  if (Object.keys(errors).length > 0) {
    return {
      isValid: false,
      errors,
    };
  }

  // ---------------------------------------------------------
  // 5. Time order
  // ---------------------------------------------------------

  if (!cfg.allowOvernight && startMinutes >= endMinutes) {
    errors.end_time = "End time must be after start time.";

    return {
      isValid: false,
      errors,
    };
  }

  // ---------------------------------------------------------
  // 6. Duration
  // ---------------------------------------------------------

  let duration = getDurationMinutes(start, end);

  // Extra protection if utility implementation behaves
  // differently for HH:mm / HH:mm:ss.
  if (!Number.isFinite(duration)) {
    duration = endMinutes - startMinutes;

    if (cfg.allowOvernight && duration <= 0) {
      duration += 24 * 60;
    }
  }

  if (duration < cfg.minSlotDurationMinutes) {
    errors.end_time =
      `Minimum slot duration is ${cfg.minSlotDurationMinutes} minutes.`;
  } else if (duration > cfg.maxSlotDurationMinutes) {
    errors.end_time =
      `Maximum slot duration is ${cfg.maxSlotDurationMinutes} minutes.`;
  }

  // ---------------------------------------------------------
  // 7. Duplicate / overlap
  // ---------------------------------------------------------

  const sameDaySlots = existingSlots.filter(
    (slot) =>
      slot.day_of_week === data.day_of_week &&
      slot.id !== data.id,
  );

  for (const slot of sameDaySlots) {
    const existingStart = normalizeTimeSafe(slot.start_time);
    const existingEnd = normalizeTimeSafe(slot.end_time);

    // Exact duplicate
    if (
      existingStart === start &&
      existingEnd === end
    ) {
      errors.start_time =
        "An identical slot already exists for this day.";

      break;
    }

    // Overlap
    if (
      isTimeOverlap(
        start,
        end,
        existingStart,
        existingEnd,
      )
    ) {
      errors.start_time =
        "This time slot overlaps with an existing slot on the same day.";

      break;
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};