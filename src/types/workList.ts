/**
*
* 파일명 : workList.ts
* 역할 : 업무와 첨부파일 데이터의 TypeScript 타입을 정의하는 파일
* 생성일 : 2026-09-18
*
**/

export type WorkStatus = "planned" | "in_progress" | "completed" | "on_hold";

export type Work = {
  workId: number;
  projectId: number;
  workDate: string;
  workTitle: string;
  workCnnt: string;
  workStatus: WorkStatus;
  createdAt: string;
  updatedAt: string;
};

export type WorkPayload = Pick<
  Work,
  "projectId" | "workDate" | "workTitle" | "workCnnt" | "workStatus"
>;

export type WorkFile = {
  workFileId: number;
  workId: number;
  orgnFileName: string;
  fileExtension: string;
  mimeType: string;
  fileSize: number;
  createdAt: string;
};
