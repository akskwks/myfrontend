import { StrictMode, useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import "./style.css";
import { AiPage } from "./pages/AiPage";
import { CalendarPage } from "./pages/CalendarPage";
import { MainPage } from "./pages/MainPage";
import { MemoPage } from "./pages/MemoPage";
import { WorkPage } from "./pages/WorkPage";

function App() {
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
  return <MainPage />;
}

const root = document.querySelector<HTMLDivElement>("#app");
if (!root) throw new Error("App root was not found.");

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
