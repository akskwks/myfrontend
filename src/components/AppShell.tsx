import type { ReactNode } from "react";
import { Sidebar, type AppSection } from "./Sidebar";

type AppShellProps = {
  active: AppSection;
  children: ReactNode;
  className?: string;
  scrollable?: boolean;
};

export function AppShell({
  active,
  children,
  className = "",
  scrollable = false,
}: AppShellProps) {
  return (
    <div className="app-layout">
      <Sidebar active={active} />
      <main
        className={`app-main ${scrollable ? "is-scrollable" : ""} ${className}`.trim()}
      >
        {children}
      </main>
    </div>
  );
}
