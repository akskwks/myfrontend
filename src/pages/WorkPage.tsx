import { useEffect, useMemo, useState } from "react";
import DatePicker, { registerLocale } from "react-datepicker";
import { ko } from "date-fns/locale";
import { CalendarDays, RotateCcw } from "lucide-react";
import { deleteWork, getWork, getWorks, updateWork } from "../api/workApi";
import { AppShell } from "../components/AppShell";
import { TiptapEditor } from "../components/TiptapEditor";
import type { Work, WorkPayload, WorkStatus } from "../types/work";
import {
  toDateText,
  toDateValue,
  WorkCreate,
  workStatusLabel,
  workStatusOptions,
} from "./WorkCreate";

registerLocale("ko", ko);

type WorkRoute = { mode: "list" | "new" | "detail"; workId: number | null };

function parseWorkRoute(): WorkRoute {
  const [path] = location.hash.slice(1).split("?");
  const parts = path.split("/").filter(Boolean);
  const workId = Number(parts[1]);
  if (parts[1] === "new") return { mode: "new", workId: null };
  if (Number.isFinite(workId)) return { mode: "detail", workId };
  return { mode: "list", workId: null };
}

function goToWork(path = "") {
  location.hash = path ? `#/works/${path}` : "#/works";
}

const pad = (value: number) => String(value).padStart(2, "0");

function formatUpdatedAt(value: string) {
  const date = new Date(value);
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function WorkPage() {
  const route = useMemo(parseWorkRoute, [location.hash]);

  return (
    <AppShell active="work" className="work-page-content">
      <header className="page-header compact-header">
        <div>
          <p className="eyebrow">Work</p>
          <h1>업무</h1>
          <p>수행 업무와 진행상황을 날짜별로 기록하고 관리합니다.</p>
        </div>
        <a className="secondary-button" href="#/memos">
          메모장으로 이동
        </a>
      </header>

      {route.mode === "list" && <WorkListView />}
      {route.mode === "new" && <WorkCreate />}
      {route.mode === "detail" && route.workId && (
        <WorkDetailView workId={route.workId} />
      )}
    </AppShell>
  );
}

function WorkListView() {
  const [works, setWorks] = useState<Work[]>([]);
  const [dateFilter, setDateFilter] = useState("");
  const [loading, setLoading] = useState(true);

  async function loadWorks(nextDate = dateFilter) {
    setLoading(true);
    try {
      setWorks(await getWorks(nextDate));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadWorks("");
  }, []);

  function changeDate(date: Date | null) {
    const nextDate = date ? toDateText(date) : "";
    setDateFilter(nextDate);
    loadWorks(nextDate);
  }

  return (
    <section className="work-list-panel work-page-panel">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Work list</p>
          <h2>업무 목록</h2>
        </div>
        <div className="work-page-actions">
          <span>{loading ? "불러오는 중..." : `${works.length}개의 업무`}</span>
          <button
            className="primary-button compact"
            type="button"
            onClick={() => goToWork("new")}
          >
            업무 등록
          </button>
        </div>
      </div>

      <div className="work-list-tools">
        <label>
          조회 날짜
          <div className="date-picker-control">
            <CalendarDays size={17} aria-hidden="true" />
            <DatePicker
              selected={dateFilter ? toDateValue(dateFilter) : null}
              onChange={changeDate}
              locale="ko"
              dateFormat="yyyy-MM-dd"
              calendarStartDay={0}
              showMonthDropdown
              showYearDropdown
              dropdownMode="select"
              todayButton="오늘"
              placeholderText="전체 날짜"
              showPopperArrow={false}
              className="date-picker-input"
              calendarClassName="myapp-date-picker"
              aria-label="업무 조회 날짜"
            />
          </div>
        </label>
        <button
          className="icon-button"
          type="button"
          title="날짜 필터 초기화"
          aria-label="날짜 필터 초기화"
          disabled={!dateFilter}
          onClick={() => changeDate(null)}
        >
          <RotateCcw size={17} aria-hidden="true" />
        </button>
      </div>

      <div className="work-board-wrap" aria-live="polite">
        {!loading && works.length === 0 ? (
          <div className="empty-state">
            <h3>표시할 업무가 없습니다.</h3>
            <p>업무 등록 버튼을 눌러 첫 업무 기록을 작성하세요.</p>
          </div>
        ) : (
          <table className="work-board-table">
            <thead>
              <tr>
                <th scope="col">업무일자</th>
                <th scope="col">진행 상태</th>
                <th scope="col">업무 제목</th>
                <th scope="col">진행률</th>
                <th scope="col">수정일</th>
              </tr>
            </thead>
            <tbody>
              {works.map((work) => (
                <tr
                  key={work.workId}
                  tabIndex={0}
                  onClick={() => goToWork(String(work.workId))}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      goToWork(String(work.workId));
                    }
                  }}
                >
                  <td>{work.workDate}</td>
                  <td>
                    <span className={`work-status-badge is-${work.workStatus}`}>
                      {workStatusLabel(work.workStatus)}
                    </span>
                  </td>
                  <td className="work-board-title">{work.workTitle}</td>
                  <td>
                    <div className="work-progress-compact">
                      <span>
                        <i style={{ width: `${work.workProgress}%` }} />
                      </span>
                      <b>{work.workProgress}%</b>
                    </div>
                  </td>
                  <td>{formatUpdatedAt(work.updatedAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </section>
  );
}

function WorkDetailView({ workId }: { workId: number }) {
  const [work, setWork] = useState<Work | null>(null);
  const [draft, setDraft] = useState<WorkPayload | null>(null);
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getWork(workId)
      .then((item) => {
        setWork(item);
        setDraft(toPayload(item));
      })
      .catch(() => setError("업무를 불러오지 못했습니다."));
  }, [workId]);

  function toPayload(item: Work): WorkPayload {
    return {
      workDate: item.workDate,
      workTitle: item.workTitle,
      workCnnt: item.workCnnt,
      workStatus: item.workStatus,
      workProgress: item.workProgress,
    };
  }

  function startEdit() {
    if (!work) return;
    setDraft(toPayload(work));
    setError("");
    setEditing(true);
  }

  function cancelEdit() {
    if (!work) return;
    setDraft(toPayload(work));
    setError("");
    setEditing(false);
  }

  async function saveEdit() {
    if (!draft || !draft.workTitle.trim()) {
      setError("업무 제목을 입력하세요.");
      return;
    }

    setSaving(true);
    setError("");
    try {
      const saved = await updateWork(workId, {
        ...draft,
        workTitle: draft.workTitle.trim(),
      });
      setWork(saved);
      setDraft(toPayload(saved));
      setEditing(false);
    } catch {
      setError("업무를 저장하지 못했습니다.");
    } finally {
      setSaving(false);
    }
  }

  async function remove() {
    if (!window.confirm("이 업무 기록을 삭제할까요?")) return;
    await deleteWork(workId);
    goToWork();
  }

  if (error && !work) {
    return (
      <section className="work-detail-panel">
        <p className="form-error" role="alert">{error}</p>
        <button className="secondary-button" type="button" onClick={() => goToWork()}>
          목록으로
        </button>
      </section>
    );
  }

  if (!work || !draft) {
    return (
      <section className="work-detail-panel">
        <p className="status-text">업무를 불러오고 있습니다.</p>
      </section>
    );
  }

  return (
    <section className="work-detail-panel">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Work detail</p>
          {editing ? (
            <input
              className="work-title-input"
              maxLength={100}
              value={draft.workTitle}
              onChange={(event) =>
                setDraft({ ...draft, workTitle: event.target.value })
              }
              aria-label="업무 제목"
            />
          ) : (
            <h2>{work.workTitle}</h2>
          )}
        </div>
        <div className="button-group">
          <button className="secondary-button compact" type="button" onClick={() => goToWork()}>
            목록
          </button>
          {editing ? (
            <>
              <button className="primary-button compact" type="button" disabled={saving} onClick={saveEdit}>
                {saving ? "저장 중..." : "저장"}
              </button>
              <button className="secondary-button compact" type="button" onClick={cancelEdit}>
                취소
              </button>
            </>
          ) : (
            <>
              <button className="secondary-button compact" type="button" onClick={startEdit}>
                수정
              </button>
              <button className="secondary-button compact danger-text" type="button" onClick={remove}>
                삭제
              </button>
            </>
          )}
        </div>
      </div>

      <dl className="work-detail-meta">
        <div>
          <dt>업무일자</dt>
          <dd>
            {editing ? (
              <div className="date-picker-control">
                <CalendarDays size={17} aria-hidden="true" />
                <DatePicker
                  selected={toDateValue(draft.workDate)}
                  onChange={(date: Date | null) =>
                    date && setDraft({ ...draft, workDate: toDateText(date) })
                  }
                  locale="ko"
                  dateFormat="yyyy-MM-dd"
                  calendarStartDay={0}
                  showMonthDropdown
                  showYearDropdown
                  dropdownMode="select"
                  todayButton="오늘"
                  showPopperArrow={false}
                  className="date-picker-input"
                  calendarClassName="myapp-date-picker"
                  aria-label="업무일자"
                />
              </div>
            ) : work.workDate}
          </dd>
        </div>
        <div>
          <dt>진행 상태</dt>
          <dd>
            {editing ? (
              <select
                value={draft.workStatus}
                onChange={(event) =>
                  setDraft({ ...draft, workStatus: event.target.value as WorkStatus })
                }
              >
                {workStatusOptions.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            ) : (
              <span className={`work-status-badge is-${work.workStatus}`}>
                {workStatusLabel(work.workStatus)}
              </span>
            )}
          </dd>
        </div>
        <div>
          <dt>진행률</dt>
          <dd>
            {editing ? (
              <label className="work-progress-field compact-progress">
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  value={draft.workProgress}
                  onChange={(event) =>
                    setDraft({ ...draft, workProgress: Number(event.target.value) })
                  }
                />
                <output>{draft.workProgress}%</output>
              </label>
            ) : (
              <div className="work-progress-detail">
                <span><i style={{ width: `${work.workProgress}%` }} /></span>
                <b>{work.workProgress}%</b>
              </div>
            )}
          </dd>
        </div>
        <div>
          <dt>수정일</dt>
          <dd>{formatUpdatedAt(work.updatedAt)}</dd>
        </div>
      </dl>

      <TiptapEditor
        content={draft.workCnnt || "<p></p>"}
        editable={editing}
        onChange={(workCnnt) => setDraft({ ...draft, workCnnt })}
      />
      <div className="work-save-status" aria-live="polite">
        {error && <p className="form-error" role="alert">{error}</p>}
      </div>
    </section>
  );
}
