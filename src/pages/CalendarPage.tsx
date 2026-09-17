import { useEffect, useMemo, useState, type FormEvent } from "react";
import {
  createCalendarEvent,
  deleteCalendarEvent,
  getCalendarEvents,
  updateCalendarEvent,
} from "../api/calendarApi";
import { Topbar } from "../components/Topbar";
import type { CalendarEvent, CalendarEventPayload } from "../types/calendar";

const categoryLabels: Record<CalendarEvent["eventCatg"], string> = {
  personal: "개인",
  work: "업무",
  study: "학습",
  etc: "기타",
};

const categoryColors = [
  "red",
  "orange",
  "yellow",
  "green",
  "blue",
  "purple",
  "brown",
  "black",
];

const todayText = toDateText(new Date());

const emptyPayload = (date = todayText): CalendarEventPayload => ({
  eventTitle: "",
  eventDate: date,
  startTime: "09:00",
  endTime: "10:00",
  eventCatg: "personal",
  color: categoryColors[0],
  event_dsc: "",
});

function toDateText(date: Date) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getMonthDays(monthDate: Date) {
  const year = monthDate.getFullYear();
  const month = monthDate.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const lastDate = new Date(year, month + 1, 0).getDate();
  return [
    ...Array.from({ length: firstDay }, () => null),
    ...Array.from(
      { length: lastDate },
      (_, index) => new Date(year, month, index + 1),
    ),
  ];
}

export function CalendarPage() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [monthDate, setMonthDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(todayText);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [payload, setPayload] = useState<CalendarEventPayload>(emptyPayload());
  const [message, setMessage] = useState("일정을 불러오고 있습니다.");

  const monthDays = useMemo(() => getMonthDays(monthDate), [monthDate]);
  const monthLabel = new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "long",
  }).format(monthDate);
  const selectedEvents = events.filter(
    (event) => event.eventDate === selectedDate,
  );

  async function loadEvents() {
    const items = await getCalendarEvents();
    setEvents(items);
    setMessage(`${items.length}개의 일정을 관리 중입니다.`);
  }

  useEffect(() => {
    loadEvents();
  }, []);

  function changeMonth(amount: number) {
    setMonthDate(
      (current) =>
        new Date(current.getFullYear(), current.getMonth() + amount, 1),
    );
  }

  function selectDate(date: string) {
    setSelectedDate(date);
    setEditingId(null);
    setPayload(emptyPayload(date));
  }

  function startEdit(event: CalendarEvent) {
    setSelectedDate(event.eventDate);
    setEditingId(event.eventId);
    setPayload({
      eventTitle: event.eventTitle,
      eventDate: event.eventDate,
      startTime: event.startTime,
      endTime: event.endTime,
      eventCatg: event.eventCatg,
      color: event.color,
      event_dsc: event.event_dsc,
    });
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (editingId) await updateCalendarEvent(editingId, payload);
    else await createCalendarEvent(payload);
    setEditingId(null);
    setPayload(emptyPayload(payload.eventDate));
    await loadEvents();
  }

  async function remove(eventId: number) {
    if (!window.confirm("이 일정을 삭제할까요?")) return;
    await deleteCalendarEvent(eventId);
    if (editingId === eventId) {
      setEditingId(null);
      setPayload(emptyPayload(selectedDate));
    }
    await loadEvents();
  }

  return (
    <main className="shell">
      <Topbar active="calendar" />
      <header className="page-header compact-header">
        <div>
          <p className="eyebrow">Calendar</p>
          <h1>캘린더</h1>
          <p>일정을 날짜별로 정리하세요.</p>
        </div>
        <a className="secondary-button" href="#/memos">
          메모장으로 이동
        </a>
      </header>

      <section className="planner-layout">
        <div className="calendar-panel">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Monthly view</p>
              <h2>{monthLabel}</h2>
            </div>
            <div className="button-group">
              <button
                className="icon-button"
                type="button"
                onClick={() => changeMonth(-1)}
                title="이전 달"
              >
                ‹
              </button>
              <button
                className="icon-button"
                type="button"
                onClick={() => changeMonth(1)}
                title="다음 달"
              >
                ›
              </button>
            </div>
          </div>
          <div className="weekday-grid">
            {["일", "월", "화", "수", "목", "금", "토"].map((day) => (
              <span key={day}>{day}</span>
            ))}
          </div>
          <div className="month-grid" aria-label="월별 캘린더">
            {monthDays.map((day, index) => {
              const dateText = day ? toDateText(day) : "";
              const dayEvents = events.filter(
                (item) => item.eventDate === dateText,
              );
              return day ? (
                <button
                  className={`calendar-day ${dateText === selectedDate ? "is-selected" : ""}`}
                  key={dateText}
                  type="button"
                  onClick={() => selectDate(dateText)}
                >
                  <span>{day.getDate()}</span>
                  <div>
                    {dayEvents.slice(0, 3).map((item) => (
                      <i
                        key={item.eventId}
                        style={{ background: item.color }}
                      />
                    ))}
                  </div>
                </button>
              ) : (
                <span
                  className="calendar-day is-empty"
                  key={`empty-${index}`}
                />
              );
            })}
          </div>
          <p className="status-text">{message}</p>
        </div>

        <aside className="editor-panel">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Selected day</p>
              <h2>{selectedDate}</h2>
            </div>
            {editingId && (
              <button
                className="secondary-button compact"
                type="button"
                onClick={() => {
                  setEditingId(null);
                  setPayload(emptyPayload(selectedDate));
                }}
              >
                새 일정
              </button>
            )}
          </div>

          <div className="event-list">
            {selectedEvents.length ? (
              selectedEvents.map((event) => (
                <article className="event-card" key={event.eventId}>
                  <span style={{ background: event.color }} />
                  <div>
                    <strong>{event.eventTitle}</strong>
                    {event.event_dsc?.trim() && (
                      <em className="event-description">{event.event_dsc}</em>
                    )}
                    <p>
                      {event.startTime} - {event.endTime} ·{" "}
                      {categoryLabels[event.eventCatg]}
                    </p>
                  </div>
                  <div className="card-actions">
                    <button type="button" onClick={() => startEdit(event)}>
                      수정
                    </button>
                    <button
                      className="danger-button"
                      type="button"
                      onClick={() => remove(event.eventId)}
                    >
                      삭제
                    </button>
                  </div>
                </article>
              ))
            ) : (
              <div className="empty-state">
                <h3>선택한 날짜에 일정이 없습니다.</h3>
                <p>아래 입력 영역에서 새 일정을 등록하세요.</p>
              </div>
            )}
          </div>

          <form className="stack-form" onSubmit={save}>
            <label>
              제목
              <input
                required
                maxLength={80}
                value={payload.eventTitle}
                onChange={(event) =>
                  setPayload({ ...payload, eventTitle: event.target.value })
                }
                placeholder="프로젝트 회의"
              />
            </label>
            <div className="form-grid">
              <label>
                날짜
                <input
                  required
                  type="date"
                  value={payload.eventDate}
                  onChange={(event) =>
                    setPayload({ ...payload, eventDate: event.target.value })
                  }
                />
              </label>
              <label>
                분류
                <select
                  value={payload.eventCatg}
                  onChange={(event) =>
                    setPayload({
                      ...payload,
                      eventCatg: event.target
                        .value as CalendarEvent["eventCatg"],
                    })
                  }
                >
                  {Object.entries(categoryLabels).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <div className="form-grid">
              <label>
                시작
                <input
                  required
                  type="time"
                  value={payload.startTime}
                  onChange={(event) =>
                    setPayload({ ...payload, startTime: event.target.value })
                  }
                />
              </label>
              <label>
                종료
                <input
                  required
                  type="time"
                  value={payload.endTime}
                  onChange={(event) =>
                    setPayload({ ...payload, endTime: event.target.value })
                  }
                />
              </label>
            </div>
            <div className="color-row">
              {categoryColors.map((color) => (
                <button
                  className={payload.color === color ? "is-selected" : ""}
                  key={color}
                  type="button"
                  style={{ background: color }}
                  onClick={() => setPayload({ ...payload, color })}
                  title={color}
                />
              ))}
            </div>
            <label>
              설명
              <textarea
                rows={4}
                value={payload.event_dsc ?? ""}
                onChange={(event) =>
                  setPayload({ ...payload, event_dsc: event.target.value })
                }
                placeholder="장소, 준비물, 참고 사항"
              />
            </label>
            <button className="primary-button" type="submit">
              {editingId ? "일정 수정" : "일정 등록"}
            </button>
          </form>
        </aside>
      </section>
    </main>
  );
}
