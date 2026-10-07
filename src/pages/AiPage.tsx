import {
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent,
} from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Check, Pencil, X } from "lucide-react";
import {
  createConversation,
  deleteConversation,
  getAiRequest,
  getConversationMessages,
  getConversations,
  startAiRequest,
  updateConversationTitle,
} from "../api/aichatApi";
import { ApiError } from "../api/http";
import { AppShell } from "../components/AppShell";
import type { AiConversation, AiChatJob, ChatMessage } from "../types/aichat";

const PENDING_AI_REQUEST_KEY = "myapp.ai.pending-request";

type PendingAiRequest = Pick<AiChatJob, "requestId" | "conversationId">;

function readPendingRequests(): PendingAiRequest[] {
  try {
    const value = localStorage.getItem(PENDING_AI_REQUEST_KEY);
    if (!value) return [];
    const parsed = JSON.parse(value) as PendingAiRequest | PendingAiRequest[];
    return Array.isArray(parsed) ? parsed : [parsed];
  } catch {
    localStorage.removeItem(PENDING_AI_REQUEST_KEY);
    return [];
  }
}

function savePendingRequests(requests: PendingAiRequest[]) {
  if (requests.length) {
    localStorage.setItem(PENDING_AI_REQUEST_KEY, JSON.stringify(requests));
  } else {
    localStorage.removeItem(PENDING_AI_REQUEST_KEY);
  }
}

const suggestions = [
  "오늘 일정 알려줘.",
  "내일 오후 3시에 프로젝트 회의 일정 추가해줘.",
  "오늘 진행한 업무를 요약해줘.",
];

export function AiPage() {
  const [conversations, setConversations] = useState<AiConversation[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [question, setQuestion] = useState("");
  const [pendingRequests, setPendingRequests] = useState<PendingAiRequest[]>(
    readPendingRequests,
  );
  const [startingRequest, setStartingRequest] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [error, setError] = useState("");
  const [editingConversationId, setEditingConversationId] = useState<
    number | null
  >(null);
  const [conversationTitle, setConversationTitle] = useState("");
  const chatEndRef = useRef<HTMLDivElement>(null);
  const selectedRequest = pendingRequests.find(
    (request) => request.conversationId === selectedId,
  );
  const loading = startingRequest || selectedRequest !== undefined;

  const selectedConversation = conversations.find(
    (conversation) => conversation.conversationId === selectedId,
  );

  useEffect(() => {
    let active = true;
    getConversations()
      .then((items) => {
        if (!active) return;
        setConversations(items);
        const requestedId = Number(
          new URLSearchParams(location.hash.split("?")[1] ?? "").get("conversationId"),
        );
        const requestedConversation = items.find(
          (item) => item.conversationId === requestedId,
        );
        setSelectedId(
          (current) =>
            current ??
            requestedConversation?.conversationId ??
            pendingRequests[0]?.conversationId ??
            items[0]?.conversationId ??
            null,
        );
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
    if (pendingRequests.length === 0) return;

    let active = true;
    let timer: number | undefined;
    const requests = pendingRequests;

    const poll = async () => {
      try {
        const results = await Promise.all(
          requests.map(async (request) => {
            try {
              return { request, job: await getAiRequest(request.requestId) };
            } catch (cause) {
              return { request, cause };
            }
          }),
        );
        if (!active) return;

        const completed = results.filter(
          (result) => result.job?.status === "completed",
        );
        const missing = results.filter(
          (result) =>
            result.cause instanceof ApiError && result.cause.status === 404,
        );
        const retryableFailure = results.find(
          (result) => result.cause && !missing.includes(result),
        );

        if (completed.length === 0 && missing.length === 0) {
          if (retryableFailure) setError(getErrorMessage(retryableFailure.cause));
          timer = window.setTimeout(poll, 1500);
          return;
        }

        const conversationItems = await getConversations();
        if (!active) return;
        let messageItems: ChatMessage[] | null = null;
        const selectedFinished = [...completed, ...missing].some(
          (result) => result.request.conversationId === selectedId,
        );
        if (selectedId && selectedFinished) {
          messageItems = await getConversationMessages(selectedId);
        }
        if (!active) return;

        const finishedIds = new Set(
          [...completed, ...missing].map((result) => result.request.requestId),
        );
        setConversations(conversationItems);
        if (messageItems) setMessages(messageItems);
        setError(
          missing.length
            ? "일부 AI 요청 상태를 찾을 수 없어 대화 내역을 다시 불러왔습니다."
            : "",
        );
        setPendingRequests((current) => {
          const next = current.filter(
            (request) => !finishedIds.has(request.requestId),
          );
          savePendingRequests(next);
          return next;
        });
      } catch (cause) {
        if (!active) return;
        setError(getErrorMessage(cause));
        timer = window.setTimeout(poll, 2500);
      }
    };

    poll();
    return () => {
      active = false;
      if (timer !== undefined) window.clearTimeout(timer);
    };
  }, [pendingRequests, selectedId]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, loading]);

  async function refreshConversations(nextSelectedId?: number) {
    const items = await getConversations();
    setConversations(items);
    if (nextSelectedId) setSelectedId(nextSelectedId);
  }

  async function startConversation() {
    if (startingRequest) return;
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

  function startConversationEdit(conversation: AiConversation) {
    setEditingConversationId(conversation.conversationId);
    setConversationTitle(conversation.title);
    setError("");
  }

  async function saveConversationTitle(conversationId: number) {
    const title = conversationTitle.trim();
    const previous = conversations.find(
      (conversation) => conversation.conversationId === conversationId,
    );
    if (!previous) return;
    if (!title) {
      setEditingConversationId(null);
      setConversationTitle("");
      return;
    }

    setEditingConversationId(null);
    setConversations((current) =>
      current.map((conversation) =>
        conversation.conversationId === conversationId
          ? { ...conversation, title }
          : conversation,
      ),
    );

    try {
      const updated = await updateConversationTitle(conversationId, title);
      setConversations((current) =>
        current.map((conversation) =>
          conversation.conversationId === conversationId
            ? updated
            : conversation,
        ),
      );
    } catch (cause) {
      setConversations((current) =>
        current.map((conversation) =>
          conversation.conversationId === conversationId
            ? previous
            : conversation,
        ),
      );
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
    setStartingRequest(true);
    try {
      const job = await startAiRequest({ conversationId: selectedId, message });
      const pending = {
        requestId: job.requestId,
        conversationId: job.conversationId,
      };
      setPendingRequests((current) => {
        const next = [
          ...current.filter(
            (request) => request.conversationId !== pending.conversationId,
          ),
          pending,
        ];
        savePendingRequests(next);
        return next;
      });
      if (selectedId === null) setSelectedId(job.conversationId);
      await refreshConversations();
    } catch (cause) {
      setError(getErrorMessage(cause));
    } finally {
      setStartingRequest(false);
    }
  }

  function handleQuestionKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (
      event.key === "Enter" &&
      !event.shiftKey &&
      !event.nativeEvent.isComposing
    ) {
      event.preventDefault();
      event.currentTarget.form?.requestSubmit();
    }
  }

  return (
    <AppShell active="ai" className="ai-page-content">
      <header className="page-header compact-header ai-page-header">
        <div>
          <p className="eyebrow">AI Chat</p>
          <h1>AI 챗봇</h1>
          <p>다양한 질문 및 일정과 메모를 조회하고 정리할 수 있습니다.</p>
        </div>
        <span className="stage-badge">Ollama · Qwen 2.5</span>
      </header>

      <section className="ai-workspace" aria-label="AI 대화">
        <aside className="conversation-sidebar">
          <div className="conversation-sidebar-header">
            <div>
              <span>대화</span>
              <strong>{conversations.length}</strong>
            </div>
            <button
              className="icon-button"
              type="button"
              title="새 대화"
              aria-label="새 대화"
              onClick={startConversation}
            >
              +
            </button>
          </div>
          <div className="conversation-list">
            {conversations.map((conversation) => (
              <div
                className={`conversation-item ${selectedId === conversation.conversationId ? "is-current" : ""}`}
                key={conversation.conversationId}
              >
                {editingConversationId === conversation.conversationId ? (
                  <input
                    className="conversation-title-input"
                    value={conversationTitle}
                    maxLength={120}
                    aria-label="대화 제목"
                    autoFocus
                    onFocus={(event) => event.currentTarget.select()}
                    onChange={(event) =>
                      setConversationTitle(event.target.value)
                    }
                    onBlur={() =>
                      saveConversationTitle(conversation.conversationId)
                    }
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        event.preventDefault();
                        saveConversationTitle(conversation.conversationId);
                      }
                      if (event.key === "Escape") {
                        setEditingConversationId(null);
                        setConversationTitle("");
                      }
                    }}
                  />
                ) : (
                  <button
                    className="conversation-select"
                    type="button"
                    onClick={() => setSelectedId(conversation.conversationId)}
                  >
                    <strong>{conversation.title}</strong>
                    <span
                      className={
                        pendingRequests.some(
                          (request) =>
                            request.conversationId === conversation.conversationId,
                        )
                          ? "is-generating"
                          : undefined
                      }
                    >
                      {pendingRequests.some(
                        (request) =>
                          request.conversationId === conversation.conversationId,
                      )
                        ? "답변 생성 중"
                        : `준비됨 · ${formatConversationDate(conversation.updatedAt)}`}
                    </span>
                  </button>
                )}
                <button
                  className="conversation-edit"
                  type="button"
                  title={
                    editingConversationId === conversation.conversationId
                      ? "제목 저장"
                      : "대화명 수정"
                  }
                  aria-label={`${conversation.title} ${editingConversationId === conversation.conversationId ? "제목 저장" : "대화명 수정"}`}
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() =>
                    editingConversationId === conversation.conversationId
                      ? saveConversationTitle(conversation.conversationId)
                      : startConversationEdit(conversation)
                  }
                >
                  {editingConversationId === conversation.conversationId ? (
                    <Check size={15} aria-hidden="true" />
                  ) : (
                    <Pencil size={14} aria-hidden="true" />
                  )}
                </button>
                <button
                  className="conversation-delete"
                  type="button"
                  title="대화 삭제"
                  aria-label={`${conversation.title} 삭제`}
                  onClick={() =>
                    removeConversation(conversation.conversationId)
                  }
                >
                  <X size={16} aria-hidden="true" />
                </button>
              </div>
            ))}
            {!pageLoading && conversations.length === 0 && (
              <p className="conversation-empty">저장된 대화가 없습니다.</p>
            )}
          </div>
        </aside>

        <div className="chat-panel">
          <div className="chat-panel-header">
            <div>
              <strong>{selectedConversation?.title ?? "새 대화"}</strong>
              <span className={loading ? "is-loading" : ""}>
                {loading ? "답변 생성 중" : "준비됨"}
              </span>
            </div>
          </div>
          <div className="chat-log" aria-live="polite">
            {pageLoading && messages.length === 0 ? (
              <p className="chat-status">대화를 불러오고 있습니다.</p>
            ) : messages.length === 0 ? (
              <div className="chat-empty">
                <span className="chat-symbol">AI</span>
                <h2>무엇을 도와드릴까요?</h2>
                <p>
                  일정 조회·등록, 메모 검색·요약 또는 일반 질문을 입력하세요.
                </p>
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
                  key={message.messageId}
                >
                  <header>
                    <strong>{message.role === "user" ? "나" : "AI"}</strong>
                    <time>{formatMessageTime(message.createdAt)}</time>
                  </header>
                  <MessageContent content={message.content} />
                </article>
              ))
            )}
            {loading && (
              <div className="chat-loading" role="status">
                <span />
                <span />
                <span />
                <em>답변을 생성하고 있습니다.</em>
              </div>
            )}
            {error && (
              <p className="chat-error" role="alert">
                {error}
              </p>
            )}
            <div ref={chatEndRef} />
          </div>

          <form className="chat-form" onSubmit={submit}>
            <label htmlFor="aiQuestion">메시지</label>
            <div className="chat-input-row">
              <textarea
                id="aiQuestion"
                rows={3}
                maxLength={4000}
                value={question}
                onChange={(event) => setQuestion(event.target.value)}
                onKeyDown={handleQuestionKeyDown}
                placeholder="메시지를 입력하세요. Enter로 전송, Shift+Enter로 줄바꿈"
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
              <span>
                AI는 실수를 할 수 있습니다! 답변 내용을 한 번씩 확인해 주시기
                바랍니다.
              </span>
            </div>
          </form>
        </div>
      </section>
    </AppShell>
  );
}

function MessageContent({ content }: { content: string }) {
  return (
    <div className="chat-markdown">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          a: (props) => <a {...props} target="_blank" rel="noreferrer" />,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}

function getErrorMessage(cause: unknown) {
  if (cause instanceof ApiError) return cause.message;
  return "AI 서비스에 연결할 수 없습니다. 백엔드 실행 상태를 확인해 주세요.";
}

function formatMessageTime(value: string) {
  return new Intl.DateTimeFormat("ko-KR", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(value));
}

function formatConversationDate(value: string) {
  const date = new Date(value);
  const today = new Date();
  if (
    date.getFullYear() === today.getFullYear() &&
    date.getMonth() === today.getMonth() &&
    date.getDate() === today.getDate()
  )
    return formatMessageTime(value);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}
