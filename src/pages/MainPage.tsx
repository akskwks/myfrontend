import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import {
  ArrowRight,
  Bot,
  BriefcaseBusiness,
  CalendarDays,
  NotebookPen,
  type LucideIcon,
} from "lucide-react";
import { getCalendarEvents } from "../api/calendarApi";
import { getConversations } from "../api/aichatApi";
import { getMemos } from "../api/memoApi";
import { getWorkProjects } from "../api/projectApi";
import heroImg from "../assets/hero.png";
import { AppShell } from "../components/AppShell";
import type { CalendarEvent } from "../types/calendar";
import type { AiConversation } from "../types/aichat";
import type { Memo, MemoSort } from "../types/memo";
import type { ProjectStatus, WorkProject } from "../types/projectList";

type FeatureKind = "calendar" | "project" | "memo" | "ai";

const features: {
  kind: FeatureKind;
  icon: LucideIcon;
  name: string;
  headline: string;
  description: string;
  highlights: string[];
  href: string;
}[] = [
  {
    kind: "calendar",
    icon: CalendarDays,
    name: "캘린더",
    headline: "일정을 한눈에",
    description:
      "예정된 일정을 날짜와 시간에 맞춰 정리하고, 중요한 하루를 놓치지 마세요.",
    highlights: ["월별 일정 조회", "시간별 일정 등록", "날짜별 상세 확인"],
    href: "#/calendar",
  },
  {
    kind: "project",
    icon: BriefcaseBusiness,
    name: "프로젝트",
    headline: "진행 중인 업무를 분명하게",
    description:
      "프로젝트별 업무 기록을 모아 진행 상태와 다음 작업을 살펴보세요.",
    highlights: ["프로젝트별 업무", "진행 상태 관리", "업무 기록과 첨부파일"],
    href: "#/works",
  },
  {
    kind: "memo",
    icon: NotebookPen,
    name: "메모",
    headline: "생각을 원하는 형태로",
    description:
      "아이디어부터 코드와 할 일까지, 하나의 문서에서 자유롭게 작성하세요.",
    highlights: ["서식 있는 편집", "코드와 체크리스트", "분류 및 검색"],
    href: "#/memos",
  },
  {
    kind: "ai",
    icon: Bot,
    name: "AI 챗봇",
    headline: "기록을 대화로 이어가세요",
    description:
      "질문을 주고받으며 일정과 프로젝트, 메모와 업무 기록을 활용하세요.",
    highlights: ["대화 내역 관리", "자연어로 기록 조회", "답변 이어가기"],
    href: "#/ai",
  },
];

type PreviewProps = {
  kind: FeatureKind;
  events: CalendarEvent[];
  projects: WorkProject[];
  memos: Memo[];
  conversations: AiConversation[];
  loading: boolean;
  error: string;
};

const memoLabels: Record<MemoSort, string> = {
  general: "일반",
  code: "코드",
  todo: "TODO",
  etc: "기타",
};

function FeaturePreview({
  kind,
  events,
  projects,
  memos,
  conversations,
  loading,
  error,
}: PreviewProps) {
  const status = loading ? "불러오는 중입니다." : error;

  if (kind === "calendar") {
    return (
      <div className="home-feature-preview">
        <div className="home-preview-heading">
          <span>등록된 일정</span>
          <CalendarDays size={17} aria-hidden="true" />
        </div>
        {status ? (
          <p className="home-preview-empty">{status}</p>
        ) : events.length ? (
          events.map((event) => (
            <a
              className="home-preview-row"
              href={`#/calendar?eventId=${event.eventId}`}
              key={event.eventId}
            >
              <span className="home-preview-primary">{event.eventTitle}</span>
              <time dateTime={`${event.eventDate}T${event.startTime}`}>
                {event.eventDate} {event.startTime.slice(0, 5)}
              </time>
            </a>
          ))
        ) : (
          <p className="home-preview-empty">등록된 일정이 없습니다.</p>
        )}
      </div>
    );
  }

  if (kind === "project") {
    return (
      <div className="home-feature-preview">
        <div className="home-preview-heading">
          <span>등록된 프로젝트</span>
          <BriefcaseBusiness size={17} aria-hidden="true" />
        </div>
        {status ? (
          <p className="home-preview-empty">{status}</p>
        ) : projects.length ? (
          projects.map((project) => (
            <a
              className="home-preview-row"
              href={`#/works/${project.projectId}`}
              key={project.projectId}
            >
              <span className="home-preview-primary">
                {project.projectName}
              </span>
              <small>{projectStatusLabels[project.projectStatus]}</small>
            </a>
          ))
        ) : (
          <p className="home-preview-empty">등록된 프로젝트가 없습니다.</p>
        )}
      </div>
    );
  }

  if (kind === "memo") {
    return (
      <div className="home-feature-preview">
        <div className="home-preview-heading">
          <span>최근 메모</span>
          <NotebookPen size={17} aria-hidden="true" />
        </div>
        {status ? (
          <p className="home-preview-empty">{status}</p>
        ) : memos.length ? (
          memos.map((memo) => (
            <a
              className="home-preview-row"
              href={`#/memos/${memo.memoId}`}
              key={memo.memoId}
            >
              <span className="home-preview-primary">{memo.memoTitle}</span>
              <small>{memoLabels[memo.memoSort]}</small>
            </a>
          ))
        ) : (
          <p className="home-preview-empty">등록된 메모가 없습니다.</p>
        )}
      </div>
    );
  }

  return (
    <div className="home-feature-preview">
      <div className="home-preview-heading">
        <span>최근 대화</span>
        <Bot size={17} aria-hidden="true" />
      </div>
      {status ? (
        <p className="home-preview-empty">{status}</p>
      ) : conversations.length ? (
        conversations.map((conversation) => (
          <a
            className="home-preview-row"
            href={`#/ai?conversationId=${conversation.conversationId}`}
            key={conversation.conversationId}
          >
            <span className="home-preview-primary">{conversation.title}</span>
            <small>{conversation.updatedAt.slice(0, 10)}</small>
          </a>
        ))
      ) : (
        <p className="home-preview-empty">저장된 대화가 없습니다.</p>
      )}
    </div>
  );
}

const projectStatusLabels: Record<ProjectStatus, string> = {
  planned: "예정",
  in_progress: "진행중",
  completed: "종료",
  on_hold: "보류",
};

function toDateText(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function MainPage() {
  const featureListRef = useRef<HTMLElement>(null);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [projects, setProjects] = useState<WorkProject[]>([]);
  const [memos, setMemos] = useState<Memo[]>([]);
  const [conversations, setConversations] = useState<AiConversation[]>([]);
  const [isLoadingEvents, setIsLoadingEvents] = useState(true);
  const [isLoadingProjects, setIsLoadingProjects] = useState(true);
  const [isLoadingMemos, setIsLoadingMemos] = useState(true);
  const [isLoadingConversations, setIsLoadingConversations] = useState(true);
  const [eventError, setEventError] = useState("");
  const [projectError, setProjectError] = useState("");
  const [memoError, setMemoError] = useState("");
  const [conversationError, setConversationError] = useState("");
  const today = toDateText(new Date());
  const previewEvents = useMemo(() => {
    const sorted = [...events].sort((a, b) =>
      `${a.eventDate} ${a.startTime}`.localeCompare(
        `${b.eventDate} ${b.startTime}`,
      ),
    );
    const upcoming = sorted.filter((event) => event.eventDate >= today);
    return (upcoming.length ? upcoming : sorted.reverse()).slice(0, 3);
  }, [events, today]);
  const previewProjects = useMemo(
    () =>
      [...projects]
        .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
        .slice(0, 3),
    [projects],
  );
  const previewMemos = useMemo(
    () =>
      [...memos]
        .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
        .slice(0, 3),
    [memos],
  );
  const previewConversations = useMemo(
    () =>
      [...conversations]
        .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
        .slice(0, 3),
    [conversations],
  );

  useEffect(() => {
    getCalendarEvents()
      .then(setEvents)
      .catch(() => {
        setEvents([]);
        setEventError("일정을 불러오지 못했습니다.");
      })
      .finally(() => setIsLoadingEvents(false));
  }, []);

  useEffect(() => {
    getMemos()
      .then(setMemos)
      .catch(() => setMemoError("메모를 불러오지 못했습니다."))
      .finally(() => setIsLoadingMemos(false));
  }, []);

  useEffect(() => {
    getConversations()
      .then(setConversations)
      .catch(() => setConversationError("대화 내역을 불러오지 못했습니다."))
      .finally(() => setIsLoadingConversations(false));
  }, []);

  useEffect(() => {
    getWorkProjects()
      .then(setProjects)
      .catch(() => {
        setProjects([]);
        setProjectError("프로젝트 목록을 불러오지 못했습니다.");
      })
      .finally(() => setIsLoadingProjects(false));
  }, []);

  useLayoutEffect(() => {
    const sections =
      featureListRef.current?.querySelectorAll<HTMLElement>(".home-feature");
    if (
      !sections?.length ||
      !window.IntersectionObserver ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.remove("is-pending");
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        });
      },
      {
        root: featureListRef.current?.closest(".app-main"),
        rootMargin: "0px 0px -8% 0px",
        threshold: 0.15,
      },
    );

    sections.forEach((section) => {
      section.classList.add("is-pending");
      observer.observe(section);
    });

    return () => {
      observer.disconnect();
      sections.forEach((section) => {
        section.classList.remove("is-pending", "is-visible");
      });
    };
  }, []);

  return (
    <AppShell active="main" className="home-page-content" scrollable>
      <section className="home-hero">
        <img className="home-hero-art" src={heroImg} alt="" />
        <div className="home-hero-copy">
          <p className="eyebrow">Personal AI workspace</p>
          <h1>MyApp AI Assistant</h1>
          <p>
            일정과 메모, 업무를 관리하고 한 문장의 질문으로 필요한 기록을 찾고
            정리하세요.
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

      <section
        className="home-features"
        aria-label="MyApp 주요 메뉴"
        ref={featureListRef}
      >
        {features.map(
          (
            { kind, icon: Icon, name, headline, description, highlights, href },
            index,
          ) => (
            <section
              className={`home-feature home-feature--${kind}`}
              key={kind}
              aria-labelledby={`feature-${kind}`}
            >
              <div className="home-feature-tab">
                <span className="home-feature-icon">
                  <Icon size={21} strokeWidth={1.9} aria-hidden="true" />
                </span>
                <h2 id={`feature-${kind}`}>{name}</h2>
              </div>
              <div className="home-feature-content">
                <div className="home-feature-body">
                  <h3 className="home-feature-headline">{headline}</h3>
                  <p className="home-feature-description">{description}</p>
                  <ul className="home-feature-highlights">
                    {highlights.map((highlight) => (
                      <li key={highlight}>{highlight}</li>
                    ))}
                  </ul>
                  <a className="home-feature-link" href={href}>
                    {name} 열기
                    <ArrowRight size={18} aria-hidden="true" />
                  </a>
                </div>
                <FeaturePreview
                  kind={kind}
                  events={previewEvents}
                  projects={previewProjects}
                  memos={previewMemos}
                  conversations={previewConversations}
                  loading={
                    {
                      calendar: isLoadingEvents,
                      project: isLoadingProjects,
                      memo: isLoadingMemos,
                      ai: isLoadingConversations,
                    }[kind]
                  }
                  error={
                    {
                      calendar: eventError,
                      project: projectError,
                      memo: memoError,
                      ai: conversationError,
                    }[kind]
                  }
                />
              </div>
            </section>
          ),
        )}
      </section>

      {/* <section
        className="home-bottom-grid"
        aria-label="오늘의 일정과 업무 및 프로젝트 관리"
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
            ) : eventError ? (
              <p className="home-empty-state is-error">{eventError}</p>
            ) : todayEvents.length === 0 ? (
              <p className="home-empty-state">오늘 등록된 일정이 없습니다.</p>
            ) : (
              todayEvents.map((event) => (
                <a
                  className="today-event"
                  href={`#/calendar?eventId=${event.eventId}`}
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

        <section className="home-projects" aria-labelledby="project-title">
          <div className="home-bottom-heading">
            <div>
              <p className="eyebrow">Projects</p>
              <h2 id="project-title">업무 및 프로젝트 관리</h2>
            </div>
            <a
              className="home-panel-link"
              href="#/works"
              title="프로젝트 관리 열기"
            >
              <BriefcaseBusiness size={19} aria-hidden="true" />
              <span className="sr-only">프로젝트 관리 열기</span>
            </a>
          </div>
          <div className="home-project-list" aria-live="polite">
            {isLoadingProjects ? (
              <p className="home-empty-state">프로젝트를 불러오고 있습니다.</p>
            ) : projectError ? (
              <p className="home-empty-state is-error">{projectError}</p>
            ) : projects.length === 0 ? (
              <p className="home-empty-state">등록된 프로젝트가 없습니다.</p>
            ) : (
              projects.map((project) => (
                <a
                  className="home-project-item"
                  href={`#/works/${project.projectId}`}
                  key={project.projectId}
                >
                  <div className="home-project-main">
                    <strong>{project.projectName}</strong>
                    <span>
                      {project.startDate} - {project.endDate}
                    </span>
                  </div>
                  <span
                    className={`environment-badge is-${project.workEnvironment}`}
                  >
                    {environmentLabels[project.workEnvironment]}
                  </span>
                  <span
                    className={`work-status-badge is-${project.projectStatus}`}
                  >
                    {projectStatusLabels[project.projectStatus]}
                  </span>
                </a>
              ))
            )}
          </div>
        </section>
      </section> */}
    </AppShell>
  );
}
