import { workspaceConfig } from "../workspaces/api";
import { api } from "../../lib/api/client";
export interface DocumentRecord {
  id: string;
  folderId: string | null;
  workspaceId: string;
  createdBy: string;
  filename: string;
  sizeBytes: number;
  chunkCount: number;
  embeddingModel: string;
  createdAt: string;
}
export const documentApi = {
  list: async (workspaceId?: string) => (await api.get<DocumentRecord[]>("/documents", workspaceConfig(workspaceId))).data,
  upload: async ({ file, folderId, workspaceId }: { file: File; folderId?: string; workspaceId?: string }) => {
    const form = new FormData();
    form.append("file", file);
    if (folderId) form.append("folderId", folderId);
    return (await api.post<DocumentRecord>("/documents", form, { timeout: 150000, ...workspaceConfig(workspaceId) })).data;
  },
  remove: async (id: string, workspaceId?: string) => { await api.delete(`/documents/${id}`, workspaceConfig(workspaceId)); },
};
