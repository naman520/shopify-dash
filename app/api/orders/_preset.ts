import { NextRequest } from "next/server";
import { GET as getOrders } from "./route";

const DASHBOARD_TIME_ZONE = "Asia/Kolkata";

export type OrderDatePreset = "today" | "yesterday" | "this-month";

function getCalendarDate(date: Date) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: DASHBOARD_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);

  const value = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((part) => part.type === type)?.value);

  return {
    year: value("year"),
    month: value("month"),
    day: value("day"),
  };
}

function formatCalendarDate(year: number, month: number, day: number) {
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

export function getPresetDateRange(preset: OrderDatePreset, now = new Date()) {
  const today = getCalendarDate(now);
  const todayString = formatCalendarDate(today.year, today.month, today.day);

  if (preset === "today") {
    return { startDate: todayString, endDate: todayString };
  }

  if (preset === "this-month") {
    return {
      startDate: formatCalendarDate(today.year, today.month, 1),
      endDate: todayString,
    };
  }

  // UTC is used only for calendar arithmetic. The input date has already been
  // resolved in the dashboard timezone, so the server timezone cannot shift it.
  const previousDay = new Date(Date.UTC(today.year, today.month - 1, today.day - 1));
  const yesterdayString = formatCalendarDate(
    previousDay.getUTCFullYear(),
    previousDay.getUTCMonth() + 1,
    previousDay.getUTCDate()
  );

  return { startDate: yesterdayString, endDate: yesterdayString };
}

export function getOrdersForPreset(request: NextRequest, preset: OrderDatePreset) {
  const { startDate, endDate } = getPresetDateRange(preset);
  const url = new URL(request.url);

  // Keep productId, storeId, and refresh, but ensure callers cannot override
  // the date range owned by this preset endpoint.
  url.searchParams.set("startDate", startDate);
  url.searchParams.set("endDate", endDate);

  return getOrders(
    new NextRequest(url, {
      method: "GET",
      headers: request.headers,
    })
  );
}
