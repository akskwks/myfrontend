import type { AiChatRequest, AiChatResponse } from "../types/aichat";
import { jsonHeaders, request } from "./http";

const AI_CHAT_API_URL = "/api/ai/chat";

export async function askLlm(payload: AiChatRequest): Promise<AiChatResponse> {
  return request<AiChatResponse>(AI_CHAT_API_URL, {
    method: "POST",
    headers: jsonHeaders,
    body: JSON.stringify(payload),
  });
}
