import { api } from "../../lib/api/client";
export interface Conversation {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
}
export interface Message {
  id: string;
  role: "USER" | "ASSISTANT";
  content: string;
  createdAt: string;
}
export interface ChatReply {
  conversationId: string;
  userMessageId: string;
  assistantMessageId: string;
  response: string;
  mode: "MOCK";
}
export const chatApi = {
  conversations: async () =>
    (await api.get<Conversation[]>("/chat/conversations")).data,
  messages: async (id: string) =>
    (await api.get<Message[]>(`/chat/conversations/${id}/messages`)).data,
  send: async (data: { message: string; conversationId?: string }) =>
    (await api.post<ChatReply>("/chat/messages", data)).data,
};
