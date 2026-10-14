import {
  BriefcaseBusiness,
  CalendarDays,
  Home,
  MessageSquareText,
  NotebookPen,
  LogOut,
  UserRound,
} from "lucide-react";
import { useState } from "react";
import { useUser } from "../user/UserContext";

export type AppSection = "main" | "calendar" | "memo" | "work" | "ai";

const menuItems = [
  { key: "main", label: "홈", href: "#/", icon: Home },
  { key: "calendar", label: "캘린더", href: "#/calendar", icon: CalendarDays },
  { key: "work", label: "업무", href: "#/works", icon: BriefcaseBusiness },
  { key: "memo", label: "메모", href: "#/memos", icon: NotebookPen },
  { key: "ai", label: "AI 챗봇", href: "#/ai", icon: MessageSquareText },
] as const;

export function Sidebar({ active }: { active: AppSection }) {
  const { user, signOut } = useUser();
  const [logoutError, setLogoutError] = useState("");
  const [loggingOut, setLoggingOut] = useState(false);

  async function handleLogout() {
    setLoggingOut(true);
    setLogoutError("");
    try {
      await signOut();
    } catch (error) {
      setLogoutError(error instanceof Error ? error.message : "로그아웃에 실패했습니다.");
    } finally {
      setLoggingOut(false);
    }
  }

  return (
    <aside className="app-sidebar">
      <a className="sidebar-brand" href="#/" aria-label="MyApp 홈">
        <span className="brand-mark">M</span>
        <span>
          <strong>MyApp</strong>
          <small>AI workspace</small>
        </span>
      </a>

      <nav className="sidebar-nav" aria-label="주요 메뉴">
        {menuItems.map(({ key, label, href, icon: Icon }) => (
          <a
            className={active === key ? "is-current" : ""}
            href={href}
            key={key}
            aria-current={active === key ? "page" : undefined}
            title={label}
          >
            <Icon size={19} strokeWidth={2} aria-hidden="true" />
            <span>{label}</span>
          </a>
        ))}
      </nav>

      <div className="sidebar-account">
        <UserRound size={18} aria-hidden="true" />
        <span>
          <strong>{user?.userName}</strong>
          <small>{user?.role === "ADMIN" ? "관리자" : "사용자"}</small>
        </span>
        <button type="button" onClick={handleLogout} disabled={loggingOut} title="로그아웃" aria-label="로그아웃"><LogOut size={18} /></button>
      </div>
      {logoutError && <p className="sidebar-account-error" role="alert">{logoutError}</p>}
    </aside>
  );
}
