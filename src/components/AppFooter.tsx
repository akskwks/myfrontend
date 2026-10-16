/**
*
* 파일명 : AppFooter.tsx
* 역할 : 개발년도와 개발자명을 표시하는 공통 푸터
* 생성일 : 2026-10-15
*
**/

export function AppFooter() {
  return (
    <footer className="app-footer">
      <span>MyApp</span>
      <span aria-hidden="true">|</span>
      <span>2026</span>
      <span aria-hidden="true">|</span>
      <span>Created By MinJoon</span>
    </footer>
  );
}
