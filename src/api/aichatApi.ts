import type {
  AiChatRequest,
  AiChatJob,
  AiConversation,
  ChatMessage,
} from "../types/aichat";
import { jsonHeaders, request } from "./http";

const AI_CHAT_API_URL = "/api/ai/chat";
const AI_CONVERSATION_API_URL = "/api/ai/conversations";

export async function startAiRequest(payload: AiChatRequest) {
  return request<AiChatJob>(AI_CHAT_API_URL, {
    method: "POST",
    headers: jsonHeaders,
    body: JSON.stringify(payload),
  });
}

export function getAiRequest(requestId: string) {
  return request<AiChatJob>(`${AI_CHAT_API_URL}/${requestId}`);
}

export function getConversations() {
  return request<AiConversation[]>(AI_CONVERSATION_API_URL);
}

export function createConversation(title = "새 대화") {
  return request<AiConversation>(AI_CONVERSATION_API_URL, {
    method: "POST",
    headers: jsonHeaders,
    body: JSON.stringify({ title }),
  });
}

export function updateConversationTitle(conversationId: number, title: string) {
  return request<AiConversation>(`${AI_CONVERSATION_API_URL}/${conversationId}`, {
    method: "PUT",
    headers: jsonHeaders,
    body: JSON.stringify({ title }),
  });
}

export function getConversationMessages(conversationId: number) {
  return request<ChatMessage[]>(
    `${AI_CONVERSATION_API_URL}/${conversationId}/messages`,
  );
}

export function deleteConversation(conversationId: number) {
  return request<void>(`${AI_CONVERSATION_API_URL}/${conversationId}`, {
    method: "DELETE",
  });
}
