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
