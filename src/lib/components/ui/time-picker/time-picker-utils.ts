import type { CalendarDate } from "@internationalized/date";
import { getLocalTimeZone, today } from "@internationalized/date";

export function createDefaultCalendarDate(): CalendarDate {
  return today(getLocalTimeZone()) as CalendarDate;
}

export function parseTimeString(timeStr: string): { hours: number; minutes: number; seconds: number } | null {
  if (!timeStr) return null;
  
  const parts = timeStr.split(":");
  if (parts.length < 2) return null;
  
  const hours = parseInt(parts[0], 10);
  const minutes = parseInt(parts[1], 10);
  const seconds = parts.length >= 3 ? parseInt(parts[2], 10) : 0;
  
  if (isNaN(hours) || isNaN(minutes) || isNaN(seconds)) return null;
  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59 || seconds < 0 || seconds > 59) return null;
  
  return { hours, minutes, seconds };
}

export function formatTimeValue(hours: number, minutes: number, seconds: number): string {
  const h = String(hours).padStart(2, "0");
  const m = String(minutes).padStart(2, "0");
  const s = String(seconds).padStart(2, "0");
  return `${h}:${m}:${s}`;
}
