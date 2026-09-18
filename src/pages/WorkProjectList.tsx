import {
  useEffect,
  useState,
  type Dispatch,
  type MouseEvent,
  type SetStateAction,
} from "react";
import DatePicker, { registerLocale } from "react-datepicker";
import { ko } from "date-fns/locale";
import { Check, Pencil, Plus, Trash2, X } from "lucide-react";
import {
  createWorkProject,
  deleteWorkProject,
  getWorkProjects,
  updateWorkProject,
} from "../api/projectApi";
import { ApiError } from "../api/http";
import type {
  ProjectStatus,
  WorkEnvironment,
  WorkProject,
  WorkProjectPayload,
} from "../types/projectList";
import { toDateText, toDateValue } from "./WorkCreate";

registerLocale("ko", ko);

const environmentOptions: { value: WorkEnvironment; label: string }[] = [
  { value: "office", label: "내근" },
  { value: "dispatch", label: "파견" },
];

const projectStatusOptions: { value: ProjectStatus; label: string }[] = [
  { value: "planned", label: "예정" },
  { value: "in_progress", label: "진행중" },
  { value: "completed", label: "완료" },
  { value: "on_hold", label: "보류" },
];

const environmentLabel = (value: WorkEnvironment) =>
  environmentOptions.find((option) => option.value === value)?.label ?? "내근";

const projectStatusLabel = (value: ProjectStatus) =>
  projectStatusOptions.find((option) => option.value === value)?.label ??
  "예정";

function emptyProject(): WorkProjectPayload {
  const start = new Date();
  const end = new Date(start);
  end.setMonth(end.getMonth() + 1);
  return {
    workEnvironment: "office",
    projectName: "",
    projectStatus: "planned",
    startDate: toDateText(start),
    endDate: toDateText(end),
  };
}

function toPayload(project: WorkProject): WorkProjectPayload {
  return {
    workEnvironment: project.workEnvironment,
    projectName: project.projectName,
    projectStatus: project.projectStatus,
    startDate: project.startDate,
    endDate: project.endDate,
  };
}

function goToProject(projectId: number) {
  location.hash = `#/works/${projectId}`;
}

export function WorkProjectList() {
  const [projects, setProjects] = useState<WorkProject[]>([]);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [draft, setDraft] = useState<WorkProjectPayload>(emptyProject);
  const [adding, setAdding] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function loadProjects() {
    setLoading(true);
    try {
      setProjects(await getWorkProjects());
      setError("");
    } catch {
      setError("프로젝트 목록을 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadProjects();
  }, []);

  function startAdd() {
    setEditingId(null);
    setDraft(emptyProject());
    setError("");
    setAdding(true);
  }

  function startEdit(project: WorkProject, event: MouseEvent) {
    event.stopPropagation();
    setAdding(false);
    setEditingId(project.projectId);
    setDraft(toPayload(project));
    setError("");
  }

  function cancelEdit(event?: MouseEvent) {
    event?.stopPropagation();
    setAdding(false);
    setEditingId(null);
    setDraft(emptyProject());
    setError("");
  }

  function validate() {
    if (!draft.projectName.trim()) return "프로젝트명을 입력하세요.";
    if (draft.endDate < draft.startDate) {
      return "종료일은 시작일보다 빠를 수 없습니다.";
    }
    return "";
  }

  async function saveProject(event: MouseEvent) {
    event.stopPropagation();
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setSaving(true);
    setError("");
    try {
      const payload = { ...draft, projectName: draft.projectName.trim() };
      if (editingId) await updateWorkProject(editingId, payload);
      else await createWorkProject(payload);
      cancelEdit();
      await loadProjects();
    } catch {
      setError("프로젝트를 저장하지 못했습니다.");
    } finally {
      setSaving(false);
    }
  }

  async function removeProject(project: WorkProject, event: MouseEvent) {
    event.stopPropagation();
    if (!window.confirm(`'${project.projectName}' 프로젝트를 삭제할까요?`))
      return;

    setError("");
    try {
      await deleteWorkProject(project.projectId);
      await loadProjects();
    } catch (caught) {
      if (caught instanceof ApiError && caught.status === 409) {
        setError("연결된 업무가 있는 프로젝트는 삭제할 수 없습니다.");
      } else {
        setError("프로젝트를 삭제하지 못했습니다.");
      }
    }
  }

  function changeStartDate(date: Date | null) {
    if (!date) return;
    const startDate = toDateText(date);
    setDraft((current) => ({
      ...current,
      startDate,
      endDate: current.endDate < startDate ? startDate : current.endDate,
    }));
  }

  return (
    <section className="work-project-panel work-page-panel">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Project management</p>
          <h2>프로젝트 관리</h2>
        </div>
        <p className="project-count">
          {loading ? "불러오는 중..." : `${projects.length}개의 프로젝트`}
        </p>
      </div>

      <div className="project-board-wrap" aria-live="polite">
        <table className="project-board-table">
          <thead>
            <tr>
              <th scope="col">분류</th>
              <th scope="col">프로젝트명</th>
              <th scope="col">진행사항</th>
              <th scope="col">시작일</th>
              <th scope="col">종료일</th>
              <th scope="col">관리</th>
            </tr>
          </thead>
          <tbody>
            {!loading && projects.length === 0 && !adding && (
              <tr className="project-empty-row">
                <td colSpan={6}>등록된 프로젝트가 없습니다.</td>
              </tr>
            )}
            {projects.map((project) =>
              editingId === project.projectId ? (
                <ProjectEditorRow
                  key={project.projectId}
                  draft={draft}
                  saving={saving}
                  setDraft={setDraft}
                  changeStartDate={changeStartDate}
                  saveProject={saveProject}
                  cancelEdit={cancelEdit}
                />
              ) : (
                <tr
                  className="project-view-row"
                  key={project.projectId}
                  tabIndex={0}
                  onClick={() => goToProject(project.projectId)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      goToProject(project.projectId);
                    }
                  }}
                >
                  <td>
                    <span
                      className={`environment-badge is-${project.workEnvironment}`}
                    >
                      {environmentLabel(project.workEnvironment)}
                    </span>
                  </td>
                  <td className="project-name-cell">{project.projectName}</td>
                  <td>
                    <span
                      className={`work-status-badge is-${project.projectStatus}`}
                    >
                      {projectStatusLabel(project.projectStatus)}
                    </span>
                  </td>
                  <td>{project.startDate}</td>
                  <td>{project.endDate}</td>
                  <td>
                    <div className="project-row-actions">
                      <button
                        type="button"
                        title="프로젝트 수정"
                        aria-label={`${project.projectName} 수정`}
                        onClick={(event) => startEdit(project, event)}
                      >
                        <Pencil size={16} aria-hidden="true" />
                      </button>
                      <button
                        className="danger-text"
                        type="button"
                        title="프로젝트 삭제"
                        aria-label={`${project.projectName} 삭제`}
                        onClick={(event) => removeProject(project, event)}
                      >
                        <Trash2 size={16} aria-hidden="true" />
                      </button>
                    </div>
                  </td>
                </tr>
              ),
            )}
            {adding && (
              <ProjectEditorRow
                draft={draft}
                saving={saving}
                setDraft={setDraft}
                changeStartDate={changeStartDate}
                saveProject={saveProject}
                cancelEdit={cancelEdit}
              />
            )}
          </tbody>
        </table>
      </div>

      <div className="project-panel-footer">
        <span className="form-error" role="alert">
          {error}
        </span>
        <button
          className="secondary-button compact"
          type="button"
          disabled={adding || editingId !== null}
          onClick={startAdd}
        >
          <Plus size={17} aria-hidden="true" />
          추가
        </button>
      </div>
    </section>
  );
}

type ProjectEditorRowProps = {
  draft: WorkProjectPayload;
  saving: boolean;
  setDraft: Dispatch<SetStateAction<WorkProjectPayload>>;
  changeStartDate: (date: Date | null) => void;
  saveProject: (event: MouseEvent) => void;
  cancelEdit: (event?: MouseEvent) => void;
};

function ProjectEditorRow({
  draft,
  saving,
  setDraft,
  changeStartDate,
  saveProject,
  cancelEdit,
}: ProjectEditorRowProps) {
  return (
    <tr
      className="project-editor-row"
      onClick={(event) => event.stopPropagation()}
    >
      <td>
        <select
          value={draft.workEnvironment}
          onChange={(event) =>
            setDraft({
              ...draft,
              workEnvironment: event.target.value as WorkEnvironment,
            })
          }
          aria-label="근무 환경"
        >
          {environmentOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </td>
      <td>
        <input
          value={draft.projectName}
          maxLength={100}
          placeholder="프로젝트명"
          aria-label="프로젝트명"
          onChange={(event) =>
            setDraft({ ...draft, projectName: event.target.value })
          }
        />
      </td>
      <td>
        <select
          value={draft.projectStatus}
          aria-label="프로젝트 진행사항"
          onChange={(event) =>
            setDraft({
              ...draft,
              projectStatus: event.target.value as ProjectStatus,
            })
          }
        >
          {projectStatusOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </td>
      <td>
        <DatePicker
          selected={toDateValue(draft.startDate)}
          onChange={changeStartDate}
          locale="ko"
          dateFormat="yyyy-MM-dd"
          calendarStartDay={0}
          showMonthDropdown
          showYearDropdown
          dropdownMode="select"
          portalId="project-datepicker-portal"
          popperPlacement="bottom-start"
          showPopperArrow={false}
          popperClassName="project-date-picker-popper"
          className="project-date-input"
          calendarClassName="myapp-date-picker"
          aria-label="프로젝트 시작일"
        />
      </td>
      <td>
        <DatePicker
          selected={toDateValue(draft.endDate)}
          onChange={(date: Date | null) =>
            date && setDraft({ ...draft, endDate: toDateText(date) })
          }
          minDate={toDateValue(draft.startDate)}
          locale="ko"
          dateFormat="yyyy-MM-dd"
          calendarStartDay={0}
          showMonthDropdown
          showYearDropdown
          dropdownMode="select"
          portalId="project-datepicker-portal"
          popperPlacement="bottom-start"
          showPopperArrow={false}
          popperClassName="project-date-picker-popper"
          className="project-date-input"
          calendarClassName="myapp-date-picker"
          aria-label="프로젝트 종료일"
        />
      </td>
      <td>
        <div className="project-row-actions">
          <button
            type="button"
            title="저장"
            aria-label="프로젝트 저장"
            disabled={saving}
            onClick={saveProject}
          >
            <Check size={17} aria-hidden="true" />
          </button>
          <button
            type="button"
            title="취소"
            aria-label="프로젝트 편집 취소"
            onClick={cancelEdit}
          >
            <X size={17} aria-hidden="true" />
          </button>
        </div>
      </td>
    </tr>
  );
}
