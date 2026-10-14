import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
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

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserInfo | null>(null);
  const [checking, setChecking] = useState(true);
  const [startupError, setStartupError] = useState("");

  useEffect(() => {
    let active = true;
    getCurrentUser()
      .then((currentUser) => {
        if (active) setUser(currentUser);
      })
      .catch((error: unknown) => {
        if (active && !(error instanceof ApiError && error.status === 401)) {
          setStartupError("서버에 연결하지 못했습니다. 잠시 후 다시 시도해 주세요.");
        }
      })
      .finally(() => {
        if (active) setChecking(false);
      });
    const requireUser = () => {
      clearCsrfToken();
      setUser(null);
      location.hash = "#/login";
    };
    window.addEventListener(USER_REQUIRED_EVENT, requireUser);
    return () => {
      active = false;
      window.removeEventListener(USER_REQUIRED_EVENT, requireUser);
    };
  }, []);

  async function signIn(credentials: LoginCredentials) {
    const currentUser = await login(credentials);
    setStartupError("");
    location.hash = "#/";
    setUser(currentUser);
  }

  async function signOut() {
    await logout();
    location.hash = "#/login";
    setUser(null);
  }

  return (
    <UserContext.Provider value={{ user, checking, startupError, signIn, signOut }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (!context) throw new Error("UserProvider is missing.");
  return context;
}
