import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { format } from "date-fns";
import { tr } from "date-fns/locale/tr";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format number as Turkish currency
 */
export function formatMoney(value: number | string, currency: string = "₺"): string {
  const num = typeof value === "string" ? parseFloat(value) : value;
  return `${num.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${currency}`;
}

/**
 * Format date for display
 */
export function formatDate(date: Date | string, options?: Intl.DateTimeFormatOptions): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("tr-TR", options || { day: "2-digit", month: "2-digit", year: "numeric" });
}

/**
 * Format datetime for display
 */
export function formatDateTime(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleString("tr-TR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Get initials from name
 */
export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

/**
 * Truncate text with ellipsis
 */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + "...";
}

/**
 * Convert UTC date to Turkey time (GMT+3) Date object
 */
function toTurkeyDate(dateStr: string): Date {
  const date = new Date(dateStr);
  return new Date(date.getTime() + 3 * 60 * 60 * 1000);
}

/**
 * Format date in Turkey timezone (GMT+3)
 * Default format: "d MMM yyyy" → "17 Şub 2026"
 */
export function formatTurkeyDate(dateStr: string, fmt: string = "d MMM yyyy"): string {
  return format(toTurkeyDate(dateStr), fmt, { locale: tr });
}

/**
 * Format time in Turkey timezone (GMT+3)
 * Returns: "HH:mm" → "14:30"
 */
export function formatTurkeyTime(dateStr: string): string {
  return format(toTurkeyDate(dateStr), "HH:mm", { locale: tr });
}

/**
 * Format full datetime in Turkey timezone (GMT+3)
 * Returns: "d MMM yyyy, HH:mm" → "17 Şub 2026, 14:30"
 */
export function formatTurkeyDateTime(dateStr: string, fmt: string = "d MMM yyyy, HH:mm"): string {
  return format(toTurkeyDate(dateStr), fmt, { locale: tr });
}
