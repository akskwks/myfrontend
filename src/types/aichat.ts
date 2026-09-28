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
  role: "user" | "assistant";
  content: string;
  createdAt: string;
};

export type AiConversation = {
  conversationId: number;
  title: string;
  createdAt: string;
  updatedAt: string;
};
