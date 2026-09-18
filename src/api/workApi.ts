import { ApiError, jsonHeaders, request } from "./http";
import type { Work, WorkPayload } from "../types/work";

const WORK_API_URL = "/api/works";
const LOCAL_KEY = "myapp.works";

const now = () => new Date().toISOString();

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
    `${b.workDate} ${b.updatedAt}`.localeCompare(`${a.workDate} ${a.updatedAt}`),
  );
}

export async function getWorks(workDate = "") {
  try {
    const query = workDate ? `?date=${encodeURIComponent(workDate)}` : "";
    return await request<Work[]>(`${WORK_API_URL}${query}`);
  } catch (error) {
    if (error instanceof ApiError) throw error;
    const works = sortWorks(readLocal());
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

export async function createWork(payload: WorkPayload) {
  try {
    return await request<Work>(WORK_API_URL, {
      method: "POST",
      headers: jsonHeaders,
      body: JSON.stringify(payload),
    });
  } catch (error) {
    if (error instanceof ApiError) throw error;
    const work: Work = {
      workId: Date.now(),
      ...payload,
      createdAt: now(),
      updatedAt: now(),
    };
    writeLocal(sortWorks([...readLocal(), work]));
    return work;
  }
}

export async function updateWork(workId: number, payload: WorkPayload) {
  try {
    return await request<Work>(`${WORK_API_URL}/${workId}`, {
      method: "PUT",
      headers: jsonHeaders,
      body: JSON.stringify(payload),
    });
  } catch (error) {
    if (error instanceof ApiError) throw error;
    const works = readLocal().map((work) =>
      work.workId === workId ? { ...work, ...payload, updatedAt: now() } : work,
    );
    writeLocal(sortWorks(works));
    const updated = works.find((work) => work.workId === workId);
    if (!updated) throw new Error("Work was not found.");
    return updated;
  }
}

export async function deleteWork(workId: number) {
  try {
    await request<void>(`${WORK_API_URL}/${workId}`, { method: "DELETE" });
  } catch (error) {
    if (error instanceof ApiError) throw error;
    writeLocal(readLocal().filter((work) => work.workId !== workId));
  }
}
