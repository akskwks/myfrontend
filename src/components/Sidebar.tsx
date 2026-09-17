import {
  CalendarDays,
  Home,
  MessageSquareText,
  NotebookPen,
  Sparkles,
} from "lucide-react";

export type AppSection = "main" | "calendar" | "memo" | "ai";

const menuItems = [
  { key: "main", label: "홈", href: "#/", icon: Home },
  { key: "calendar", label: "캘린더", href: "#/calendar", icon: CalendarDays },
  { key: "memo", label: "메모", href: "#/memos", icon: NotebookPen },
  { key: "ai", label: "AI 챗봇", href: "#/ai", icon: MessageSquareText },
] as const;

export function Sidebar({ active }: { active: AppSection }) {
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

      <div className="sidebar-status">
        <Sparkles size={17} aria-hidden="true" />
        <span>
          <strong>Local AI</strong>
          <small>Qwen 2.5</small>
        </span>
      </div>
    </aside>
  );
}
