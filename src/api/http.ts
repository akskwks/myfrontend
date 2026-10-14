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

export function clearCsrfToken() {
  csrfToken = null;
  csrfRequest = null;
}

async function getCsrfToken() {
  if (csrfToken) return csrfToken;
  if (!csrfRequest) {
    csrfRequest = fetch("/api/user/csrf", { credentials: "same-origin" })
      .then(async (response) => {
        if (!response.ok) {
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

export async function request<T>(url: string, options?: RequestInit): Promise<T> {
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
    if (response.status === 401 && !url.startsWith("/api/user/")) {
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
  return response.json() as Promise<T>;
}

export const jsonHeaders = { "Content-Type": "application/json" };
