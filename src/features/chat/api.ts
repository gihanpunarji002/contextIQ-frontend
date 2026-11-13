import { workspaceConfig } from "../workspaces/api";
import { api } from "../../lib/api/client";
export interface SelectedDocument {
  id: string;
  filename: string;
  available: boolean;
}
export interface SelectedFolder { id: string; name: string; available: boolean; documentCount: number }
export interface DocumentContext {
  useDocuments: boolean;
  documents: SelectedDocument[];
  folders: SelectedFolder[];
}
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
  documentSelection?: boolean;
  folderSelection?: boolean;
}
export const chatApi = {
  context: async (id: string, workspaceId?: string) =>
    (await api.get<DocumentContext>(`/chat/conversations/${id}/documents`, workspaceConfig(workspaceId)))
      .data,
  selectDocuments: async ({
    id,
    context,
    workspaceId,
  }: {
    id: string;
    context: DocumentContext;
    workspaceId?: string;
  }) =>
    (
      await api.post<DocumentContext>(`/chat/conversations/${id}/documents`, {
        useDocuments: context.useDocuments,
        documentIds: context.documents.map((d) => d.id),
        folderIds: context.folders.map(f => f.id),
      }, workspaceConfig(workspaceId))
    ).data,
  status: async () => (await api.get<AiStatus>("/ai/status")).data,
  conversations: async (workspaceId?: string) =>
    (await api.get<Conversation[]>("/chat/conversations", workspaceConfig(workspaceId))).data,
  messages: async (id: string, workspaceId?: string) =>
    (await api.get<Message[]>(`/chat/conversations/${id}/messages`, workspaceConfig(workspaceId))).data,
  send: async ({ workspaceId, ...data }: {
    workspaceId?: string;
    message: string;
    conversationId?: string;
    useDocuments?: boolean;
    documentIds?: string[];
    folderIds?: string[];
  }) =>
    (await api.post<ChatReply>("/chat/messages", data, { timeout: 270000, ...workspaceConfig(workspaceId) }))
      .data,
};
