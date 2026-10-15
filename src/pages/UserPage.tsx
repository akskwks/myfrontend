import { useEffect, useState, type FormEvent } from "react";
import { Eye, EyeOff, LockKeyhole } from "lucide-react";
import { register } from "../api/userApi";
import { useAppDialog } from "../components/AppDialog";
import { useUser } from "../user/UserContext";

export function UserPage() {
  const { signIn, startupError } = useUser();
  const dialog = useAppDialog();
  const [mode, setMode] = useState<"login" | "register">(location.hash === "#/register" ? "register" : "login");
  const [userId, setUserId] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [userName, setUserName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const syncRoute = () => {
      if (location.hash === "#/register") {
        setMode("register");
      } else {
        setMode("login");
        if (location.hash !== "#/login") location.hash = "#/login";
      }
    };
    syncRoute();
    window.addEventListener("hashchange", syncRoute);
    return () => window.removeEventListener("hashchange", syncRoute);
  }, []);

  function changeMode(nextMode: "login" | "register") {
    setMode(nextMode);
    setError("");
    setPassword("");
    setPasswordConfirm("");
    location.hash = nextMode === "register" ? "#/register" : "#/login";
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    if (!userId.trim() || !password) {
      setError("아이디와 비밀번호를 입력해 주세요.");
      return;
    }
    if (mode === "register") {
      if (!userName.trim()) {
        setError("사용자명을 입력해 주세요.");
        return;
      }
      if (password !== passwordConfirm) {
        setError("비밀번호가 일치하지 않습니다.");
        return;
      }
    }
    setPending(true);
    try {
      if (mode === "register") {
        await register({ userId: userId.trim(), password, passwordConfirm, userName: userName.trim() });
        await dialog.alert({
          title: "회원가입 완료",
          message: "회원가입이 성공적으로 완료되었습니다. 로그인해 주세요.",
        });
        changeMode("login");
      } else {
        await signIn({ userId: userId.trim(), password });
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "요청을 처리하지 못했습니다.");
    } finally {
      setPending(false);
    }
  }

  return (
    <main className="auth-page">
      <div className="auth-panel">
        <div className="auth-brand"><span className="brand-mark">M</span><strong>MyApp</strong></div>
        <div className="auth-heading">
          <LockKeyhole size={22} aria-hidden="true" />
          <h1>{mode === "login" ? "로그인" : "회원가입"}</h1>
        </div>
        <form onSubmit={submit} noValidate>
          <label htmlFor="auth-user-id">아이디</label>
          <input id="auth-user-id" value={userId} onChange={(event) => setUserId(event.target.value)} autoComplete="username" autoFocus />
          {mode === "register" && <><label htmlFor="auth-user-name">사용자명</label><input id="auth-user-name" value={userName} onChange={(event) => setUserName(event.target.value)} autoComplete="name" /></>}
          <label htmlFor="auth-password">비밀번호</label>
          <div className="auth-password">
            <input id="auth-password" type={showPassword ? "text" : "password"} value={password} onChange={(event) => setPassword(event.target.value)} autoComplete={mode === "login" ? "current-password" : "new-password"} />
            <button type="button" onClick={() => setShowPassword((value) => !value)} title={showPassword ? "비밀번호 숨기기" : "비밀번호 보기"} aria-label={showPassword ? "비밀번호 숨기기" : "비밀번호 보기"}>{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button>
          </div>
          {mode === "register" && <><label htmlFor="auth-confirm">비밀번호 확인</label><input id="auth-confirm" type="password" value={passwordConfirm} onChange={(event) => setPasswordConfirm(event.target.value)} autoComplete="new-password" /></>}
          {(error || (mode === "login" && startupError)) && <p className="auth-error" role="alert">{error || startupError}</p>}
          <button className="auth-submit" type="submit" disabled={pending}>{pending ? "처리 중..." : mode === "login" ? "로그인" : "회원가입"}</button>
        </form>
        <div className="auth-switch">
          <span>{mode === "login" ? "계정이 없으신가요?" : "이미 계정이 있으신가요?"}</span>
          <button type="button" onClick={() => changeMode(mode === "login" ? "register" : "login")}>{mode === "login" ? "회원가입" : "로그인"}</button>
        </div>
      </div>
    </main>
  );
}
