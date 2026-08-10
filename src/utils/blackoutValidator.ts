// ─── validators/blackoutValidator.ts ────────────────────
import type { ValidationResult } from "../types";
import {
  normaliseTime,
  isValidTimeFormat,
  isTimeOverlap,
  getDurationMinutes,
} from "../utils/timeUtils";

export interface BlackoutInput {
  title: string;
  date: string;
  is_full_day: boolean;
  start_time?: string;
  end_time?: string;
  id?: number;
}

export interface BlackoutConfig {
  minTitleLength: number;
  maxTitleLength: number;
  allowPastDates: boolean;
  minPartialDurationMinutes: number;
}

const DEFAULT_CONFIG: BlackoutConfig = {
  minTitleLength: 1,
  maxTitleLength: 100,
  allowPastDates: false,
  minPartialDurationMinutes: 30,
};

export const validateBlackout = (
  data: BlackoutInput,
  existingBlackouts: { id?: number; date: string; is_full_day: boolean; start_time?: string; end_time?: string }[],
  config: Partial<BlackoutConfig> = {},
): ValidationResult => {
  const cfg = { ...DEFAULT_CONFIG, ...config };
  const errors: Record<string, string> = {};

  // 1. Title
  if (!data.title || !data.title.trim()) {
    errors.title = 'Title is required.';
  } else if (data.title.trim().length < cfg.minTitleLength) {
    errors.title = `Title must be at least ${cfg.minTitleLength} character(s).`;
  } else if (data.title.trim().length > cfg.maxTitleLength) {
    errors.title = `Title cannot exceed ${cfg.maxTitleLength} characters.`;
  }

  // 2. Date
  if (!data.date) {
    errors.date = 'Date is required.';
  } else if (!/^\d{4}-\d{2}-\d{2}$/.test(data.date)) {
    errors.date = 'Date must be in YYYY-MM-DD format.';
  } else if (!cfg.allowPastDates && new Date(data.date) < new Date(new Date().toDateString())) {
    errors.date = 'Blackout date cannot be in the past.';
  }

  // 3. Partial blackout times
  if (!data.is_full_day) {
    if (!data.start_time) {
      errors.start_time = 'Start time is required for partial closures.';
    } else if (!isValidTimeFormat(data.start_time)) {
      errors.start_time = 'Start time must be in HH:mm format.';
    }
    if (!data.end_time) {
      errors.end_time = 'End time is required for partial closures.';
    } else if (!isValidTimeFormat(data.end_time)) {
      errors.end_time = 'End time must be in HH:mm format.';
    }
    if (data.start_time && data.end_time && isValidTimeFormat(data.start_time) && isValidTimeFormat(data.end_time)) {
      const start = normaliseTime(data.start_time);
      const end = normaliseTime(data.end_time);
      if (start >= end) {
        errors.end_time = 'End time must be after start time.';
      } else {
        const duration = getDurationMinutes(start, end);
        if (duration < cfg.minPartialDurationMinutes) {
          errors.end_time = `Partial closure must be at least ${cfg.minPartialDurationMinutes} minutes.`;
        }
      }
    }
  }

  // 4. Duplicate date
  const duplicate = existingBlackouts.some((b) => b.date === data.date && b.id !== data.id);
  if (duplicate) {
    errors.date = 'A blackout for this date already exists.';
  }

  // 5. Overlapping partial blackouts on same date
  if (!data.is_full_day && data.start_time && data.end_time && isValidTimeFormat(data.start_time) && isValidTimeFormat(data.end_time)) {
    const overlap = existingBlackouts.some((b) => {
      if (b.date !== data.date || b.id === data.id) return false;
      if (b.is_full_day) return true;
      if (b.start_time && b.end_time) {
        return isTimeOverlap(
          normaliseTime(data.start_time!),
          normaliseTime(data.end_time!),
          b.start_time,
          b.end_time,
        );
      }
      return false;
    });
    if (overlap) {
      errors.start_time = 'This partial closure overlaps with another closure on the same date.';
    }
  }

  return { isValid: Object.keys(errors).length === 0, errors };
};