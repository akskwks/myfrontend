import { jsonHeaders, request } from "./http";
import type { Memo, MemoPayload, MemoSort } from "../types/memo";

const MEMO_API_URL = "/api/memos";
const LOCAL_KEY = "myapp.memos";

const now = () => new Date().toISOString();

function readLocal(): Memo[] {
  const raw = localStorage.getItem(LOCAL_KEY);
  if (!raw) return [];
  return JSON.parse(raw) as Memo[];
}

function writeLocal(memos: Memo[]) {
  localStorage.setItem(LOCAL_KEY, JSON.stringify(memos));
}

function sortMemos(memos: Memo[]) {
  return [...memos].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export async function getMemos(keyword = "", memoSort: MemoSort | "" = "") {
  try {
    const params = new URLSearchParams();
    if (keyword.trim()) params.set("keyword", keyword.trim());
    if (memoSort) params.set("memoSort", memoSort);
    const query = params.size ? `?${params.toString()}` : "";
    return await request<Memo[]>(`${MEMO_API_URL}${query}`);
  } catch {
    const term = keyword.trim().toLowerCase();
    const memos = sortMemos(readLocal());
    return memos.filter(
      (memo) =>
        (!memoSort || memo.memoSort === memoSort) &&
        (!term ||
          memo.memoTitle.toLowerCase().includes(term) ||
          memo.memoCnnt.toLowerCase().includes(term)),
    );
  }
}

export async function getMemo(memoId: number) {
  try {
    return await request<Memo>(`${MEMO_API_URL}/${memoId}`);
  } catch {
    const memo = readLocal().find((item) => item.memoId === memoId);
    if (!memo) throw new Error("Memo was not found.");
    return memo;
  }
}

export async function createMemo(payload: MemoPayload) {
  try {
    return await request<Memo>(MEMO_API_URL, {
      method: "POST",
      headers: jsonHeaders,
      body: JSON.stringify(payload),
    });
  } catch {
    const memo: Memo = {
      memoId: Date.now(),
      ...payload,
      createdAt: now(),
      updatedAt: now(),
    };
    writeLocal(sortMemos([...readLocal(), memo]));
    return memo;
  }
}

export async function updateMemo(memoId: number, payload: MemoPayload) {
  try {
    return await request<Memo>(`${MEMO_API_URL}/${memoId}`, {
      method: "PUT",
      headers: jsonHeaders,
      body: JSON.stringify(payload),
    });
  } catch {
    const memos = readLocal().map((memo) =>
      memo.memoId === memoId ? { ...memo, ...payload, updatedAt: now() } : memo,
    );
    writeLocal(sortMemos(memos));
    const updated = memos.find((memo) => memo.memoId === memoId);
    if (!updated) throw new Error("Memo was not found.");
    return updated;
  }
}

export async function deleteMemo(memoId: number) {
  try {
    await request<void>(`${MEMO_API_URL}/${memoId}`, { method: "DELETE" });
  } catch {
    writeLocal(readLocal().filter((memo) => memo.memoId !== memoId));
  }
}
