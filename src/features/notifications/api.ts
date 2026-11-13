import { api } from "../../lib/api/client";
export interface Invitation {
  id: string; organizationId: string; organizationName: string; recipientEmail: string;
  invitedByName: string; status: "PENDING" | "ACCEPTED" | "REJECTED" | "EXPIRED";
  createdAt: string; expiresAt: string; readAt: string | null;
  emailStatus: "QUEUED" | "PROCESSING" | "SENT" | "FAILED" | "DISABLED" | "CANCELLED";
}
export interface NotificationPage { items: Invitation[]; unreadCount: number; hasMore: boolean }
export const notificationApi = {
  list: async (offset: number) => (await api.get<NotificationPage>("/notifications", { params: { offset } })).data,
  read: async () => { await api.post("/notifications/read"); },
  respond: async ({ id, decision }: { id: string; decision: "ACCEPT" | "REJECT" }) =>
    (await api.post<Invitation>(`/notifications/${id}/respond`, { decision })).data,
  sent: async (organization: string) => (await api.get<Invitation[]>(`/organizations/${organization}/invitations`)).data,
  retryEmail: async ({ organization, id }: { organization: string; id: string }) =>
    (await api.post<Invitation>(`/organizations/${organization}/invitations/${id}/email`)).data,
};
