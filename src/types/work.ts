export type WorkStatus = "planned" | "in_progress" | "completed" | "on_hold";

export type Work = {
  workId: number;
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
  "workDate" | "workTitle" | "workCnnt" | "workStatus" | "workProgress"
>;
