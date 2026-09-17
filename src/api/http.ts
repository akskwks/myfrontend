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

export async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(url, options);

  if (!response.ok) {
    const errorBody = await response
      .json()
      .catch(() => null) as { message?: string; code?: string } | null;
    throw new ApiError(
      errorBody?.message ?? `요청 처리에 실패했습니다. (${response.status})`,
      response.status,
      errorBody?.code,
    );
  }

  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

export const jsonHeaders = { "Content-Type": "application/json" };
