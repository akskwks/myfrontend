export type CalendarEvent = {
  eventId: number;
  eventTitle: string;
  eventDate: string;
  startTime: string;
  endTime: string;
  eventCatg: "personal" | "work" | "study" | "etc";
  color: string;
  event_dsc: string | null;
  createdAt: string;
  updatedAt: string;
};

export type CalendarEventPayload = Pick<
  CalendarEvent,
  "eventTitle" | "eventDate" | "startTime" | "endTime" | "eventCatg" | "color" | "event_dsc"
>;
