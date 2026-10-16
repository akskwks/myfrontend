/**
*
* 파일명 : userApi.ts
* 역할 : 회원가입, 로그인, 로그아웃 및 현재 사용자 API 호출을 모아 둔 파일
* 생성일 : 2026-10-14
*
**/

import { clearCsrfToken, jsonHeaders, request } from "./http";

export type UserInfo = {
  userNum: number;
  userId: string;
  userName: string;
  role: "ADMIN" | "USER";
};

export type LoginCredentials = {
  userId: string;
  password: string;
};

export type Registration = LoginCredentials & {
  userName: string;
  passwordConfirm: string;
};

export function getCurrentUser() {
  return request<UserInfo>("/api/user/me");
}

export async function login(credentials: LoginCredentials) {
  const user = await request<UserInfo>("/api/user/login", {
    method: "POST",
    headers: jsonHeaders,
    body: JSON.stringify(credentials),
  });
  clearCsrfToken();
  return user;
}

export function register(data: Registration) {
  return request<UserInfo>("/api/user/register", {
    method: "POST",
    headers: jsonHeaders,
    body: JSON.stringify(data),
  });
}

export async function logout() {
  await request<void>("/api/user/logout", { method: "POST" });
  clearCsrfToken();
}
