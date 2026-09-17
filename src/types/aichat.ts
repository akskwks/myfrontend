export type AiChatRequest = {
  conversationId?: number | null;
  message: string;
};

export type AiChatResponse = {
  conversationId: number;
  answer: string;
  message: ChatMessage;
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
