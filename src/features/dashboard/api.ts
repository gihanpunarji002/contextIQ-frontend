import { api } from "../../lib/api/client";
export interface Summary {
  mode: "MOCK";
  documents: number;
  conversations: number;
  queries: number;
  workspaces: number;
}
export const getSummary = async () =>
  (await api.get<Summary>("/dashboard/summary")).data;
