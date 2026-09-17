import { useEffect, useState, type FormEvent } from "react";
import { createMemo, getMemo, updateMemo } from "../api/memoApi";
import { TiptapMemoEditor } from "../components/TiptapMemoEditor";
import type { Memo, MemoPayload, MemoTemplateOption } from "../types/memo";

export const memoSorts: MemoTemplateOption[] = [
  { value: "general", label: "일반", placeholder: "자유롭게 작성하세요." },
  { value: "work", label: "업무", placeholder: "업무 진행사항을 작성하세요." },
  { value: "code", label: "코드", placeholder: "코드와 설명을 함께 작성하세요." },
  { value: "todo", label: "TODO", placeholder: "체크리스트를 작성하세요." },
  { value: "etc", label: "기타", placeholder: "자유롭게 작성하세요." },
];

export const templateLabel = (value: Memo["memoSort"]) =>
  memoSorts.find((memoSort) => memoSort.value === value)?.label ?? "일반";

const emptyPayload: MemoPayload = {
  memoTitle: "",
  memoCnnt: "",
  memoSort: "general",
};

function getTemplate(sort: Memo["memoSort"]) {
  if (sort === "work") {
    return `
      <h2>업무 내용</h2>
      <p>내용을 입력하세요.</p>
      <h2>진행 상태 / 진행률</h2>
      <p>진행 상태 및 진행률을 작성하세요.</p>
      <h2>주요 작업 내용</h2>
      <ul><li><p>작업 내용을 작성하세요.</p></li></ul>
      <h2>이슈 / 특이사항</h2>
      <p>내용을 작성하세요.</p>
      <h2>다음 작업</h2>
      <ul><li><p>다음 작업을 작성하세요.</p></li></ul>
    `;
  }

  if (sort === "code") {
    return `
      <p>설명</p>
      <pre><code>function example() {
  return true;
}</code></pre>
      <p>추가 메모</p>
    `;
  }

  if (sort === "todo") {
    return `
      <ul data-type="taskList">
        <li data-type="taskItem" data-checked="false"><label><input type="checkbox"><span></span></label><div><p>할 일</p></div></li>
        <li data-type="taskItem" data-checked="false"><label><input type="checkbox"><span></span></label><div><p>할 일</p></div></li>
        <li data-type="taskItem" data-checked="false"><label><input type="checkbox"><span></span></label><div><p>할 일</p></div></li>
      </ul>
    `;
  }

  return "<p></p>";
}

function goToMemo(path = "") {
  location.hash = path ? `#/memos/${path}` : "#/memos";
}

export function MemoCreate({ memoId }: { memoId?: number }) {
  const [payload, setPayload] = useState<MemoPayload>(emptyPayload);
  const [loading, setLoading] = useState(Boolean(memoId));
  const [error, setError] = useState("");

  useEffect(() => {
    if (!memoId) {
      setPayload(emptyPayload);
      setLoading(false);
      return;
    }

    setLoading(true);
    getMemo(memoId)
      .then((memo) => {
        setPayload({
          memoTitle: memo.memoTitle,
          memoCnnt: memo.memoCnnt,
          memoSort: memo.memoSort,
        });
      })
      .catch(() => setError("수정할 메모를 불러오지 못했습니다."))
      .finally(() => setLoading(false));
  }, [memoId]);

  function changeMemoSort(nextSort: Memo["memoSort"]) {
    setPayload((current) => ({
      ...current,
      memoSort: nextSort,
      memoCnnt: memoId ? current.memoCnnt : getTemplate(nextSort),
    }));
  }

  function changeMemoContent(memoCnnt: string) {
    setPayload((current) => {
      if (memoCnnt === current.memoCnnt) return current;
      return { ...current, memoCnnt };
    });
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const saved = memoId
      ? await updateMemo(memoId, payload)
      : await createMemo(payload);
    goToMemo(String(saved.memoId));
  }

  return (
    <section className="memo-form-panel">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Memo editor</p>
          <h2>{memoId ? "메모 수정" : "메모 추가"}</h2>
        </div>
        <button
          className="secondary-button compact"
          type="button"
          onClick={() => goToMemo()}
        >
          목록
        </button>
      </div>

      {loading ? (
        <p className="status-text">메모를 불러오고 있습니다.</p>
      ) : (
        <form className="stack-form memo-editor-form" onSubmit={save}>
          <label>
            분류
            <select
              value={payload.memoSort}
              onChange={(event) =>
                changeMemoSort(event.target.value as Memo["memoSort"])
              }
            >
              {memoSorts.map((memoSort) => (
                <option key={memoSort.value} value={memoSort.value}>
                  {memoSort.label}
                </option>
              ))}
            </select>
          </label>
          <label>
            제목
            <input
              required
              maxLength={100}
              value={payload.memoTitle}
              onChange={(event) =>
                setPayload({ ...payload, memoTitle: event.target.value })
              }
              placeholder="메모 제목"
            />
          </label>
          <div>
            <span className="field-label">내용</span>
            <TiptapMemoEditor
              content={payload.memoCnnt || "<p></p>"}
              editable
              onChange={changeMemoContent}
            />
          </div>
          <p className="editor-helper-text">
            제목, 목록, 체크리스트, 코드 블록, 링크를 하나의 에디터에서 작성할 수 있습니다.
          </p>
          <p className="form-error" role="alert">
            {error}
          </p>
          <div className="dialog-actions">
            <button
              className="secondary-button"
              type="button"
              onClick={() => goToMemo()}
            >
              취소
            </button>
            <button className="primary-button" type="submit">
              {memoId ? "수정 저장" : "메모 저장"}
            </button>
          </div>
        </form>
      )}
    </section>
  );
}
