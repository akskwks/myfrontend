import {
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent,
  type PointerEvent,
} from "react";
import { Eye, RotateCcw, Search, X } from "lucide-react";
import { getSystemLogDetail, getSystemLogs } from "../api/systemLogApi";
import { AppShell } from "../components/AppShell";
import type { SystemLogFilters, SystemLogPageResult } from "../types/systemLog";

const emptyFilters: SystemLogFilters = {
  keyword: "",
  methodType: "",
  successYn: "",
};

const columnSettings = [
  { key: "user", label: "사용자명", minWidth: 100, width: 120 },
  { key: "api", label: "호출 API", minWidth: 220, width: 340 },
  { key: "status", label: "성공여부", minWidth: 90, width: 105 },
  { key: "requestJson", label: "요청 JSON", minWidth: 100, width: 120 },
  { key: "requestAt", label: "요청날짜", minWidth: 165, width: 190 },
  { key: "responseJson", label: "응답 JSON", minWidth: 100, width: 120 },
  { key: "responseAt", label: "응답날짜", minWidth: 165, width: 190 },
] as const;
const columnStorageKey = "myapp:system-log-column-widths";

function defaultColumnWidths(containerWidth = 0) {
  const widths: number[] = columnSettings.map((column) => column.width);
  const extra = Math.max(
    0,
    containerWidth - widths.reduce((sum, width) => sum + width, 0),
  );
  widths[1] += extra;
  return widths;
}

function storedColumnWidths() {
  try {
    const stored = JSON.parse(localStorage.getItem(columnStorageKey) ?? "null");
    if (
      Array.isArray(stored) &&
      stored.length === columnSettings.length &&
      stored.every(
        (value, index) =>
          Number.isFinite(value) &&
          value >= columnSettings[index].minWidth &&
          value <= 1600,
      )
    ) {
      return stored as number[];
    }
  } catch {
    /* Ignore invalid saved layout. */
  }
  return defaultColumnWidths();
}

function formatDateTime(value: string) {
  return value?.replace("T", " ").slice(0, 19) ?? "-";
}

function formatJson(value: string | null) {
  if (!value) return null;
  try {
    return JSON.stringify(JSON.parse(value), null, 2);
  } catch {
    return value;
  }
}

export function SystemLogPage() {
  const [filters, setFilters] = useState<SystemLogFilters>(emptyFilters);
  const [applied, setApplied] = useState<SystemLogFilters>(emptyFilters);
  const [page, setPage] = useState(0);
  const [result, setResult] = useState<SystemLogPageResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [jsonView, setJsonView] = useState<{
    title: string;
    content: string | null;
  } | null>(null);
  const [jsonLoading, setJsonLoading] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const tableWrapRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{
    index: number;
    startX: number;
    startWidth: number;
  } | null>(null);
  const [columnWidths, setColumnWidths] = useState(storedColumnWidths);

  useEffect(() => {
    if (localStorage.getItem(columnStorageKey)) return;
    setColumnWidths(defaultColumnWidths(tableWrapRef.current?.clientWidth));
  }, []);

  useEffect(() => {
    localStorage.setItem(columnStorageKey, JSON.stringify(columnWidths));
  }, [columnWidths]);

  function resizeColumn(index: number, width: number) {
    setColumnWidths((current) =>
      current.map((value, position) =>
        position === index
          ? Math.max(
              columnSettings[index].minWidth,
              Math.min(1600, Math.round(width)),
            )
          : value,
      ),
    );
  }

  function startResize(event: PointerEvent<HTMLSpanElement>, index: number) {
    event.preventDefault();
    dragRef.current = {
      index,
      startX: event.clientX,
      startWidth: columnWidths[index],
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function moveResize(event: PointerEvent<HTMLSpanElement>) {
    if (!dragRef.current) return;
    const { index, startX, startWidth } = dragRef.current;
    resizeColumn(index, startWidth + event.clientX - startX);
  }

  function keyResize(event: KeyboardEvent<HTMLSpanElement>, index: number) {
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
    event.preventDefault();
    resizeColumn(
      index,
      columnWidths[index] + (event.key === "ArrowRight" ? 10 : -10),
    );
  }

  useEffect(() => {
    let live = true;
    setLoading(true);
    setError("");
    getSystemLogs(applied, page)
      .then((data) => {
        if (live) setResult(data);
      })
      .catch((cause) => {
        if (live)
          setError(
            cause instanceof Error
              ? cause.message
              : "로그를 불러오지 못했습니다.",
          );
      })
      .finally(() => {
        if (live) setLoading(false);
      });
    return () => {
      live = false;
    };
  }, [applied, page]);

  function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPage(0);
    setApplied({ ...filters });
  }

  async function openJson(id: number, kind: "request" | "response") {
    setJsonView({
      title: kind === "request" ? "요청 JSON" : "응답 JSON",
      content: null,
    });
    setJsonLoading(true);
    dialogRef.current?.showModal();
    try {
      const detail = await getSystemLogDetail(id);
      setJsonView({
        title: kind === "request" ? "요청 JSON" : "응답 JSON",
        content: formatJson(
          kind === "request" ? detail.requestJson : detail.responseJson,
        ),
      });
    } catch (cause) {
      setJsonView({
        title: "조회 실패",
        content:
          cause instanceof Error
            ? cause.message
            : "JSON을 불러오지 못했습니다.",
      });
    } finally {
      setJsonLoading(false);
    }
  }

  return (
    <AppShell active="logs" className="system-log-page-content">
      <header className="page-header compact-header">
        <div>
          <p className="eyebrow">System Logs</p>
          <h1>시스템 로그</h1>
        </div>
      </header>
      <section className="system-log-panel" aria-label="시스템 로그 조회">
        <form className="system-log-filters" onSubmit={handleSearch}>
          <label>
            키워드
            <input
              value={filters.keyword}
              onChange={(event) =>
                setFilters({ ...filters, keyword: event.target.value })
              }
              placeholder="사용자명 또는 호출 API"
            />
          </label>
          <label>
            메서드
            <select
              value={filters.methodType}
              onChange={(event) =>
                setFilters({ ...filters, methodType: event.target.value })
              }
            >
              <option value="">전체</option>
              {["GET", "POST", "PUT", "PATCH", "DELETE"].map((method) => (
                <option key={method}>{method}</option>
              ))}
            </select>
          </label>
          <label>
            성공 여부
            <select
              value={filters.successYn}
              onChange={(event) =>
                setFilters({ ...filters, successYn: event.target.value })
              }
            >
              <option value="">전체</option>
              <option value="Y">성공</option>
              <option value="N">실패</option>
            </select>
          </label>
          <button className="primary-button" type="submit">
            <Search size={17} /> 조회
          </button>
        </form>
        <div className="system-log-meta">
          <span>
            {loading ? "조회 중..." : `총 ${result?.totalElements ?? 0}건`}
          </span>
          <button
            type="button"
            className="system-log-reset-widths"
            title="열 너비 초기화"
            aria-label="열 너비 초기화"
            onClick={() =>
              setColumnWidths(
                defaultColumnWidths(tableWrapRef.current?.clientWidth),
              )
            }
          >
            <RotateCcw size={15} />
          </button>
        </div>
        <div className="system-log-table-wrap" ref={tableWrapRef}>
          <table
            className="system-log-table"
            style={{
              width: columnWidths.reduce((sum, width) => sum + width, 0),
            }}
          >
            <colgroup>
              {columnSettings.map((column, index) => (
                <col key={column.key} style={{ width: columnWidths[index] }} />
              ))}
            </colgroup>
            <thead>
              <tr>
                {columnSettings.map((column, index) => (
                  <th key={column.key} scope="col">
                    {column.label}
                    <span
                      className="system-log-column-resizer"
                      role="separator"
                      tabIndex={0}
                      aria-label={`${column.label} 열 너비 조절`}
                      aria-orientation="vertical"
                      aria-valuemin={column.minWidth}
                      aria-valuemax={1600}
                      aria-valuenow={columnWidths[index]}
                      onPointerDown={(event) => startResize(event, index)}
                      onPointerMove={moveResize}
                      onPointerUp={() => {
                        dragRef.current = null;
                      }}
                      onPointerCancel={() => {
                        dragRef.current = null;
                      }}
                      onKeyDown={(event) => keyResize(event, index)}
                    />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {result?.content.map((log) => (
                <tr key={log.logId}>
                  <td>{log.userName}</td>
                  <td className="system-log-api">
                    <strong>{log.methodType}</strong> {log.apiUrl}
                  </td>
                  <td>
                    <span
                      className={`system-log-status ${log.successYn === "Y" ? "is-success" : "is-failure"}`}
                    >
                      {log.successYn === "Y" ? "성공" : "실패"}
                    </span>
                  </td>
                  <td>
                    <button
                      type="button"
                      className="system-log-view"
                      onClick={() => void openJson(log.logId, "request")}
                    >
                      <Eye size={15} /> 보기
                    </button>
                  </td>
                  <td>{formatDateTime(log.requestAt)}</td>
                  <td>
                    <button
                      type="button"
                      className="system-log-view"
                      onClick={() => void openJson(log.logId, "response")}
                    >
                      <Eye size={15} /> 보기
                    </button>
                  </td>
                  <td>{formatDateTime(log.responseAt)}</td>
                </tr>
              ))}
              {!loading && !error && !result?.content.length && (
                <tr>
                  <td colSpan={7} className="system-log-empty">
                    조회된 로그가 없습니다.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {error && (
          <p className="system-log-error" role="alert">
            {error}
          </p>
        )}
        <div className="system-log-pagination">
          <button
            type="button"
            disabled={page === 0 || loading}
            onClick={() => setPage(page - 1)}
          >
            이전
          </button>
          <span>
            {(result?.number ?? page) + 1} /{" "}
            {Math.max(result?.totalPages ?? 1, 1)}
          </span>
          <button
            type="button"
            disabled={loading || page + 1 >= (result?.totalPages ?? 0)}
            onClick={() => setPage(page + 1)}
          >
            다음
          </button>
        </div>
      </section>
      <dialog
        ref={dialogRef}
        className="system-log-dialog"
        onClose={() => setJsonView(null)}
      >
        <header>
          <h2>{jsonView?.title}</h2>
          <button
            type="button"
            aria-label="닫기"
            title="닫기"
            onClick={() => dialogRef.current?.close()}
          >
            <X size={18} />
          </button>
        </header>
        <pre>
          {jsonLoading
            ? "불러오는 중..."
            : (jsonView?.content ??
              (jsonView?.title === "요청 JSON"
                ? "요청 데이터가 없습니다."
                : "응답 데이터가 없습니다."))}
        </pre>
      </dialog>
    </AppShell>
  );
}
