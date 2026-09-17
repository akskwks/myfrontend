import { jsonHeaders, request } from "./http";
import type { CalendarEvent, CalendarEventPayload } from "../types/calendar";

const CALENDAR_API_URL = "/api/calendar/events";
const LOCAL_KEY = "myapp.calendar.events";

const now = () => new Date().toISOString();

function readLocal(): CalendarEvent[] {
  const raw = localStorage.getItem(LOCAL_KEY);
  if (!raw) return [];
  return JSON.parse(raw) as CalendarEvent[];
}

function writeLocal(events: CalendarEvent[]) {
  localStorage.setItem(LOCAL_KEY, JSON.stringify(events));
}

function sortEvents(events: CalendarEvent[]) {
  return [...events].sort((a, b) =>
    `${a.eventDate} ${a.startTime}`.localeCompare(`${b.eventDate} ${b.startTime}`),
  );
}

export async function getCalendarEvents() {
  try {
    return await request<CalendarEvent[]>(CALENDAR_API_URL);
  } catch {
    return sortEvents(readLocal());
  }
}

export async function createCalendarEvent(payload: CalendarEventPayload) {
  try {
    return await request<CalendarEvent>(CALENDAR_API_URL, {
      method: "POST",
      headers: jsonHeaders,
      body: JSON.stringify(payload),
    });
  } catch {
    const event: CalendarEvent = {
      eventId: Date.now(),
      ...payload,
      createdAt: now(),
      updatedAt: now(),
    };
    const events = sortEvents([...readLocal(), event]);
    writeLocal(events);
    return event;
  }
}

export async function updateCalendarEvent(
  eventId: number,
  payload: CalendarEventPayload,
) {
  try {
    return await request<CalendarEvent>(`${CALENDAR_API_URL}/${eventId}`, {
      method: "PUT",
      headers: jsonHeaders,
      body: JSON.stringify(payload),
    });
  } catch {
    const events = readLocal().map((event) =>
      event.eventId === eventId ? { ...event, ...payload, updatedAt: now() } : event,
    );
    writeLocal(sortEvents(events));
    const updated = events.find((event) => event.eventId === eventId);
    if (!updated) throw new Error("Calendar event was not found.");
    return updated;
  }
}

export async function deleteCalendarEvent(eventId: number) {
  try {
    await request<void>(`${CALENDAR_API_URL}/${eventId}`, { method: "DELETE" });
  } catch {
    writeLocal(readLocal().filter((event) => event.eventId !== eventId));
  }
}
