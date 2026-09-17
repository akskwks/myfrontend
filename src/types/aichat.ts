export type AiChatRequest = {
  message: string;
};

export type AiChatResponse = {
  answer: string;
};

export type ChatMessage = {
  id: number;
  role: "user" | "assistant";
  content: string;
};
