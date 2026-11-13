import axios from "axios";
import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Bell, Building2, Check, CheckCheck, X } from "lucide-react";
import { useAuth } from "../../app/providers/AuthProvider";
import { Button, EmptyState, ErrorState, LoadingState } from "../../components/ui";
import { errorMessage } from "../../lib/api/client";
import { notificationApi } from "./api";
import "./notifications.css";

export function NotificationPanel() {
  const { user } = useAuth();
  const [params, setParams] = useSearchParams();
  const [open, setOpen] = useState(false);
  const [offset, setOffset] = useState(0);
  const root = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const closeButton = useRef<HTMLButtonElement>(null);
  const cache = useQueryClient();
  const notifications = useQuery({ queryKey: ["notifications", user?.id, offset], queryFn: () => notificationApi.list(offset), refetchInterval: 30000 });
  const refresh = async () => { await Promise.all(["notifications", "organizations", "organization-members", "organization-invitations", "workspaces"].map(key => cache.invalidateQueries({ queryKey: [key] }))); };
  const respond = useMutation({ mutationFn: notificationApi.respond, onSuccess: async () => { await refresh(); closeButton.current?.focus(); }, onError: () => cache.invalidateQueries({ queryKey: ["notifications"] }) });
  const read = useMutation({ mutationFn: notificationApi.read, onSuccess: () => cache.invalidateQueries({ queryKey: ["notifications"] }) });
  useEffect(() => {
    if (params.get("notifications") === "open") {
      setOpen(true);
      setParams(previous => { const next = new URLSearchParams(previous); next.delete("notifications"); return next; }, { replace: true });
    }
  }, [params, setParams]);
  useEffect(() => {
    if (!open) return;
    closeButton.current?.focus();
    const pointer = (e: PointerEvent) => { if (!root.current?.contains(e.target as Node)) setOpen(false); };
    const keyboard = (e: KeyboardEvent) => { if (e.key === "Escape") { setOpen(false); trigger.current?.focus(); } };
    document.addEventListener("pointerdown", pointer); document.addEventListener("keydown", keyboard);
    return () => { document.removeEventListener("pointerdown", pointer); document.removeEventListener("keydown", keyboard); };
  }, [open]);
  const unread = notifications.data?.unreadCount ?? 0;
  const loadError = axios.isAxiosError(notifications.error) && notifications.error.response?.status === 404
    ? "Notifications require the updated backend. Rebuild the backend container, then retry."
    : errorMessage(notifications.error);
  function close() { setOpen(false); trigger.current?.focus(); }
  return <div className="notification-anchor" ref={root} onBlur={e => { if (e.relatedTarget && !e.currentTarget.contains(e.relatedTarget as Node)) setOpen(false); }}>
    <button ref={trigger} className="icon-button notification-trigger" aria-label={`Notifications${unread ? `, ${unread} unread` : ""}`} aria-expanded={open} aria-controls="account-notifications" aria-haspopup="dialog" onClick={() => setOpen(!open)}>
      <Bell size={19} />{unread > 0 && <span className="notification-count">{unread > 99 ? "99+" : unread}</span>}
    </button>
    {open && <section className="notification-panel" id="account-notifications" role="dialog" aria-labelledby="notifications-title">
      <header><div><h2 id="notifications-title">Notifications</h2><p>Invitations & account updates</p></div><button ref={closeButton} className="icon-button" aria-label="Close notifications" onClick={close}><X size={18} /></button></header>
      <div className="notification-toolbar"><span>{notifications.isError ? "Unavailable" : notifications.isPending ? "Loading…" : `${unread} unread`}</span><button disabled={!unread || read.isPending} onClick={() => read.mutate()}><CheckCheck size={14} /> Mark all read</button></div>
      <div className="notification-items">
        {respond.isError && <ErrorState message={errorMessage(respond.error)} />}
        {read.isError && <ErrorState message={errorMessage(read.error)} />}
        {notifications.isPending ? <LoadingState /> : notifications.isError ? <ErrorState message={loadError} retry={() => void notifications.refetch()} /> : notifications.data.items.length === 0 ? <EmptyState title="You're all caught up">Organization invitations will appear here.</EmptyState> : notifications.data.items.map(invite => <article key={invite.id} className={`notification-item ${!invite.readAt ? "is-unread" : ""}`}>
          <span className="invitation-icon"><Building2 size={19} /></span><div className="notification-content"><span className={`invitation-status status-${invite.status.toLowerCase()}`}>{invite.status === "REJECTED" ? "Declined" : invite.status.toLowerCase()}</span>
            <h3>{invite.organizationName}</h3><p>{invite.invitedByName} invited you to join this organization.</p>
            <time dateTime={invite.createdAt}>{new Date(invite.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })}</time>
            {invite.status === "PENDING" ? <><small>Expires {new Date(invite.expiresAt).toLocaleDateString()}</small><div className="invitation-actions">
              <Button className="primary" disabled={respond.isPending} onClick={() => respond.mutate({ id: invite.id, decision: "ACCEPT" })}><Check size={14} /> Accept</Button>
              <Button disabled={respond.isPending} onClick={() => respond.mutate({ id: invite.id, decision: "REJECT" })}>Decline</Button>
            </div></> : <small>{invite.status === "ACCEPTED" ? "You accepted this invitation. Workspace access is managed separately." : invite.status === "EXPIRED" ? "Ask an admin for a new invitation." : invite.status === "CANCELLED" ? "This invitation was withdrawn. Ask an admin if you still need access." : "You did not join this organization."}</small>}
          </div></article>)}
      </div>
      {(offset > 0 || notifications.data?.hasMore) && <div className="notification-pagination"><Button disabled={offset === 0} onClick={() => setOffset(Math.max(0, offset - 20))}>Newer</Button><span>Page {offset / 20 + 1}</span><Button disabled={!notifications.data?.hasMore || offset >= 10000} onClick={() => setOffset(offset + 20)}>Older</Button></div>}
      <footer>Joining an organization requires your approval.</footer>
    </section>}
  </div>;
}
