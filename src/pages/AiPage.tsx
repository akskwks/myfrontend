import { useState, type FormEvent } from "react";
import { askLlm } from "../api/aichatApi";
import { Topbar } from "../components/Topbar";
import type { ChatMessage } from "../types/aichat";

const suggestions = [
  "오늘 해야 할 일을 우선순위로 정리하는 방법을 알려줘.",
  "회의록을 깔끔하게 정리하는 템플릿을 만들어줘.",
  "React 코드 메모를 남길 때 어떤 내용을 함께 적으면 좋을까?",
];

export function AiPage() {
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const message = question.trim();
    if (!message || loading) return;

    const userMessage: ChatMessage = {
      id: Date.now(),
      role: "user",
      content: message,
    };
    setMessages((current) => [...current, userMessage]);
    setQuestion("");
    setError("");
    setLoading(true);

    try {
      const response = await askLlm({ message });
      setMessages((current) => [
        ...current,
        { id: Date.now() + 1, role: "assistant", content: response.answer },
      ]);
    } catch {
      setError(
        "AI 응답을 불러오지 못했습니다. 백엔드와 Ollama 실행 상태를 확인해 주세요.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="shell ai-page">
      <Topbar active="ai" />

      <header className="page-header ai-page-header">
        <div>
          <a className="back-link" href="#/">
            ← 메인으로
          </a>
          <p className="eyebrow">AI Chat</p>
          <h1>CHAT BOT</h1>
          <p>Spring Boot를 거쳐 Ollama와 Qwen 2.5의 답변을 받아봅니다.</p>
        </div>
        <span className="stage-badge">Ollama · Qwen 2.5</span>
      </header>

      <section className="chat-panel" aria-label="AI 대화">
        <div className="chat-log" aria-live="polite">
          {messages.length === 0 ? (
            <div className="chat-empty">
              <span className="chat-symbol">AI</span>
              <h2>첫 질문을 입력해 보세요.</h2>
              <div className="suggestion-list">
                {suggestions.map((suggestion) => (
                  <button
                    key={suggestion}
                    type="button"
                    onClick={() => setQuestion(suggestion)}
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((message) => (
              <article
                className={`chat-message ${message.role}`}
                key={message.id}
              >
                <strong>{message.role === "user" ? "나" : "AI"}</strong>
                <MessageContent content={message.content} />
              </article>
            ))
          )}
          {loading && (
            <p className="chat-loading">답변을 생성하고 있습니다...</p>
          )}
        </div>

        <form className="chat-form" onSubmit={submit}>
          <label htmlFor="aiQuestion">질문</label>
          <div className="chat-input-row">
            <textarea
              id="aiQuestion"
              rows={3}
              maxLength={4000}
              value={question}
              onChange={(event) => setQuestion(event.target.value)}
              placeholder="AI에게 궁금한 내용을 입력하세요."
              disabled={loading}
              required
            />
            <button
              className="primary-button"
              type="submit"
              disabled={loading || !question.trim()}
            >
              {loading ? "요청 중" : "보내기"}
            </button>
          </div>
          <div className="chat-form-meta">
            <span>{question.length.toLocaleString()} / 4,000</span>
            {error && <p role="alert">{error}</p>}
          </div>
        </form>
      </section>
    </main>
  );
}

function MessageContent({ content }: { content: string }) {
  const parts = content.split(/```/g);
  return (
    <>
      {parts.map((part, index) =>
        index % 2 === 1 ? (
          <pre key={index}>{part.trim()}</pre>
        ) : (
          <p key={index}>{part}</p>
        ),
      )}
    </>
  );
}
