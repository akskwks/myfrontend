/**
*
* 파일명 : MainPage.tsx
* 역할 : 주요 기능 메뉴 카드를 보여주는 홈 화면
* 생성일 : 2026-09-17
*
**/

import { useLayoutEffect, useRef, type MouseEvent } from "react";
import {
  ArrowRight,
  Bot,
  BriefcaseBusiness,
  CalendarDays,
  NotebookPen,
  type LucideIcon,
} from "lucide-react";
import heroImg from "../assets/hero.png";
import { AppShell } from "../components/AppShell";

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

  const icon = event.currentTarget.querySelector<HTMLElement>(".home-feature-icon");
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

export function MainPage() {
  const featureListRef = useRef<HTMLElement>(null);

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
