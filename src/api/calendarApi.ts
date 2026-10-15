import { jsonHeaders, request } from "./http";
import type { CalendarEvent, CalendarEventPayload } from "../types/calendar";

const CALENDAR_API_URL = "/api/calendar/events";

export async function getCalendarEvents() {
  return request<CalendarEvent[]>(CALENDAR_API_URL);
}

export async function createCalendarEvent(payload: CalendarEventPayload) {
  return request<CalendarEvent>(CALENDAR_API_URL, {
    method: "POST",
    headers: jsonHeaders,
    body: JSON.stringify(payload),
  });
}

export async function updateCalendarEvent(
  eventId: number,
  payload: CalendarEventPayload,
) {
  return request<CalendarEvent>(`${CALENDAR_API_URL}/${eventId}`, {
    method: "PUT",
    headers: jsonHeaders,
    body: JSON.stringify(payload),
  });
}

export async function deleteCalendarEvent(eventId: number) {
  return request<void>(`${CALENDAR_API_URL}/${eventId}`, { method: "DELETE" });
}
