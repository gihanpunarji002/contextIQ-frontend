import { api } from "../../lib/api/client";
export interface DocumentRecord {
  id: string;
  filename: string;
  sizeBytes: number;
  chunkCount: number;
  embeddingModel: string;
  createdAt: string;
}
export const documentApi = {
  list: async () => (await api.get<DocumentRecord[]>("/documents")).data,
  upload: async (file: File) => {
    const form = new FormData();
    form.append("file", file);
    return (await api.post<DocumentRecord>("/documents", form, { timeout: 150000 })).data;
  },
  remove: async (id: string) => { await api.delete(`/documents/${id}`); },
};
