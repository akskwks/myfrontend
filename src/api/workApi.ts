/**
*
* 파일명 : workApi.ts
* 역할 : 업무와 업무 첨부파일 백엔드 API 호출을 모아 둔 파일
* 생성일 : 2026-09-18
*
**/

import { request } from "./http";
import type { Work, WorkFile, WorkPayload } from "../types/workList";

const WORK_API_URL = "/api/works";

export async function getWorks(projectId: number, workDate = "") {
  const params = new URLSearchParams({ projectId: String(projectId) });
  if (workDate) params.set("date", workDate);
  return request<Work[]>(`${WORK_API_URL}?${params}`);
}

export async function getWork(workId: number) {
  return request<Work>(`${WORK_API_URL}/${workId}`);
}

export async function createWork(payload: WorkPayload, files: File[] = []) {
  const formData = createWorkFormData(payload, files);
  return await request<Work>(`${WORK_API_URL}/with-files`, {
    method: "POST",
    body: formData,
  });
}

export async function updateWork(
  workId: number,
  payload: WorkPayload,
  files: File[] = [],
  deletedFileIds: number[] = [],
) {
  const formData = createWorkFormData(payload, files, deletedFileIds);
  return await request<Work>(`${WORK_API_URL}/${workId}/with-files`, {
    method: "PUT",
    body: formData,
  });
}

export async function deleteWork(workId: number) {
  return request<void>(`${WORK_API_URL}/${workId}`, { method: "DELETE" });
}

export async function getWorkFiles(workId: number) {
  return await request<WorkFile[]>(`${WORK_API_URL}/${workId}/files`);
}

export function getWorkFileContentUrl(workFileId: number) {
  return `/api/work-files/${workFileId}/content`;
}

export function getWorkFileDownloadUrl(workFileId: number) {
  return `/api/work-files/${workFileId}/download`;
}

function createWorkFormData(
  payload: WorkPayload,
  files: File[],
  deletedFileIds: number[] = [],
) {
  const formData = new FormData();
  formData.append(
    "work",
    new Blob([JSON.stringify(payload)], { type: "application/json" }),
  );
  files.forEach((file) => formData.append("files", file));
  deletedFileIds.forEach((fileId) =>
    formData.append("deletedFileIds", String(fileId)),
  );
  return formData;
}
