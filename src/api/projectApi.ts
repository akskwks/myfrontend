/**
*
* 파일명 : projectApi.ts
* 역할 : 프로젝트 목록 및 등록·수정·삭제 백엔드 API 호출을 모아 둔 파일
* 생성일 : 2026-09-18
*
**/

import { ApiError, jsonHeaders, request } from "./http";
import type { WorkProject, WorkProjectPayload } from "../types/projectList";

const PROJECT_API_URL = "/api/projects";

export async function getWorkProjects() {
  return request<WorkProject[]>(PROJECT_API_URL);
}

export async function getWorkProject(projectId: number) {
  const project = (await getWorkProjects()).find((item) => item.projectId === projectId);
  if (!project) throw new ApiError("프로젝트를 찾을 수 없습니다.", 404);
  return project;
}

export async function createWorkProject(payload: WorkProjectPayload) {
  return request<WorkProject>(PROJECT_API_URL, {
    method: "POST",
    headers: jsonHeaders,
    body: JSON.stringify(payload),
  });
}

export async function updateWorkProject(
  projectId: number,
  payload: WorkProjectPayload,
) {
  return request<WorkProject>(`${PROJECT_API_URL}/${projectId}`, {
    method: "PUT",
    headers: jsonHeaders,
    body: JSON.stringify(payload),
  });
}

export async function deleteWorkProject(projectId: number) {
  return request<void>(`${PROJECT_API_URL}/${projectId}`, { method: "DELETE" });
}
