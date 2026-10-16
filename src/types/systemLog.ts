/**
*
* 파일명 : systemLog.ts
* 역할 : 감사 로그 목록, 상세, 검색 조건의 TypeScript 타입을 정의하는 파일
* 생성일 : 2026-10-15
*
**/

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
