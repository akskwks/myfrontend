/**
*
* 파일명 : projectList.ts
* 역할 : 프로젝트 데이터와 진행 상태의 TypeScript 타입을 정의하는 파일
* 생성일 : 2026-09-18
*
**/

export type WorkEnvironment = "office" | "dispatch";
export type ProjectStatus = "planned" | "in_progress" | "completed" | "on_hold";

export type WorkProject = {
  projectId: number;
  workEnvironment: WorkEnvironment;
  projectName: string;
  projectStatus: ProjectStatus;
  startDate: string;
  endDate: string;
  createdAt: string;
  updatedAt: string;
};

export type WorkProjectPayload = Pick<
  WorkProject,
  "workEnvironment" | "projectName" | "projectStatus" | "startDate" | "endDate"
>;
