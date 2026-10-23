/**
*
* 파일명 : UserContext.tsx
* 역할 : 로그인 사용자 상태와 로그인·로그아웃 동작을 제공하는 컨텍스트
* 생성일 : 2026-10-14
*
**/

import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { getCurrentUser, login, logout, type UserInfo, type LoginCredentials } from "../api/userApi";
import { USER_REQUIRED_EVENT, ApiError, clearCsrfToken } from "../api/http";

type UserContextValue = {
  user: UserInfo | null;
  checking: boolean;
  startupError: string;
  signIn: (credentials: LoginCredentials) => Promise<void>;
  signOut: () => Promise<void>;
};

const UserContext = createContext<UserContextValue | null>(null);
const sessionMarker = "myapp:authenticated-session";

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserInfo | null>(null);
  const [checking, setChecking] = useState(true);
  const [startupError, setStartupError] = useState("");
  const [sessionExpired, setSessionExpired] = useState(false);
  const authenticatedRef = useRef(false);

  useEffect(() => {
    let active = true;
    const requireUser = () => {
      const hadSession = authenticatedRef.current || sessionStorage.getItem(sessionMarker) === "1";
      authenticatedRef.current = false;
      sessionStorage.removeItem(sessionMarker);
      clearCsrfToken();
      setUser(null);
      location.hash = "#/login";
      if (hadSession) setSessionExpired(true);
    };
    getCurrentUser()
      .then((currentUser) => {
        if (active) {
          authenticatedRef.current = true;
          sessionStorage.setItem(sessionMarker, "1");
          setUser(currentUser);
        }
      })
      .catch((error: unknown) => {
        if (active) {
          if (error instanceof ApiError && error.status === 401) requireUser();
          else setStartupError("서버에 연결하지 못했습니다. 잠시 후 다시 시도해 주세요.");
        }
      })
      .finally(() => {
        if (active) setChecking(false);
      });
    window.addEventListener(USER_REQUIRED_EVENT, requireUser);
    return () => {
      active = false;
      window.removeEventListener(USER_REQUIRED_EVENT, requireUser);
    };
  }, []);

  useEffect(() => {
    if (!sessionExpired) return;
    const timer = window.setTimeout(() => setSessionExpired(false), 3000);
    return () => window.clearTimeout(timer);
  }, [sessionExpired]);

  async function signIn(credentials: LoginCredentials) {
    const currentUser = await login(credentials);
    authenticatedRef.current = true;
    sessionStorage.setItem(sessionMarker, "1");
    setSessionExpired(false);
    setStartupError("");
    location.hash = "#/";
    setUser(currentUser);
  }

  async function signOut() {
    await logout();
    authenticatedRef.current = false;
    sessionStorage.removeItem(sessionMarker);
    setSessionExpired(false);
    location.hash = "#/login";
    setUser(null);
  }

  return (
    <UserContext.Provider value={{ user, checking, startupError, signIn, signOut }}>
      {children}
      {sessionExpired && (
        <div className="session-expired-toast" role="alert">
          세션이 만료되었습니다. 다시 로그인해 주세요.
        </div>
      )}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (!context) throw new Error("UserProvider is missing.");
  return context;
}
