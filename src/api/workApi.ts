import { ApiError, request } from "./http";
import type { Work, WorkFile, WorkPayload } from "../types/workList";

const WORK_API_URL = "/api/works";
const LOCAL_KEY = "myapp.works";

function readLocal(): Work[] {
  const raw = localStorage.getItem(LOCAL_KEY);
  if (!raw) return [];
  return JSON.parse(raw) as Work[];
}

function writeLocal(works: Work[]) {
  localStorage.setItem(LOCAL_KEY, JSON.stringify(works));
}

function sortWorks(works: Work[]) {
  return [...works].sort((a, b) =>
    `${b.workDate} ${b.updatedAt}`.localeCompare(
      `${a.workDate} ${a.updatedAt}`,
    ),
  );
}

export async function getWorks(projectId: number, workDate = "") {
  try {
    const params = new URLSearchParams({ projectId: String(projectId) });
    if (workDate) params.set("date", workDate);
    return await request<Work[]>(`${WORK_API_URL}?${params}`);
  } catch (error) {
    if (error instanceof ApiError) throw error;
    const works = sortWorks(readLocal()).filter(
      (work) => work.projectId === projectId,
    );
    return workDate
      ? works.filter((work) => work.workDate === workDate)
      : works;
  }
}

export async function getWork(workId: number) {
  try {
    return await request<Work>(`${WORK_API_URL}/${workId}`);
  } catch (error) {
    if (error instanceof ApiError) throw error;
    const work = readLocal().find((item) => item.workId === workId);
    if (!work) throw new Error("Work was not found.");
    return work;
  }
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
  try {
    await request<void>(`${WORK_API_URL}/${workId}`, { method: "DELETE" });
  } catch (error) {
    if (error instanceof ApiError) throw error;
    writeLocal(readLocal().filter((work) => work.workId !== workId));
  }
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
