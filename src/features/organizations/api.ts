import { api } from "../../lib/api/client";
import type { Member } from "../workspaces/api";
export type OrganizationRole = "ADMIN" | "MEMBER";
export interface OrganizationMember extends Member { role: OrganizationRole; workspaceCount: number }
export const organizationApi = {
  members: async (id: string) => (await api.get<OrganizationMember[]>(`/organizations/${id}/members`)).data,
  changeRole: async ({ id, userId, role }: { id: string; userId: string; role: OrganizationRole }) => {
    await api.patch(`/organizations/${id}/members/${userId}`, { role });
  },
  remove: async ({ id, userId }: { id: string; userId: string }) => { await api.delete(`/organizations/${id}/members/${userId}`); },
};
