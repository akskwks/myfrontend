import { jsonHeaders, request } from "./http";
import type { Memo, MemoPayload, MemoSort } from "../types/memo";

const MEMO_API_URL = "/api/memos";

export async function getMemos(keyword = "", memoSort: MemoSort | "" = "") {
  const params = new URLSearchParams();
  if (keyword.trim()) params.set("keyword", keyword.trim());
  if (memoSort) params.set("memoSort", memoSort);
  const query = params.size ? `?${params.toString()}` : "";
  return request<Memo[]>(`${MEMO_API_URL}${query}`);
}

export async function getMemo(memoId: number) {
  return request<Memo>(`${MEMO_API_URL}/${memoId}`);
}

export async function createMemo(payload: MemoPayload) {
  return request<Memo>(MEMO_API_URL, {
    method: "POST",
    headers: jsonHeaders,
    body: JSON.stringify(payload),
  });
}

export async function updateMemo(memoId: number, payload: MemoPayload) {
  return request<Memo>(`${MEMO_API_URL}/${memoId}`, {
    method: "PUT",
    headers: jsonHeaders,
    body: JSON.stringify(payload),
  });
}

export async function deleteMemo(memoId: number) {
  return request<void>(`${MEMO_API_URL}/${memoId}`, { method: "DELETE" });
}
