type TopbarProps = {
  active: "main" | "calendar" | "memo" | "ai";
};

export function Topbar({ active }: TopbarProps) {
  return (
    <nav className="topbar" aria-label="주요 메뉴">
      <a className="brand" href="#/" aria-label="MyApp 홈">
        <span className="brand-mark">M</span>
        <span>MyApp</span>
      </a>
      <div className="nav-links">
        <a className={active === "main" ? "is-current" : ""} href="#/">
          홈
        </a>
        <a className={active === "calendar" ? "is-current" : ""} href="#/calendar">
          캘린더
        </a>
        <a className={active === "memo" ? "is-current" : ""} href="#/memos">
          메모
        </a>
        <a className={active === "ai" ? "is-current" : ""} href="#/ai">
          AI
        </a>
      </div>
    </nav>
  );
}
