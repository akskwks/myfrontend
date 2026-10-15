export type SystemLogSummary = {
  logId: number;
  userName: string;
  methodType: string;
  apiUrl: string;
  successYn: "Y" | "N";
  requestAt: string;
  responseAt: string;
};

export type SystemLogDetail = {
  logId: number;
  requestJson: string | null;
  responseJson: string | null;
};

export type SystemLogPageResult = {
  content: SystemLogSummary[];
  totalElements: number;
  totalPages: number;
  number: number;
};

export type SystemLogFilters = {
  keyword: string;
  methodType: string;
  successYn: string;
};
