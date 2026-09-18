import { useEffect, useMemo, useState } from "react";
import DatePicker, { registerLocale } from "react-datepicker";
import { ko } from "date-fns/locale";
import { CalendarDays, ChevronLeft, RotateCcw } from "lucide-react";
import { deleteWork, getWork, getWorks, updateWork } from "../api/workApi";
import { getWorkProject } from "../api/projectApi";
import { AppShell } from "../components/AppShell";
import { TiptapEditor } from "../components/TiptapEditor";
import type { Work, WorkPayload, WorkStatus } from "../types/workList";
import type { WorkProject } from "../types/projectList";
import {
  toDateText,
  toDateValue,
  WorkCreate,
  workStatusLabel,
  workStatusOptions,
} from "./WorkCreate";
import { WorkProjectList } from "./WorkProjectList";

registerLocale("ko", ko);

type WorkRoute = {
  mode: "projects" | "list" | "new" | "detail";
  projectId: number | null;
  workId: number | null;
};

function parseWorkRoute(): WorkRoute {
  const [path] = location.hash.slice(1).split("?");
  const parts = path.split("/").filter(Boolean);
  const projectId = Number(parts[1]);
  const workId = Number(parts[2]);

  if (!Number.isFinite(projectId)) {
    return { mode: "projects", projectId: null, workId: null };
  }
  if (parts[2] === "new") {
    return { mode: "new", projectId, workId: null };
  }
  if (Number.isFinite(workId)) {
    return { mode: "detail", projectId, workId };
  }
  return { mode: "list", projectId, workId: null };
}

function goToProjects() {
  location.hash = "#/works";
}

function goToProject(projectId: number, path = "") {
  location.hash = path
    ? `#/works/${projectId}/${path}`
    : `#/works/${projectId}`;
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
          <p>근무 환경과 프로젝트별로 수행 업무 및 진행상황을 관리합니다.</p>
        </div>
        <a className="secondary-button" href="#/memos">
          메모장으로 이동
        </a>
      </header>

      {route.mode === "projects" ? (
        <WorkProjectList />
      ) : route.projectId ? (
        <ProjectWorkView route={route} projectId={route.projectId} />
      ) : null}
    </AppShell>
  );
}

function ProjectWorkView({
  route,
  projectId,
}: {
  route: WorkRoute;
  projectId: number;
}) {
  const [project, setProject] = useState<WorkProject | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    getWorkProject(projectId)
      .then(setProject)
      .catch(() => setError("프로젝트 정보를 불러오지 못했습니다."));
  }, [projectId]);

  if (error) {
    return (
      <section className="work-page-panel">
        <p className="form-error" role="alert">
          {error}
        </p>
        <button
          className="secondary-button"
          type="button"
          onClick={goToProjects}
        >
          프로젝트 목록
        </button>
      </section>
    );
  }

  if (!project) {
    return (
      <section className="work-page-panel">
        <p>프로젝트를 불러오고 있습니다.</p>
      </section>
    );
  }

  if (route.mode === "new") {
    return (
      <WorkCreate projectId={projectId} projectName={project.projectName} />
    );
  }
  if (route.mode === "detail" && route.workId) {
    return <WorkDetailView project={project} workId={route.workId} />;
  }
  return <WorkListView project={project} />;
}

function ProjectHeading({ project }: { project: WorkProject }) {
  return (
    <div className="project-context-heading">
      <button
        className="icon-button"
        type="button"
        title="프로젝트 목록"
        onClick={goToProjects}
      >
        <ChevronLeft size={18} aria-hidden="true" />
      </button>
      <div>
        <p className="eyebrow">Project work</p>
        <h2>{project.projectName}</h2>
      </div>
    </div>
  );
}

function WorkListView({ project }: { project: WorkProject }) {
  const [works, setWorks] = useState<Work[]>([]);
  const [dateFilter, setDateFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadWorks(nextDate = dateFilter) {
    setLoading(true);
    try {
      setWorks(await getWorks(project.projectId, nextDate));
      setError("");
    } catch {
      setError("업무 목록을 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadWorks("");
  }, [project.projectId]);

  function changeDate(date: Date | null) {
    const nextDate = date ? toDateText(date) : "";
    setDateFilter(nextDate);
    loadWorks(nextDate);
  }

  return (
    <section className="work-list-panel work-page-panel">
      <div className="section-heading">
        <ProjectHeading project={project} />
        <div className="work-page-actions">
          <span>{loading ? "불러오는 중..." : `${works.length}개의 업무`}</span>
          <button
            className="primary-button compact"
            type="button"
            onClick={() => goToProject(project.projectId, "new")}
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

      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
      <div className="work-board-wrap" aria-live="polite">
        {!loading && works.length === 0 ? (
          <div className="empty-state">
            <h3>표시할 업무가 없습니다.</h3>
            <p>업무 등록 버튼을 눌러 이 프로젝트의 첫 업무를 작성하세요.</p>
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
                  onClick={() =>
                    goToProject(project.projectId, String(work.workId))
                  }
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      goToProject(project.projectId, String(work.workId));
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

function WorkDetailView({
  project,
  workId,
}: {
  project: WorkProject;
  workId: number;
}) {
  const [work, setWork] = useState<Work | null>(null);
  const [draft, setDraft] = useState<WorkPayload | null>(null);
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  function toPayload(item: Work): WorkPayload {
    return {
      projectId: item.projectId,
      workDate: item.workDate,
      workTitle: item.workTitle,
      workCnnt: item.workCnnt,
      workStatus: item.workStatus,
      workProgress: item.workProgress,
    };
  }

  useEffect(() => {
    getWork(workId)
      .then((item) => {
        if (item.projectId !== project.projectId)
          throw new Error("Project mismatch");
        setWork(item);
        setDraft(toPayload(item));
      })
      .catch(() => setError("업무를 불러오지 못했습니다."));
  }, [project.projectId, workId]);

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
    goToProject(project.projectId);
  }

  if (error && !work) {
    return (
      <section className="work-detail-panel">
        <p className="form-error" role="alert">
          {error}
        </p>
        <button
          className="secondary-button"
          type="button"
          onClick={() => goToProject(project.projectId)}
        >
          업무 목록
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
          <button
            className="work-detail-back"
            type="button"
            onClick={() => goToProject(project.projectId)}
          >
            <ChevronLeft size={17} aria-hidden="true" /> {project.projectName}
          </button>
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
          {editing ? (
            <>
              <button
                className="primary-button compact"
                type="button"
                disabled={saving}
                onClick={saveEdit}
              >
                {saving ? "저장 중..." : "저장"}
              </button>
              <button
                className="secondary-button compact"
                type="button"
                onClick={cancelEdit}
              >
                취소
              </button>
            </>
          ) : (
            <>
              <button
                className="secondary-button compact"
                type="button"
                onClick={startEdit}
              >
                수정
              </button>
              <button
                className="secondary-button compact danger-text"
                type="button"
                onClick={remove}
              >
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
            ) : (
              work.workDate
            )}
          </dd>
        </div>
        <div>
          <dt>진행 상태</dt>
          <dd>
            {editing ? (
              <select
                value={draft.workStatus}
                onChange={(event) =>
                  setDraft({
                    ...draft,
                    workStatus: event.target.value as WorkStatus,
                  })
                }
              >
                {workStatusOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
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
                    setDraft({
                      ...draft,
                      workProgress: Number(event.target.value),
                    })
                  }
                />
                <output>{draft.workProgress}%</output>
              </label>
            ) : (
              <div className="work-progress-detail">
                <span>
                  <i style={{ width: `${work.workProgress}%` }} />
                </span>
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
        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}
      </div>
    </section>
  );
}
