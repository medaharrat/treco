import type { Period } from "../types.js";

export interface Range {
  start: number;
  end: number;
}

/** Monday-start week boundaries, in local time. */
function startOfWeek(d: Date): Date {
  const copy = new Date(d);
  copy.setHours(0, 0, 0, 0);
  const day = copy.getDay(); // 0 = Sunday
  const diffToMonday = (day + 6) % 7;
  copy.setDate(copy.getDate() - diffToMonday);
  return copy;
}

function startOfDay(d: Date): Date {
  const copy = new Date(d);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

function startOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1, 0, 0, 0, 0);
}

function startOfYear(d: Date): Date {
  return new Date(d.getFullYear(), 0, 1, 0, 0, 0, 0);
}

/** Current range for a given period, anchored at referenceDate ("now"). */
export function periodRange(period: Period, referenceDate: Date = new Date()): Range {
  switch (period) {
    case "day": {
      const start = startOfDay(referenceDate);
      const end = new Date(start);
      end.setDate(end.getDate() + 1);
      return { start: start.getTime(), end: end.getTime() };
    }
    case "week": {
      const start = startOfWeek(referenceDate);
      const end = new Date(start);
      end.setDate(end.getDate() + 7);
      return { start: start.getTime(), end: end.getTime() };
    }
    case "month": {
      const start = startOfMonth(referenceDate);
      const end = new Date(start.getFullYear(), start.getMonth() + 1, 1);
      return { start: start.getTime(), end: end.getTime() };
    }
    case "year": {
      const start = startOfYear(referenceDate);
      const end = new Date(start.getFullYear() + 1, 0, 1);
      return { start: start.getTime(), end: end.getTime() };
    }
    case "all":
      return { start: 0, end: referenceDate.getTime() + 1 };
  }
}

/** The immediately preceding range of the same length/shape, for trend comparisons. */
export function previousPeriodRange(period: Period, referenceDate: Date = new Date()): Range {
  switch (period) {
    case "day": {
      const prevDay = new Date(referenceDate);
      prevDay.setDate(prevDay.getDate() - 1);
      return periodRange("day", prevDay);
    }
    case "week": {
      const prevWeek = new Date(referenceDate);
      prevWeek.setDate(prevWeek.getDate() - 7);
      return periodRange("week", prevWeek);
    }
    case "month": {
      const start = startOfMonth(referenceDate);
      const prevMonthStart = new Date(start.getFullYear(), start.getMonth() - 1, 1);
      return periodRange("month", prevMonthStart);
    }
    case "year": {
      const start = startOfYear(referenceDate);
      const prevYearStart = new Date(start.getFullYear() - 1, 0, 1);
      return periodRange("year", prevYearStart);
    }
    case "all":
      return { start: 0, end: 0 };
  }
}

export function isWithinRange(timestamp: number, range: Range): boolean {
  return timestamp >= range.start && timestamp < range.end;
}
