import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  Bot,
  BriefcaseBusiness,
  CalendarClock,
  CalendarPlus,
  FileSearch,
} from "lucide-react";
import { getCalendarEvents } from "../api/calendarApi";
import heroImg from "../assets/hero.png";
import { AppShell } from "../components/AppShell";
import type { CalendarEvent } from "../types/calendar";

const capabilities = [
  {
    icon: CalendarPlus,
    title: "일정 조회와 등록",
    description:
      "날짜와 시간을 말하면 일정을 확인하거나 캘린더에 바로 추가합니다.",
  },
  {
    icon: FileSearch,
    title: "메모 검색과 요약",
    description:
      "일반, 코드, TODO 메모에서 필요한 기록을 찾고 핵심만 정리합니다.",
  },
  {
    icon: BriefcaseBusiness,
    title: "업무 진행 관리",
    description: "수행 업무의 상태와 진행률을 날짜별로 기록하고 확인합니다.",
  },
  {
    icon: Bot,
    title: "AI 통합 활용",
    description: "캘린더, 메모, 업무 데이터를 대화 한 흐름에서 활용합니다.",
  },
];

const examples = [
  "오늘 일정 알려줘",
  "내일 오후 3시에 회의 일정 추가해줘",
  "이번 주 업무 정리해줘",
  "Docker 관련 메모 찾아줘",
];

const categoryLabels: Record<CalendarEvent["eventCatg"], string> = {
  personal: "일반",
  work: "업무",
  study: "학습",
  etc: "기타",
};

function toDateText(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function MainPage() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [isLoadingEvents, setIsLoadingEvents] = useState(true);
  const today = toDateText(new Date());
  const todayEvents = useMemo(
    () =>
      events
        .filter((event) => event.eventDate === today)
        .sort((a, b) => a.startTime.localeCompare(b.startTime)),
    [events, today],
  );

  useEffect(() => {
    getCalendarEvents()
      .then(setEvents)
      .catch(() => setEvents([]))
      .finally(() => setIsLoadingEvents(false));
  }, []);

  return (
    <AppShell active="main" className="home-page-content" scrollable>
      <section className="home-hero">
        <img className="home-hero-art" src={heroImg} alt="" />
        <div className="home-hero-copy">
          <p className="eyebrow">Personal AI workspace</p>
          <h1>MyApp AI Assistant</h1>
          <p>
            일정과 메모, 업무를 관리하고 한 문장의 질문으로 필요한 기록을
            찾고 정리하세요.
          </p>
          <div className="hero-actions">
            <a className="primary-button" href="#/ai">
              <Bot size={18} aria-hidden="true" />
              AI 챗봇 시작
              <ArrowRight size={17} aria-hidden="true" />
            </a>
            <a className="home-secondary-action" href="#/calendar">
              캘린더 열기
            </a>
          </div>
        </div>

        <div className="home-chat-preview" aria-label="AI 챗봇 사용 예시">
          <div className="preview-message user">오늘 일정 알려줘</div>
          <div className="preview-message assistant">
            오늘은 오후 3시 프로젝트 회의가 있습니다.
          </div>
        </div>
      </section>

      <section className="home-capabilities" aria-labelledby="capability-title">
        <div className="home-section-heading">
          <div>
            <p className="eyebrow">Connected tools</p>
            <h2 id="capability-title">대화만으로 MyApp을 사용하세요</h2>
          </div>
          <p>AI가 캘린더, 메모, 업무에 저장된 내용을 통해 요청을 처리합니다.</p>
        </div>

        <div className="capability-grid">
          {capabilities.map(({ icon: Icon, title, description }) => (
            <article className="capability-card" key={title}>
              <span>
                <Icon size={21} aria-hidden="true" />
              </span>
              <h3>{title}</h3>
              <p>{description}</p>
            </article>
          ))}
        </div>
      </section>

      <section
        className="home-bottom-grid"
        aria-label="오늘의 일정과 AI 활용 예시"
      >
        <section className="home-today" aria-labelledby="today-title">
          <div className="home-bottom-heading">
            <div>
              <p className="eyebrow">Today</p>
              <h2 id="today-title">오늘의 일정</h2>
            </div>
            <a
              className="home-panel-link"
              href="#/calendar"
              title="캘린더 열기"
            >
              <CalendarClock size={19} aria-hidden="true" />
              <span className="sr-only">캘린더 열기</span>
            </a>
          </div>

          <div className="today-event-list">
            {isLoadingEvents ? (
              <p className="home-empty-state">오늘 일정을 불러오고 있습니다.</p>
            ) : todayEvents.length === 0 ? (
              <p className="home-empty-state">오늘 등록된 일정이 없습니다.</p>
            ) : (
              todayEvents.map((event) => (
                <a
                  className="today-event"
                  href="#/calendar"
                  key={event.eventId}
                >
                  <time dateTime={`${event.eventDate}T${event.startTime}`}>
                    {event.startTime.slice(0, 5)}
                  </time>
                  <span className="today-event-category">
                    {categoryLabels[event.eventCatg]}
                  </span>
                  <strong>{event.eventTitle}</strong>
                  <span
                    className="today-event-color"
                    style={{ backgroundColor: event.color }}
                    aria-hidden="true"
                  />
                </a>
              ))
            )}
          </div>
        </section>

        <section className="home-examples" aria-labelledby="example-title">
          <div className="home-bottom-heading">
            <div>
              <p className="eyebrow">Try asking</p>
              <h2 id="example-title">이렇게 요청해 보세요</h2>
            </div>
          </div>
          <div className="example-prompts">
            {examples.map((example) => (
              <a href="#/ai" key={example}>
                <span>{example}</span>
                <ArrowRight size={17} aria-hidden="true" />
              </a>
            ))}
          </div>
        </section>
      </section>
    </AppShell>
  );
}
