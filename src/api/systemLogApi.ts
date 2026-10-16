/**
*
* 파일명 : systemLogApi.ts
* 역할 : 관리자 감사 로그 목록·상세 백엔드 API 호출을 모아 둔 파일
* 생성일 : 2026-10-15
*
**/

import { request } from "./http";
import type { SystemLogDetail, SystemLogFilters, SystemLogPageResult } from "../types/systemLog";

export function getSystemLogs(filters: SystemLogFilters, page: number) {
  const params = new URLSearchParams({ page: String(page), size: "50" });
  if (filters.keyword.trim()) params.set("keyword", filters.keyword.trim());
  if (filters.methodType) params.set("methodType", filters.methodType);
  if (filters.successYn) params.set("successYn", filters.successYn);
  return request<SystemLogPageResult>(`/api/logs?${params}`);
}

export function getSystemLogDetail(id: number) {
  return request<SystemLogDetail>(`/api/logs/${id}`);
}
