import { useState, type FormEvent } from "react";
import DatePicker, { registerLocale } from "react-datepicker";
import { ko } from "date-fns/locale";
import { CalendarDays } from "lucide-react";
import { createWork } from "../api/workApi";
import { TiptapEditor } from "../components/TiptapEditor";
import type { WorkPayload, WorkStatus } from "../types/workList";

registerLocale("ko", ko);

export const workStatusOptions: { value: WorkStatus; label: string }[] = [
  { value: "planned", label: "예정" },
  { value: "in_progress", label: "진행중" },
  { value: "completed", label: "완료" },
  { value: "on_hold", label: "보류" },
];

export const workStatusLabel = (status: WorkStatus) =>
  workStatusOptions.find((option) => option.value === status)?.label ?? "예정";

export const workTemplate = `
  <table>
    <thead>
      <tr><th><p>구분</p></th><th><p>내용</p></th></tr>
    </thead>
    <tbody>
      <tr><td><p>주요 작업 내용</p></td><td><p>내용을 입력하세요.</p></td></tr>
      <tr><td><p>이슈 / 특이사항</p></td><td><p>내용을 입력하세요.</p></td></tr>
      <tr><td><p>다음 작업</p></td><td><p>내용을 입력하세요.</p></td></tr>
    </tbody>
  </table>
`;

export function toDateText(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function toDateValue(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function goToProjectWork(projectId: number, path = "") {
  location.hash = path
    ? `#/works/${projectId}/${path}`
    : `#/works/${projectId}`;
}

const emptyPayload = (projectId: number): WorkPayload => ({
  projectId,
  workDate: toDateText(new Date()),
  workTitle: "",
  workCnnt: workTemplate,
  workStatus: "planned",
});

export function WorkCreate({
  projectId,
  projectName,
}: {
  projectId: number;
  projectName: string;
}) {
  const [payload, setPayload] = useState<WorkPayload>(() =>
    emptyPayload(projectId),
  );
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!payload.workTitle.trim()) {
      setError("업무 제목을 입력하세요.");
      return;
    }

    setSaving(true);
    setError("");
    try {
      const saved = await createWork({
        ...payload,
        workTitle: payload.workTitle.trim(),
      });
      goToProjectWork(projectId, String(saved.workId));
    } catch {
      setError("업무를 저장하지 못했습니다.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="work-form-panel">
      <div className="section-heading">
        <div>
          <p className="eyebrow">{projectName}</p>
          <h2>업무 등록</h2>
        </div>
        <button
          className="secondary-button compact"
          type="button"
          onClick={() => goToProjectWork(projectId)}
        >
          목록
        </button>
      </div>

      <form className="stack-form work-editor-form" onSubmit={save}>
        <label>
          업무 제목
          <input
            required
            maxLength={100}
            value={payload.workTitle}
            onChange={(event) =>
              setPayload({ ...payload, workTitle: event.target.value })
            }
            placeholder="진행한 업무의 제목"
          />
        </label>

        <div className="form-grid work-structured-fields">
          <label>
            업무일자
            <div className="date-picker-control">
              <CalendarDays size={17} aria-hidden="true" />
              <DatePicker
                required
                selected={toDateValue(payload.workDate)}
                onChange={(date: Date | null) =>
                  date && setPayload({ ...payload, workDate: toDateText(date) })
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
          </label>
          <label>
            진행 상태
            <select
              value={payload.workStatus}
              onChange={(event) =>
                setPayload({
                  ...payload,
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
          </label>
        </div>

        <div>
          <span className="field-label">업무 내용</span>
          <TiptapEditor
            content={payload.workCnnt}
            editable
            onChange={(workCnnt) => setPayload({ ...payload, workCnnt })}
          />
        </div>
        <p className="editor-helper-text">
          표의 각 셀에서 주요 작업, 이슈, 다음 작업을 자유롭게 작성할 수
          있습니다.
        </p>
        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}
        <div className="dialog-actions">
          <button
            className="secondary-button"
            type="button"
            onClick={() => goToProjectWork(projectId)}
          >
            취소
          </button>
          <button className="primary-button" type="submit" disabled={saving}>
            {saving ? "저장 중..." : "업무 저장"}
          </button>
        </div>
      </form>
    </section>
  );
}
