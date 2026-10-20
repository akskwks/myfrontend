/**
 *
 * 파일명 : MainPage.tsx
 * 역할 : 주요 기능 메뉴 카드를 보여주는 홈 화면
 * 생성일 : 2026-09-17
 *
 **/

import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type MouseEvent,
} from "react";
import {
  ArrowRight,
  Bot,
  BriefcaseBusiness,
  CalendarDays,
  NotebookPen,
  type LucideIcon,
} from "lucide-react";
import heroImg from "../assets/hero.png";
import { getCalendarEvents } from "../api/calendarApi";
import { getWorkProjects } from "../api/projectApi";
import { AppShell } from "../components/AppShell";
import type { CalendarEvent } from "../types/calendar";
import type { WorkProject } from "../types/projectList";

type FeatureKind = "calendar" | "project" | "memo" | "ai";

const features: {
  kind: FeatureKind;
  icon: LucideIcon;
  name: string;
  description: string;
  href: string;
}[] = [
  {
    kind: "calendar",
    icon: CalendarDays,
    name: "캘린더",
    description: "일정을 날짜별로 확인하고 관리하세요.",
    href: "#/calendar",
  },
  {
    kind: "project",
    icon: BriefcaseBusiness,
    name: "프로젝트",
    description: "프로젝트와 업무 진행 상황을 한눈에 확인하세요.",
    href: "#/works",
  },
  {
    kind: "memo",
    icon: NotebookPen,
    name: "메모",
    description: "생각과 할 일을 자유롭게 기록하세요.",
    href: "#/memos",
  },
  {
    kind: "ai",
    icon: Bot,
    name: "AI 챗봇",
    description: "질문하고 내 기록을 바탕으로 답변받으세요.",
    href: "#/ai",
  },
];

function shakeFeatureIcon(event: MouseEvent<HTMLAnchorElement>) {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  const icon =
    event.currentTarget.querySelector<HTMLElement>(".home-feature-icon");
  if (!icon) return;

  icon.getAnimations().forEach((animation) => animation.cancel());
  icon.animate(
    [
      { transform: "rotate(0deg)", offset: 0 },
      { transform: "rotate(-10deg)", offset: 0.16 },
      { transform: "rotate(10deg)", offset: 0.36 },
      { transform: "rotate(-7deg)", offset: 0.56 },
      { transform: "rotate(5deg)", offset: 0.74 },
      { transform: "rotate(-2deg)", offset: 0.88 },
      { transform: "rotate(0deg)", offset: 1 },
    ],
    { duration: 650, easing: "ease-in-out" },
  );
}

function dateKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function recentDates() {
  const today = new Date();
  return Array.from({ length: 5 }, (_, index) =>
    dateKey(
      new Date(
        today.getFullYear(),
        today.getMonth(),
        today.getDate() - 4 + index,
      ),
    ),
  );
}

function CalendarTrend({
  dates,
  events,
}: {
  dates: string[];
  events: CalendarEvent[];
}) {
  const [activePoint, setActivePoint] = useState<number | null>(null);
  const counts = dates.map(
    (date) => events.filter((event) => event.eventDate === date).length,
  );
  const maximum = Math.max(1, ...counts);
  const left = 68;
  const right = 520;
  const top = 24;
  const height = 146;
  const points = counts.map((count, index) => ({
    x: left + (index * (right - left)) / (counts.length - 1),
    y: top + height - (count / maximum) * height,
  }));

  return (
    <div className="home-trend-chart">
      <svg
        viewBox="0 0 548 214"
        role="img"
        aria-label="최근 5일간 일별 일정 개수"
      >
        {[0, maximum].map((tick) => {
          const y = top + height - (tick / maximum) * height;
          return (
            <g key={tick}>
              <line
                className="home-chart-grid"
                x1={left}
                x2={right}
                y1={y}
                y2={y}
              />
              <text
                className="home-chart-axis"
                x="34"
                y={y + 4}
                textAnchor="end"
              >
                {tick}
              </text>
            </g>
          );
        })}
        <polyline
          className="home-chart-line"
          points={points.map(({ x, y }) => `${x},${y}`).join(" ")}
        />
        {points.map(({ x, y }, index) => (
          <g
            className="home-chart-point"
            key={dates[index]}
            tabIndex={0}
            role="img"
            aria-label={`${dates[index]}, 일정 ${counts[index]}개`}
            onMouseEnter={() => setActivePoint(index)}
            onMouseLeave={() => setActivePoint(null)}
            onFocus={() => setActivePoint(index)}
            onBlur={() => setActivePoint(null)}
          >
            <circle className="home-chart-hit" cx={x} cy={y} r="19" />
            <circle className="home-chart-dot" cx={x} cy={y} r="6" />
            <text className="home-chart-axis" x={x} y="198" textAnchor="middle">
              {dates[index].slice(5)}
            </text>
          </g>
        ))}
        {activePoint !== null &&
          (() => {
            const { x, y } = points[activePoint];
            const tooltipX = Math.min(438, Math.max(0, x - 48));
            const tooltipY = y < 68 ? y + 14 : y - 57;
            return (
              <g className="home-chart-tooltip" aria-hidden="true">
                <rect x={tooltipX} y={tooltipY} width="76" height="43" rx="7" />
                <text x={tooltipX + 10} y={tooltipY + 17}>
                  {dates[activePoint].slice(5)}
                </text>
                <text x={tooltipX + 10} y={tooltipY + 34}>
                  {counts[activePoint]}개
                </text>
              </g>
            );
          })()}
      </svg>
    </div>
  );
}

export function MainPage() {
  const featureListRef = useRef<HTMLElement>(null);
  const [dates] = useState(recentDates);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [projects, setProjects] = useState<WorkProject[]>([]);
  const [eventsLoading, setEventsLoading] = useState(true);
  const [projectsLoading, setProjectsLoading] = useState(true);
  const [eventsError, setEventsError] = useState(false);
  const [projectsError, setProjectsError] = useState(false);

  useEffect(() => {
    let active = true;
    getCalendarEvents()
      .then((result) => {
        if (active) setEvents(result);
      })
      .catch(() => {
        if (active) setEventsError(true);
      })
      .finally(() => {
        if (active) setEventsLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;
    getWorkProjects()
      .then((result) => {
        if (active)
          setProjects(
            result.filter((project) => project.projectStatus === "in_progress"),
          );
      })
      .catch(() => {
        if (active) setProjectsError(true);
      })
      .finally(() => {
        if (active) setProjectsLoading(false);
      });
    return () => {
      active = false;
    };
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
        {features.map(({ kind, icon: Icon, name, description, href }) => (
          <article
            className={`home-feature home-feature--${kind}`}
            key={kind}
            aria-labelledby={`feature-${kind}`}
          >
            <a
              className="home-feature-main"
              href={href}
              aria-label={`${name}: ${description}`}
              onMouseEnter={shakeFeatureIcon}
              onMouseLeave={shakeFeatureIcon}
            >
              <span className="home-feature-flip">
                <span className="home-feature-face home-feature-front">
                  <h2 className="home-feature-title" id={`feature-${kind}`}>
                    {name}
                  </h2>
                  <span className="home-feature-icon">
                    <Icon size={70} strokeWidth={1.7} aria-hidden="true" />
                  </span>
                </span>
                <span
                  className="home-feature-face home-feature-back"
                  aria-hidden="true"
                >
                  <span className="home-feature-title">{name}</span>
                  <span>{description}</span>
                </span>
              </span>
            </a>
          </article>
        ))}
      </section>

      <section className="home-overview" aria-label="일정 및 프로젝트 현황">
        <section
          className="home-overview-panel home-overview-calendar"
          aria-labelledby="trend-title"
        >
          <div className="home-overview-heading">
            <span className="home-overview-icon">
              <CalendarDays size={23} aria-hidden="true" />
            </span>
            <div>
              <h2 id="trend-title">최근 일정 현황</h2>
              <p>최근 5일간의 일정</p>
            </div>
          </div>
          {eventsLoading ? (
            <p className="home-overview-state">
              일정 현황을 불러오는 중입니다.
            </p>
          ) : eventsError ? (
            <p className="home-overview-state is-error">
              일정 현황을 불러오지 못했습니다.
            </p>
          ) : (
            <CalendarTrend dates={dates} events={events} />
          )}
        </section>

        <section
          className="home-overview-panel home-overview-projects"
          aria-labelledby="active-projects-title"
        >
          <div className="home-overview-heading">
            <span className="home-overview-icon">
              <BriefcaseBusiness size={23} aria-hidden="true" />
            </span>
            <div>
              <h2 id="active-projects-title">진행 중인 프로젝트</h2>
              <p>현재 진행 중인 프로젝트</p>
            </div>
          </div>
          <div className="home-active-project-list" aria-live="polite">
            {projectsLoading ? (
              <p className="home-overview-state">
                프로젝트를 불러오는 중입니다.
              </p>
            ) : projectsError ? (
              <p className="home-overview-state is-error">
                프로젝트를 불러오지 못했습니다.
              </p>
            ) : projects.length === 0 ? (
              <p className="home-overview-state">
                현재 진행 중인 프로젝트가 없습니다.
              </p>
            ) : (
              projects.map((project) => (
                <a
                  className="home-active-project"
                  href={`#/works/${project.projectId}`}
                  key={project.projectId}
                >
                  <span className="home-active-project-info">
                    <strong>{project.projectName}</strong>
                    <span>
                      {project.startDate} ~ {project.endDate}
                    </span>
                  </span>
                  {/* <span className="home-active-project-status">진행중</span> */}
                  <ArrowRight size={22} aria-hidden="true" />
                </a>
              ))
            )}
          </div>
        </section>
      </section>
    </AppShell>
  );
}
