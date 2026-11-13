import type { Invitation } from "../notifications/api";
import { api } from "../../lib/api/client";
export type WorkspaceRole = "ADMIN" | "EDITOR" | "VIEWER";
export interface Workspace { id: string; organizationId: string; organizationName: string; name: string; description: string; role: WorkspaceRole; personal: boolean; documentCount: number; folderCount: number; memberCount: number; createdBy: string; createdAt: string }
export interface Organization { id: string; name: string; role: "ADMIN" | "MEMBER" }
export interface Member { userId: string; firstName: string; lastName: string; email: string; role: string }
export const workspaceApi = {
  list: async () => (await api.get<Workspace[]>("/workspaces")).data,
  organizations: async () => (await api.get<Organization[]>("/organizations")).data,
  createOrganization: async (name: string) => (await api.post<Organization>("/organizations", { name })).data,
  create: async ({ organizationId, ...data }: { organizationId: string; name: string; description: string }) =>
    (await api.post<Workspace>(`/organizations/${organizationId}/workspaces`, data)).data,
  update: async ({ id, ...data }: { id: string; name: string; description: string }) => (await api.post<Workspace>(`/workspaces/${id}`, data)).data,
  remove: async (id: string) => { await api.delete(`/workspaces/${id}`); },
  members: async (id: string) => (await api.get<Member[]>(`/workspaces/${id}/members`)).data,
  organizationMembers: async (id: string) => (await api.get<Member[]>(`/organizations/${id}/members`)).data,
  addOrganizationMember: async ({ id, email }: { id: string; email: string }) => (await api.post<Invitation>(`/organizations/${id}/members`, { email })).data,
  setMember: async ({ id, ...data }: { id: string; email: string; role: WorkspaceRole }) => { await api.post(`/workspaces/${id}/members`, data); },
  removeMember: async ({ id, userId }: { id: string; userId: string }) => { await api.delete(`/workspaces/${id}/members/${userId}`); },
};
export function workspaceConfig(workspaceId?: string) { return workspaceId ? { headers: { "X-Workspace-Id": workspaceId } } : {}; }
