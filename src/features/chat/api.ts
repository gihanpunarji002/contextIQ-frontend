import { api } from "../../lib/api/client";
export interface Conversation {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
}
export interface Source {
  documentId: string;
  chunkId: string;
  filename: string;
  chunkIndex: number;
  content: string;
  score: number;
}
export interface Message {
  id: string;
  role: "USER" | "ASSISTANT";
  content: string;
  createdAt: string;
  mode: "MOCK" | "OPENAI" | "OLLAMA" | null;
  model: string | null;
  inputTokens: number | null;
  outputTokens: number | null;
  retrievalUsed: boolean;
  sources: Source[];
}
export interface ChatReply {
  conversationId: string;
  userMessageId: string;
  assistantMessageId: string;
  response: string;
  mode: "MOCK" | "OPENAI" | "OLLAMA";
  model: string | null;
  inputTokens: number | null;
  outputTokens: number | null;
  retrievalUsed: boolean;
  sources: Source[];
}
export interface AiStatus {
  mode: "MOCK" | "OPENAI" | "OLLAMA";
  model: string | null;
  configured: boolean;
  documentSearch?: boolean;
}
export const chatApi = {
  status: async () => (await api.get<AiStatus>("/ai/status")).data,
  conversations: async () =>
    (await api.get<Conversation[]>("/chat/conversations")).data,
  messages: async (id: string) =>
    (await api.get<Message[]>(`/chat/conversations/${id}/messages`)).data,
  send: async (data: { message: string; conversationId?: string; useDocuments?: boolean }) =>
    (await api.post<ChatReply>("/chat/messages", data, { timeout: 270000 }))
      .data,
};
