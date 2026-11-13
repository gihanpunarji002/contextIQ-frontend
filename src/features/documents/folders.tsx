import { Folder, BriefcaseBusiness, Landmark, ClipboardCheck, FileSignature, Layers, Users, Archive } from "lucide-react";
import { workspaceConfig } from "../workspaces/api";
import { api } from "../../lib/api/client";
import "./documents.css";

export const folderIcons = {
  FOLDER: { label: "Folder", icon: Folder }, WORK: { label: "Work", icon: BriefcaseBusiness },
  ACCOUNTS: { label: "Accounts", icon: Landmark }, AUDITS: { label: "Audits", icon: ClipboardCheck },
  AGREEMENT: { label: "Agreement", icon: FileSignature }, PROJECT: { label: "Project", icon: Layers },
  PEOPLE: { label: "People", icon: Users }, ARCHIVE: { label: "Archive", icon: Archive },
};
export const folderColors = ["BLUE", "VIOLET", "GREEN", "AMBER", "ROSE", "SLATE"] as const;
export type FolderIconName = keyof typeof folderIcons;
export type FolderColor = typeof folderColors[number];
export interface FolderInput { name: string; icon: FolderIconName; color: FolderColor; parentId?: string | null }
export interface DocumentFolder extends FolderInput { id: string; documentCount: number; createdAt: string; workspaceId: string; createdBy: string }
export function FolderIcon({ name, size = 17 }: { name: FolderIconName; size?: number }) {
  const Icon = folderIcons[name]?.icon ?? Folder;
  return <Icon size={size} strokeWidth={1.7} aria-hidden="true" />;
}
export const folderApi = {
  list: async (workspaceId?: string) => (await api.get<DocumentFolder[]>("/folders", workspaceConfig(workspaceId))).data,
  save: async ({ id, workspaceId, ...data }: FolderInput & { id?: string; workspaceId?: string }) =>
    (await api.post<DocumentFolder>(id ? `/folders/${id}` : "/folders", data, workspaceConfig(workspaceId))).data,
  move: async ({ workspaceId, ...data }: { documentIds: string[]; folderId: string | null; workspaceId?: string }) => {
    await api.post("/folders/move", data, workspaceConfig(workspaceId));
  },
};

export function folderPath(folder: DocumentFolder, folders: DocumentFolder[]): string {
  const names = [folder.name]; const seen = new Set([folder.id]); let parent = folder.parentId;
  while (parent && !seen.has(parent)) { seen.add(parent); const item = folders.find(f => f.id === parent); if (!item) break; names.unshift(item.name); parent = item.parentId; }
  return names.join(" / ");
}
export function insideFolder(folderId: string | null, rootId: string, folders: DocumentFolder[]): boolean {
  const seen = new Set<string>(); let id = folderId;
  while (id && !seen.has(id)) { if (id === rootId) return true; seen.add(id); id = folders.find(f => f.id === id)?.parentId ?? null; }
  return false;
}
