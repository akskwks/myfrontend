/**
*
* 파일명 : http.ts
* 역할 : CSRF, 인증 오류, GET 요청 공유를 처리하는 공통 HTTP 요청 모듈
* 생성일 : 2026-09-17
*
**/

export class ApiError extends Error {
  status: number;
  code?: string;

  constructor(
    message: string,
    status: number,
    code?: string,
  ) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
  }
}

export const USER_REQUIRED_EVENT = "myapp:user-required";

let csrfToken: string | null = null;
let csrfRequest: Promise<string> | null = null;
const inFlightGets = new Map<string, Promise<unknown>>();

export function clearCsrfToken() {
  csrfToken = null;
  csrfRequest = null;
  inFlightGets.clear();
}

async function getCsrfToken() {
  if (csrfToken) return csrfToken;
  if (!csrfRequest) {
    csrfRequest = fetch("/api/user/csrf", { credentials: "same-origin" })
      .then(async (response) => {
        if (!response.ok) {
          if (response.status === 401) {
            window.dispatchEvent(new Event(USER_REQUIRED_EVENT));
          }
          throw new ApiError("인증 정보를 확인하지 못했습니다.", response.status);
        }
        const body = (await response.json()) as { token: string };
        csrfToken = body.token;
        return body.token;
      })
      .finally(() => {
        csrfRequest = null;
      });
  }
  return csrfRequest;
}

async function performRequest<T>(url: string, options?: RequestInit): Promise<T> {
  const method = options?.method?.toUpperCase() ?? "GET";
  const headers = new Headers(options?.headers);
  if (!["GET", "HEAD", "OPTIONS"].includes(method)) {
    headers.set("X-CSRF-TOKEN", await getCsrfToken());
  }
  const response = await fetch(url, {
    ...options,
    credentials: "same-origin",
    headers,
  });

  if (!response.ok) {
    if (response.status === 401 && (!url.startsWith("/api/user/") || url === "/api/user/logout")) {
      window.dispatchEvent(new Event(USER_REQUIRED_EVENT));
    }
    const errorBody = await response
      .json()
      .catch(() => null) as {
        message?: string;
        detail?: string;
        code?: string;
      } | null;
    throw new ApiError(
      errorBody?.message ??
        errorBody?.detail ??
        `요청 처리에 실패했습니다. (${response.status})`,
      response.status,
      errorBody?.code,
    );
  }

  if (response.status === 204) return undefined as T;
  const body = await response.text();
  return body ? JSON.parse(body) as T : undefined as T;
}

export function request<T>(url: string, options?: RequestInit): Promise<T> {
  const method = options?.method?.toUpperCase() ?? "GET";
  if (method !== "GET") {
    inFlightGets.clear();
    return performRequest<T>(url, options);
  }

  // StrictMode may start the same mount-time lookup twice; share only that pending request.
  if (options?.signal) return performRequest<T>(url, options);
  const headers = new Headers(options?.headers);
  const key = `${url}\n${JSON.stringify([...headers.entries()])}`;
  const pending = inFlightGets.get(key);
  if (pending) return pending as Promise<T>;

  const current = performRequest<T>(url, options).finally(() => {
    if (inFlightGets.get(key) === current) inFlightGets.delete(key);
  });
  inFlightGets.set(key, current);
  return current;
}

export const jsonHeaders = { "Content-Type": "application/json" };
