// src/utils/format.ts

/**
 * Format a number as currency.
 */
export const formatCurrency = (
  amount: number,
  locale: string = "en-US",
  currency: string = "USD"
): string => {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

/**
 * Format a date string.
 */
export const formatDate = (
  date: string | Date,
  locale: string = "en-US"
): string => {
  return new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(date));
};

/**
 * Format a date & time.
 */
export const formatDateTime = (
  date: string | Date,
  locale: string = "en-US"
): string => {
  return new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
};

/**
 * Format percentage.
 */
export const formatPercentage = (
  value: number,
  fractionDigits = 1
): string => {
  return `${value.toFixed(fractionDigits)}%`;
};

/**
 * Format large numbers.
 * Example:
 * 1200 -> 1.2K
 * 2500000 -> 2.5M
 */
export const formatCompactNumber = (
  value: number,
  locale: string = "en-US"
): string => {
  return new Intl.NumberFormat(locale, {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
};

/**
 * Capitalize first letter.
 */
export const capitalize = (text: string): string => {
  if (!text) return "";
  return text.charAt(0).toUpperCase() + text.slice(1);
};

/**
 * Truncate long text.
 */
export const truncate = (
  text: string,
  maxLength = 50
): string => {
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength)}...`;
};