export type WorkStatus = "planned" | "in_progress" | "completed" | "on_hold";

export type Work = {
  workId: number;
  projectId: number;
  workDate: string;
  workTitle: string;
  workCnnt: string;
  workStatus: WorkStatus;
  workProgress: number;
  createdAt: string;
  updatedAt: string;
};

export type WorkPayload = Pick<
  Work,
  | "projectId"
  | "workDate"
  | "workTitle"
  | "workCnnt"
  | "workStatus"
  | "workProgress"
>;
