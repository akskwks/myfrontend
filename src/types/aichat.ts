/**
*
* 파일명 : aichat.ts
* 역할 : AI 대화방, 메시지 및 채팅 작업의 TypeScript 타입을 정의하는 파일
* 생성일 : 2026-09-17
*
**/

export type AiChatRequest = {
  conversationId?: number | null;
  message: string;
};

export type AiChatJob = {
  requestId: string;
  conversationId: number;
  status: "processing" | "completed";
  failed: boolean;
  message: ChatMessage | null;
};

export type ChatMessage = {
  messageId: number;
  conversationId: number;
  role: "user" | "assistant" | "exception";
  content: string;
  createdAt: string;
};

export type AiConversation = {
  conversationId: number;
  title: string;
  createdAt: string;
  updatedAt: string;
};
