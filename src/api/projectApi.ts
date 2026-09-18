import { ApiError, jsonHeaders, request } from "./http";
import type { WorkProject, WorkProjectPayload } from "../types/projectList";

const PROJECT_API_URL = "/api/projects";
const LOCAL_KEY = "myapp.projects";

const now = () => new Date().toISOString();

function readLocal(): WorkProject[] {
  const raw = localStorage.getItem(LOCAL_KEY);
  return raw ? (JSON.parse(raw) as WorkProject[]) : [];
}

function writeLocal(projects: WorkProject[]) {
  localStorage.setItem(LOCAL_KEY, JSON.stringify(projects));
}

function sortProjects(projects: WorkProject[]) {
  return [...projects].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export async function getWorkProjects() {
  try {
    return await request<WorkProject[]>(PROJECT_API_URL);
  } catch (error) {
    if (error instanceof ApiError) throw error;
    return sortProjects(readLocal());
  }
}

export async function getWorkProject(projectId: number) {
  try {
    const projects = await request<WorkProject[]>(PROJECT_API_URL);
    const project = projects.find((item) => item.projectId === projectId);
    if (!project) throw new ApiError("프로젝트를 찾을 수 없습니다.", 404);
    return project;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    const project = readLocal().find((item) => item.projectId === projectId);
    if (!project) throw new Error("Project was not found.");
    return project;
  }
}

export async function createWorkProject(payload: WorkProjectPayload) {
  try {
    return await request<WorkProject>(PROJECT_API_URL, {
      method: "POST",
      headers: jsonHeaders,
      body: JSON.stringify(payload),
    });
  } catch (error) {
    if (error instanceof ApiError) throw error;
    const project: WorkProject = {
      projectId: Date.now(),
      ...payload,
      createdAt: now(),
      updatedAt: now(),
    };
    writeLocal(sortProjects([...readLocal(), project]));
    return project;
  }
}

export async function updateWorkProject(
  projectId: number,
  payload: WorkProjectPayload,
) {
  try {
    return await request<WorkProject>(`${PROJECT_API_URL}/${projectId}`, {
      method: "PUT",
      headers: jsonHeaders,
      body: JSON.stringify(payload),
    });
  } catch (error) {
    if (error instanceof ApiError) throw error;
    const projects = readLocal().map((project) =>
      project.projectId === projectId
        ? { ...project, ...payload, updatedAt: now() }
        : project,
    );
    writeLocal(sortProjects(projects));
    const updated = projects.find((project) => project.projectId === projectId);
    if (!updated) throw new Error("Project was not found.");
    return updated;
  }
}

export async function deleteWorkProject(projectId: number) {
  try {
    await request<void>(`${PROJECT_API_URL}/${projectId}`, {
      method: "DELETE",
    });
  } catch (error) {
    if (error instanceof ApiError) throw error;
    const localWorks = JSON.parse(
      localStorage.getItem("myapp.works") ?? "[]",
    ) as { projectId?: number }[];
    if (localWorks.some((work) => work.projectId === projectId)) {
      throw new ApiError(
        "연결된 업무가 있는 프로젝트는 삭제할 수 없습니다.",
        409,
      );
    }
    writeLocal(
      readLocal().filter((project) => project.projectId !== projectId),
    );
  }
}
