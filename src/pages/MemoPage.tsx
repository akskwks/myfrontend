import { useEffect, useMemo, useState } from "react";
import { deleteMemo, getMemo, getMemos, updateMemo } from "../api/memoApi";
import { AppShell } from "../components/AppShell";
import { TiptapEditor } from "../components/TiptapEditor";
import type { Memo } from "../types/memo";
import { MemoCreate, memoSorts, templateLabel } from "./MemoCreate";

const pad = (value: number) => String(value).padStart(2, "0");

const formatDate = (date: Date) =>
  `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

const formatTime = (date: Date) =>
  `${pad(date.getHours())}:${pad(date.getMinutes())}`;

const isToday = (date: Date) => {
  const today = new Date();
  return (
    date.getFullYear() === today.getFullYear() &&
    date.getMonth() === today.getMonth() &&
    date.getDate() === today.getDate()
  );
};

const formatDetailUpdatedAt = (value: string) => {
  const date = new Date(value);
  return `${formatDate(date)} ${formatTime(date)}`;
};

const formatListUpdatedAt = (value: string) => {
  const date = new Date(value);
  return isToday(date) ? formatTime(date) : formatDate(date);
};

type MemoMode = "list" | "new" | "detail" | "edit";

type MemoRoute = {
  mode: MemoMode;
  memoId: number | null;
};

function parseMemoRoute(): MemoRoute {
  const [path] = location.hash.slice(1).split("?");
  const parts = path.split("/").filter(Boolean);
  const memoId = Number(parts[1]);

  if (parts[1] === "new") return { mode: "new", memoId: null };
  if (Number.isFinite(memoId) && parts[2] === "edit") {
    return { mode: "edit", memoId };
  }
  if (Number.isFinite(memoId)) return { mode: "detail", memoId };
  return { mode: "list", memoId: null };
}

function goToMemo(path = "") {
  location.hash = path ? `#/memos/${path}` : "#/memos";
}

export function MemoPage() {
  const route = useMemo(parseMemoRoute, [location.hash]);

  return (
    <AppShell active="memo" className="memo-page-content">
      <header className="page-header compact-header">
        <div>
          <p className="eyebrow">Memo</p>
          <h1>메모장</h1>
          <p>목록, 상세, 작성 화면을 분리해 필요한 기록에 집중합니다.</p>
        </div>
        <a className="secondary-button" href="#/calendar">
          캘린더로 이동
        </a>
      </header>

      {route.mode === "list" && <MemoListView />}
      {route.mode === "new" && <MemoCreate />}
      {route.mode === "detail" && route.memoId && (
        <MemoDetailView memoId={route.memoId} />
      )}
      {route.mode === "edit" && route.memoId && (
        <MemoDetailView memoId={route.memoId} startEditing />
      )}
    </AppShell>
  );
}

function MemoListView() {
  const [memos, setMemos] = useState<Memo[]>([]);
  const [keyword, setKeyword] = useState("");
  const [message, setMessage] = useState("메모를 불러오고 있습니다.");

  async function loadMemos(nextKeyword = keyword) {
    const items = await getMemos(nextKeyword);
    setMemos(items);
    setMessage(`${items.length}개의 메모가 표시됩니다.`);
  }

  useEffect(() => {
    loadMemos("");
  }, []);

  return (
    <section className="memo-list-panel memo-page-panel">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Memo list</p>
          <h2>메모 목록</h2>
        </div>
        <div className="memo-page-actions">
          <p>{message}</p>
          <button
            className="primary-button compact"
            type="button"
            onClick={() => goToMemo("new")}
          >
            메모 추가
          </button>
        </div>
      </div>

      <form
        className="search-form"
        onSubmit={(event) => {
          event.preventDefault();
          loadMemos(keyword);
        }}
      >
        <input
          value={keyword}
          onChange={(event) => setKeyword(event.target.value)}
          placeholder="제목 또는 내용 검색"
        />
        <button className="secondary-button" type="submit">
          검색
        </button>
      </form>

      <div className="memo-board-wrap" aria-live="polite">
        {memos.length ? (
          <table className="memo-board-table">
            <thead>
              <tr>
                <th scope="col">번호</th>
                <th scope="col">분류</th>
                <th scope="col">제목</th>
                <th scope="col">수정일</th>
              </tr>
            </thead>
            <tbody>
              {memos.map((memo) => (
                <tr
                  key={memo.memoId}
                  tabIndex={0}
                  onClick={() => goToMemo(String(memo.memoId))}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      goToMemo(String(memo.memoId));
                    }
                  }}
                >
                  <td className="memo-board-id">{memo.memoId}</td>
                  <td>
                    <span className="memo-sort-badge">
                      {templateLabel(memo.memoSort)}
                    </span>
                  </td>
                  <td className="memo-board-title">{memo.memoTitle}</td>
                  <td>{formatListUpdatedAt(memo.updatedAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="empty-state">
            <h3>표시할 메모가 없습니다.</h3>
            <p>메모 추가 버튼을 눌러 첫 메모를 작성하세요.</p>
          </div>
        )}
      </div>
    </section>
  );
}

function MemoDetailView({
  memoId,
  startEditing = false,
}: {
  memoId: number;
  startEditing?: boolean;
}) {
  const [memo, setMemo] = useState<Memo | null>(null);
  const [draft, setDraft] = useState<
    Pick<Memo, "memoTitle" | "memoCnnt" | "memoSort">
  >({
    memoTitle: "",
    memoCnnt: "",
    memoSort: "general",
  });
  const [editing, setEditing] = useState(startEditing);
  const [loadError, setLoadError] = useState("");
  const [saveError, setSaveError] = useState("");
  const [saveStatus, setSaveStatus] = useState("");

  useEffect(() => {
    getMemo(memoId)
      .then((item) => {
        setMemo(item);
        setDraft({
          memoTitle: item.memoTitle,
          memoCnnt: item.memoCnnt,
          memoSort: item.memoSort,
        });
      })
      .catch(() => setLoadError("메모를 불러오지 못했습니다."));
  }, [memoId]);

  useEffect(() => {
    setEditing(startEditing);
  }, [startEditing]);

  function startEdit() {
    if (!memo) return;
    setDraft({
      memoTitle: memo.memoTitle,
      memoCnnt: memo.memoCnnt,
      memoSort: memo.memoSort,
    });
    setSaveError("");
    setSaveStatus("");
    setEditing(true);
  }

  function cancelEdit() {
    if (!memo) return;
    setDraft({
      memoTitle: memo.memoTitle,
      memoCnnt: memo.memoCnnt,
      memoSort: memo.memoSort,
    });
    setSaveError("");
    setSaveStatus("");
    setEditing(false);
  }

  async function saveEdit() {
    if (!memo) return;
    if (!draft.memoTitle.trim()) {
      setSaveError("제목은 비워둘 수 없습니다.");
      return;
    }

    setSaveError("");
    setSaveStatus("저장 중...");
    try {
      const saved = await updateMemo(memo.memoId, {
        memoTitle: draft.memoTitle.trim(),
        memoCnnt: draft.memoCnnt,
        memoSort: draft.memoSort,
      });
      setMemo(saved);
      setDraft({
        memoTitle: saved.memoTitle,
        memoCnnt: saved.memoCnnt,
        memoSort: saved.memoSort,
      });
      setSaveStatus("저장됨");
      setEditing(false);
    } catch {
      setSaveError("저장에 실패했습니다.");
      setSaveStatus("");
    }
  }

  async function remove() {
    if (!window.confirm("이 메모를 삭제할까요?")) return;
    await deleteMemo(memoId);
    goToMemo();
  }

  if (loadError) {
    return (
      <section className="memo-detail-panel">
        <p className="form-error" role="alert">
          {loadError}
        </p>
        <button
          className="secondary-button"
          type="button"
          onClick={() => goToMemo()}
        >
          목록으로
        </button>
      </section>
    );
  }

  if (!memo) {
    return (
      <section className="memo-detail-panel">
        <p className="status-text">메모를 불러오고 있습니다.</p>
      </section>
    );
  }

  return (
    <section className="memo-detail-panel">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Memo detail</p>
          {editing ? (
            <input
              className="memo-title-input"
              value={draft.memoTitle}
              onChange={(event) =>
                setDraft({ ...draft, memoTitle: event.target.value })
              }
              maxLength={100}
              aria-label="메모 제목"
            />
          ) : (
            <h2>{memo.memoTitle}</h2>
          )}
        </div>
        <div className="button-group">
          <button
            className="secondary-button compact"
            type="button"
            onClick={() => goToMemo()}
          >
            목록
          </button>
          {editing ? (
            <>
              <button
                className="primary-button compact"
                type="button"
                onClick={saveEdit}
              >
                저장
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

      <dl className="memo-detail-meta">
        <div>
          <dt>분류</dt>
          <dd>
            {editing ? (
              <select
                className="memo-detail-sort"
                value={draft.memoSort}
                onChange={(event) =>
                  setDraft({
                    ...draft,
                    memoSort: event.target.value as Memo["memoSort"],
                  })
                }
              >
                {memoSorts.map((memoSort) => (
                  <option key={memoSort.value} value={memoSort.value}>
                    {memoSort.label}
                  </option>
                ))}
              </select>
            ) : (
              templateLabel(memo.memoSort)
            )}
          </dd>
        </div>
        <div>
          <dt>수정일</dt>
          <dd>{formatDetailUpdatedAt(memo.updatedAt)}</dd>
        </div>
      </dl>

      <TiptapEditor
        content={draft.memoCnnt || "<p></p>"}
        editable={editing}
        onChange={(memoCnnt) => setDraft({ ...draft, memoCnnt })}
      />
      <div className="memo-save-status" aria-live="polite">
        <span>{saveStatus}</span>
        {saveError && (
          <p className="form-error" role="alert">
            {saveError}
          </p>
        )}
      </div>
    </section>
  );
}
