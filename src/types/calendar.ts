/**
*
* 파일명 : calendar.ts
* 역할 : 캘린더 일정 데이터와 입력값의 TypeScript 타입을 정의하는 파일
* 생성일 : 2026-09-17
*
**/

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
