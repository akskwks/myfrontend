import {
  ArrowRight,
  Bot,
  CalendarPlus,
  FileSearch,
  NotebookPen,
} from "lucide-react";
import heroImg from "../assets/hero.png";
import { AppShell } from "../components/AppShell";

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
      "업무, 코드, TODO 메모에서 필요한 기록을 찾고 핵심만 정리합니다.",
  },
  {
    icon: NotebookPen,
    title: "대화와 기록 연결",
    description: "저장된 대화를 이어가며 일정과 메모를 한 흐름에서 관리합니다.",
  },
];

const examples = [
  "오늘 일정 알려줘",
  "내일 오후 3시에 회의 일정 추가해줘",
  "이번 주 업무 메모 요약해줘",
];

export function MainPage() {
  return (
    <AppShell active="main" className="home-page-content" scrollable>
      <section className="home-hero">
        <img className="home-hero-art" src={heroImg} alt="" />
        <div className="home-hero-copy">
          <p className="eyebrow">Personal AI workspace</p>
          <h1>MyApp AI Assistant</h1>
          <p>
            일정과 메모를 관리하고, 한 문장의 질문으로 필요한 기록을 찾고
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

      <section className="home-capabilities" aria-labelledby="capability-title">
        <div className="home-section-heading">
          <div>
            <p className="eyebrow">Connected tools</p>
            <h2 id="capability-title">대화만으로 MyApp을 사용하세요</h2>
          </div>
          <p>AI가 캘린더와 메모에서 저장된 내용을 통해 요청을 처리합니다.</p>
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

      <section className="home-examples" aria-labelledby="example-title">
        <div>
          <p className="eyebrow">Try asking</p>
          <h2 id="example-title">이렇게 요청해 보세요</h2>
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
    </AppShell>
  );
}
