import { useEffect, useState } from "react";
import { getCalendarEvents } from "../api/calendarApi";
import { getMemos } from "../api/memoApi";
import heroImg from "../assets/hero.png";
import { Topbar } from "../components/Topbar";

type Metrics = {
  schedules: number;
  today: number;
  memos: number;
};

export function MainPage() {
  const [metrics, setMetrics] = useState<Metrics | null>(null);

  useEffect(() => {
    let active = true;

    Promise.all([getCalendarEvents(), getMemos()])
      .then(([events, memos]) => {
        if (!active) return;
        const today = new Date().toISOString().slice(0, 10);
        setMetrics({
          schedules: events.length,
          today: events.filter((event) => event.eventDate === today).length,
          memos: memos.length,
        });
      })
      .catch(() => {
        if (active) setMetrics({ schedules: 0, today: 0, memos: 0 });
      });

    return () => {
      active = false;
    };
  }, []);

  return (
    <main className="shell">
      <Topbar active="main" />

      <section className="hero-section" id="top">
        <div className="hero-copy">
          <p className="eyebrow">Personal AI workspace</p>
          <h1>개발중</h1>
          <p className="hero-text">
            MyApp은 개인 생산성을 위한 캘린더와 메모장, Ollama 기반 AI 챗봇을
            함께 다루는 작업 공간입니다.
          </p>
          <div className="hero-actions">
            <a className="primary-button" href="#/calendar">
              일정 관리
            </a>
            <a className="secondary-button" href="#/memos">
              메모 작성
            </a>
          </div>
        </div>

        <aside className="hero-panel" aria-label="MyApp 요약">
          <div className="panel-header">
            <div>
              <span className="panel-kicker">Today</span>
              <h2>생산성 허브</h2>
            </div>
            <span className="live-pill">Ready</span>
          </div>
          <img className="hero-image" src={heroImg} alt="생산성 앱 일러스트" />
          <div className="task-list">
            <article className="task-item is-active">
              <span className="task-dot" />
              <div>
                <h3>오늘 일정 확인</h3>
                <p>날짜별 일정을 확인하고 새 계획을 바로 추가하세요.</p>
              </div>
            </article>
            <article className="task-item">
              <span className="task-dot" />
              <div>
                <h3>기록과 대화</h3>
                <p>업무 메모와 코드 메모를 남기고 AI에게 질문하세요.</p>
              </div>
            </article>
          </div>
        </aside>
      </section>

      <section className="metrics" aria-label="MyApp 현황">
        <div>
          <strong>{metrics?.schedules ?? "-"}</strong>
          <span>전체 일정</span>
        </div>
        <div>
          <strong>{metrics?.today ?? "-"}</strong>
          <span>오늘 일정</span>
        </div>
        <div>
          <strong>{metrics?.memos ?? "-"}</strong>
          <span>저장 메모</span>
        </div>
      </section>

      <section className="workflow" id="workflow">
        <div>
          <p className="eyebrow">Simple workflow</p>
          <h2>오늘 할 일과 생각을 가볍게 정리합니다.</h2>
        </div>
        <ol className="steps">
          <li>
            <span>계획</span>
            <p>캘린더에 일정과 시간을 등록합니다.</p>
          </li>
          <li>
            <span>기록</span>
            <p>상황에 맞는 템플릿으로 메모를 남깁니다.</p>
          </li>
          <li>
            <span>질문</span>
            <p>필요할 때 로컬 AI 챗봇으로 생각을 정리합니다.</p>
          </li>
        </ol>
      </section>
    </main>
  );
}
