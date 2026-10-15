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
