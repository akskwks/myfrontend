import { StrictMode, useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import "./style.css";
import { AppDialogProvider } from "./components/AppDialog";
import { UserProvider, useUser } from "./user/UserContext";
import { UserPage } from "./pages/UserPage";
import { AiPage } from "./pages/AiPage";
import { CalendarPage } from "./pages/CalendarPage";
import { MainPage } from "./pages/MainPage";
import { MemoPage } from "./pages/MemoPage";
import { WorkPage } from "./pages/WorkPage";
import { SystemLogPage } from "./pages/SystemLogPage";
import { AppShell } from "./components/AppShell";

function App() {
  const { user } = useUser();
  const [hash, setHash] = useState(location.hash);

  useEffect(() => {
    const route = () => {
      window.scrollTo({ top: 0 });
      setHash(location.hash);
    };
    window.addEventListener("hashchange", route);
    return () => window.removeEventListener("hashchange", route);
  }, []);

  const [path] = hash.slice(1).split("?");
  if (path === "/calendar") return <CalendarPage />;
  if (path === "/memos" || path.startsWith("/memos/")) return <MemoPage />;
  if (path === "/works" || path.startsWith("/works/")) return <WorkPage />;
  if (path === "/ai") {
    return <AiPage />;
  }
  if (path === "/logs") {
    return user?.role === "ADMIN" ? <SystemLogPage /> : (
      <AppShell active="main" className="system-log-page-content">
        <div className="system-log-denied" role="alert">시스템 로그는 관리자만 조회할 수 있습니다.</div>
      </AppShell>
    );
  }
  return <MainPage />;
}

function UserGate() {
  const { user, checking } = useUser();
  if (checking) return <main className="auth-page"><div className="auth-loading" role="status">로그인 상태 확인 중...</div></main>;
  if (!user) return <UserPage />;
  return <App />;
}

const root = document.querySelector<HTMLDivElement>("#app");
if (!root) throw new Error("App root was not found.");

createRoot(root).render(
  <StrictMode>
    <AppDialogProvider>
      <UserProvider>
        <UserGate />
      </UserProvider>
    </AppDialogProvider>
  </StrictMode>,
);
