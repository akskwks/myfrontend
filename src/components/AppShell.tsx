/**
*
* 파일명 : AppShell.tsx
* 역할 : 사이드바와 본문, 푸터를 배치하는 공통 화면 레이아웃
* 생성일 : 2026-09-17
*
**/

import type { ReactNode } from "react";
import { Sidebar, type AppSection } from "./Sidebar";
import { AppFooter } from "./AppFooter";

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
        <AppFooter />
      </main>
    </div>
  );
}
