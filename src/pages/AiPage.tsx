import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  askLlm,
  createConversation,
  deleteConversation,
  getConversationMessages,
  getConversations,
} from "../api/aichatApi";
import { ApiError } from "../api/http";
import { Topbar } from "../components/Topbar";
import type { AiConversation, ChatMessage } from "../types/aichat";

const suggestions = [
  "오늘 일정 알려줘.",
  "내일 오후 3시에 프로젝트 회의 일정 추가해줘.",
  "오늘 작성한 업무 메모를 요약해줘.",
];

export function AiPage() {
  const [conversations, setConversations] = useState<AiConversation[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [error, setError] = useState("");
  const chatEndRef = useRef<HTMLDivElement>(null);

  const selectedConversation = conversations.find(
    (conversation) => conversation.conversationId === selectedId,
  );

  useEffect(() => {
    let active = true;
    getConversations()
      .then((items) => {
        if (!active) return;
        setConversations(items);
        setSelectedId((current) => current ?? items[0]?.conversationId ?? null);
      })
      .catch((cause) => active && setError(getErrorMessage(cause)))
      .finally(() => active && setPageLoading(false));
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!selectedId) {
      setMessages([]);
      return;
    }
    let active = true;
    setPageLoading(true);
    setError("");
    getConversationMessages(selectedId)
      .then((items) => active && setMessages(items))
      .catch((cause) => active && setError(getErrorMessage(cause)))
      .finally(() => active && setPageLoading(false));
    return () => {
      active = false;
    };
  }, [selectedId]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, loading]);

  async function refreshConversations(nextSelectedId?: number) {
    const items = await getConversations();
    setConversations(items);
    if (nextSelectedId) setSelectedId(nextSelectedId);
  }

  async function startConversation() {
    if (loading) return;
    setError("");
    try {
      const conversation = await createConversation();
      setConversations((current) => [conversation, ...current]);
      setSelectedId(conversation.conversationId);
      setMessages([]);
      setQuestion("");
    } catch (cause) {
      setError(getErrorMessage(cause));
    }
  }

  async function removeConversation(conversationId: number) {
    if (!window.confirm("이 대화와 메시지를 모두 삭제할까요?")) return;
    try {
      await deleteConversation(conversationId);
      const remaining = conversations.filter(
        (conversation) => conversation.conversationId !== conversationId,
      );
      setConversations(remaining);
      if (selectedId === conversationId) {
        setSelectedId(remaining[0]?.conversationId ?? null);
        setMessages([]);
      }
    } catch (cause) {
      setError(getErrorMessage(cause));
    }
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const message = question.trim();
    if (!message || loading) return;

    const optimisticMessage: ChatMessage = {
      messageId: -Date.now(),
      conversationId: selectedId ?? 0,
      role: "user",
      content: message,
      createdAt: new Date().toISOString(),
    };
    setMessages((current) => [...current, optimisticMessage]);
    setQuestion("");
    setError("");
    setLoading(true);

    try {
      const response = await askLlm({ conversationId: selectedId, message });
      setMessages((current) => [...current, response.message]);
      await refreshConversations(response.conversationId);
    } catch (cause) {
      setError(getErrorMessage(cause));
    } finally {
      setLoading(false);
    }
  }

  function handleQuestionKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
      event.preventDefault();
      event.currentTarget.form?.requestSubmit();
    }
  }

  return (
    <main className="shell ai-page">
      <Topbar active="ai" />
      <header className="page-header compact-header ai-page-header">
        <div>
          <a className="back-link" href="#/">← 메인으로</a>
          <p className="eyebrow">MyApp Assistant</p>
          <h1>AI 챗봇</h1>
          <p>일정과 메모를 자연어로 조회하고 정리할 수 있습니다.</p>
        </div>
        <span className="stage-badge">Ollama · Qwen 2.5</span>
      </header>

      <section className="ai-workspace" aria-label="AI 대화">
        <aside className="conversation-sidebar">
          <div className="conversation-sidebar-header">
            <div><span>대화</span><strong>{conversations.length}</strong></div>
            <button className="icon-button" type="button" title="새 대화" aria-label="새 대화" onClick={startConversation}>+</button>
          </div>
          <div className="conversation-list">
            {conversations.map((conversation) => (
              <div className={`conversation-item ${selectedId === conversation.conversationId ? "is-current" : ""}`} key={conversation.conversationId}>
                <button type="button" onClick={() => setSelectedId(conversation.conversationId)}>
                  <strong>{conversation.title}</strong>
                  <span>{formatConversationDate(conversation.updatedAt)}</span>
                </button>
                <button className="conversation-delete" type="button" title="대화 삭제" aria-label={`${conversation.title} 삭제`} onClick={() => removeConversation(conversation.conversationId)}>×</button>
              </div>
            ))}
            {!pageLoading && conversations.length === 0 && <p className="conversation-empty">저장된 대화가 없습니다.</p>}
          </div>
        </aside>

        <div className="chat-panel">
          <div className="chat-panel-header">
            <div><strong>{selectedConversation?.title ?? "새 대화"}</strong><span>{loading ? "답변 생성 중" : "준비됨"}</span></div>
          </div>
          <div className="chat-log" aria-live="polite">
            {pageLoading && messages.length === 0 ? (
              <p className="chat-status">대화를 불러오고 있습니다.</p>
            ) : messages.length === 0 ? (
              <div className="chat-empty">
                <span className="chat-symbol">AI</span>
                <h2>무엇을 도와드릴까요?</h2>
                <p>일정 조회·등록, 메모 검색·요약 또는 일반 질문을 입력하세요.</p>
                <div className="suggestion-list">
                  {suggestions.map((suggestion) => <button key={suggestion} type="button" onClick={() => setQuestion(suggestion)}>{suggestion}</button>)}
                </div>
              </div>
            ) : (
              messages.map((message) => (
                <article className={`chat-message ${message.role}`} key={message.messageId}>
                  <header><strong>{message.role === "user" ? "나" : "AI"}</strong><time>{formatMessageTime(message.createdAt)}</time></header>
                  <MessageContent content={message.content} />
                </article>
              ))
            )}
            {loading && <div className="chat-loading" role="status"><span /><span /><span /><em>답변을 생성하고 있습니다.</em></div>}
            {error && <p className="chat-error" role="alert">{error}</p>}
            <div ref={chatEndRef} />
          </div>

          <form className="chat-form" onSubmit={submit}>
            <label htmlFor="aiQuestion">메시지</label>
            <div className="chat-input-row">
              <textarea id="aiQuestion" rows={3} maxLength={4000} value={question} onChange={(event) => setQuestion(event.target.value)} onKeyDown={handleQuestionKeyDown} placeholder="메시지를 입력하세요. Enter로 전송, Shift+Enter로 줄바꿈" disabled={loading} required />
              <button className="primary-button" type="submit" disabled={loading || !question.trim()}>{loading ? "요청 중" : "보내기"}</button>
            </div>
            <div className="chat-form-meta"><span>{question.length.toLocaleString()} / 4,000</span><span>AI 답변은 중요한 내용을 다시 확인해 주세요.</span></div>
          </form>
        </div>
      </section>
    </main>
  );
}

function MessageContent({ content }: { content: string }) {
  return <div className="chat-markdown"><ReactMarkdown remarkPlugins={[remarkGfm]} components={{ a: (props) => <a {...props} target="_blank" rel="noreferrer" /> }}>{content}</ReactMarkdown></div>;
}

function getErrorMessage(cause: unknown) {
  if (cause instanceof ApiError) return cause.message;
  return "AI 서비스에 연결할 수 없습니다. 백엔드 실행 상태를 확인해 주세요.";
}

function formatMessageTime(value: string) {
  return new Intl.DateTimeFormat("ko-KR", { hour: "2-digit", minute: "2-digit", hour12: false }).format(new Date(value));
}

function formatConversationDate(value: string) {
  const date = new Date(value);
  const today = new Date();
  if (date.getFullYear() === today.getFullYear() && date.getMonth() === today.getMonth() && date.getDate() === today.getDate()) return formatMessageTime(value);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}
